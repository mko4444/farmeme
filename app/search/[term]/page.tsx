/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import dayjs from "@/lib/day";
import { Fragment } from "react";
import { processTrendingCasts } from "@/util/processTrendingCasts";
import { removeOrReplaceUrl } from "@/util/removeOrReplaceUrl";
import { insertNamesAtPoints } from "@/util/insertNamesAtPoints";
import { getHashUri } from "@/util/getHashUri";

export const revalidate = 0;

// Neynar search API
async function searchCasts(query: string, apiKey: string) {
  const url = new URL("https://api.neynar.com/v2/farcaster/cast/search");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "25");

  const response = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      "x-api-key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Neynar API error: ${response.status}`);
  }

  const data = await response.json();
  return data.result?.casts || [];
}

// Transform Neynar cast to expected format
function transformCast(cast: any) {
  const embedded_urls =
    cast.embeds?.filter((e: any) => e.url).map((e: any) => e.url) || [];

  return {
    hash: cast.hash,
    text: cast.text,
    timestamp: new Date(cast.timestamp),
    fid: cast.author.fid,
    mentions_positions: [] as number[],
    mention_fids: cast.mentioned_profiles?.map((p: any) => p.fid) || [],
    embedded_urls,
    deleted_at: null,
    author: {
      fid: cast.author.fid,
      fname: cast.author.username,
      display_name: cast.author.display_name,
      pfp_url: cast.author.pfp_url,
    },
    mentions:
      cast.mentioned_profiles?.map((p: any) => ({
        fid: p.fid,
        fname: p.username,
      })) || [],
  };
}

export default async function Home({
  params: { term },
}: {
  params: { term: string };
}) {
  const data = await fetchData(decodeURIComponent(term));

  return (
    <main
      className="main"
      style={{
        padding: "0 1rem",
      }}
    >
      <h2>
        {data?.length > 0
          ? `Results for "${decodeURIComponent(term)}"`
          : `No results for "${decodeURIComponent(term)}"`}
      </h2>
      {data
        .sort(
          (a, b) =>
            b.unique_authors.length - a.unique_authors.length ||
            b.last_timestamp - a.last_timestamp
        )
        .map(
          (
            {
              url,
              rest_of_casts,
              last_cast,
              first_cast,
              hostname,
              metadata,
              last_timestamp,
            },
            index
          ) => (
            <div className="card col max-w" key={index}>
              <span>
                <Link
                  target="_blank"
                  href={`https://warpcast.com/${first_cast.author.fname}`}
                >
                  <label>@{first_cast.author.fname}</label>
                </Link>
                <label style={{ margin: "0 .25rem", opacity: 0.5 }}>/</label>
                <Link target="_blank" href={`https://${hostname}`}>
                  <label>{hostname}</label>
                </Link>
                <Link
                  target="_blank"
                  href={`https://warpcast.com/${first_cast.author.fname}/${getHashUri(first_cast.hash)}`}
                  style={{ marginLeft: ".5rem", color: "inherit", opacity: 0.66 }}
                >
                  View cast
                </Link>
              </span>
              <div className="max-w row-sb-fs" style={{ gap: "1rem" }}>
                <div className="col flex" style={{ gap: ".33rem" }}>
                  <Link target="_blank" href={last_cast?.embedded_urls?.[0] || url}>
                    <h1 className="line-3">
                      {removeOrReplaceUrl(
                        insertNamesAtPoints(
                          first_cast.text,
                          first_cast.mention_fids,
                          first_cast.mentions_positions,
                          first_cast.mentions
                        )
                      ) ||
                        metadata.title ||
                        url}
                    </h1>
                  </Link>
                  <span className="line-3">{metadata.description}</span>
                  {rest_of_casts.length > 0 && (
                    <p>
                      <b style={{ color: "#408840" }}>More: </b>
                      {rest_of_casts
                        .filter(
                          (f: any) => f.author.fname !== first_cast?.author?.fname
                        )
                        .map(({ author, hash }: any, i: number) => (
                          <Fragment key={author.fid}>
                            {i > 0 && <span>, </span>}
                            <Link
                              target="_blank"
                              href={`https://warpcast.com/${author.fname}/${getHashUri(hash)}`}
                            >
                              <span>@{author.fname}</span>
                            </Link>
                          </Fragment>
                        ))}
                    </p>
                  )}
                  <span style={{ opacity: 0.66 }}>
                    Last casted {dayjs(last_timestamp).fromNow()}
                  </span>
                </div>
                {metadata.image && (
                  <img
                    alt="img"
                    src={metadata.image}
                    height={80}
                    width={100}
                    style={{
                      objectFit: "cover",
                    }}
                  />
                )}
              </div>
            </div>
          )
        )}
    </main>
  );
}

async function fetchData(term: string) {
  const apiKey = process.env.NEYNAR_API_KEY;

  if (!apiKey) {
    console.warn("[Neynar] No API key configured for search");
    return [];
  }

  try {
    const casts = await searchCasts(term, apiKey);
    const transformedCasts = casts.map(transformCast);

    // Filter to only casts with URLs
    const castsWithUrls = transformedCasts.filter(
      (cast: any) => cast.embedded_urls.length > 0
    );

    return await processTrendingCasts(castsWithUrls);
  } catch (error) {
    console.error("[Neynar] Search error:", error);
    return [];
  }
}
