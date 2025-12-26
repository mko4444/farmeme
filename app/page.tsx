/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import dayjs from "@/lib/day";
import { Fragment } from "react";
import { getTrendingCastsWithUrls } from "@/lib/neynar";
import { processTrendingCasts } from "@/util/processTrendingCasts";
import { removeOrReplaceUrl } from "@/util/removeOrReplaceUrl";
import { insertNamesAtPoints } from "@/util/insertNamesAtPoints";
import { getHashUri } from "@/util/getHashUri";

export const revalidate = 60;

export default async function Home() {
  const data = await fetchData();

  return (
    <main
      className="main"
      style={{
        padding: "0 1rem",
      }}
    >
      <h2>Top News</h2>
      {data
        .sort(
          (a, b) =>
            // sort first by # of unique authors and then by timestamp
            b.unique_authors.length - a.unique_authors.length || b.last_timestamp - a.last_timestamp
        )
        .map(({ url, rest_of_casts, last_cast, first_cast, hostname, metadata, last_timestamp }, index) => (
          <div className="card col max-w" key={index}>
            <span>
              <Link target="_blank" href={`https://warpcast.com/${first_cast.author.fname}`}>
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
                <Link target="_blank" href={last_cast.embedded_urls[0]}>
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
                      .filter((f: any) => f.author.fname !== first_cast?.author?.fname)
                      .map(({ author, hash }: any, i: number) => (
                        <Fragment key={author.fid}>
                          {i > 0 && <span>, </span>}
                          <Link target="_blank" href={`https://warpcast.com/${author.fname}/${getHashUri(hash)}`}>
                            <span>@{author.fname}</span>
                          </Link>
                        </Fragment>
                      ))}
                  </p>
                )}
                <span style={{ opacity: 0.66 }}>Last casted {dayjs(last_timestamp).fromNow()}</span>
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
        ))}
    </main>
  );
}

// Mock data fallback when API key is not configured
const mockCasts = [
  {
    hash: "0x123abc456def",
    text: "Breaking: Major tech announcement today! https://example.com/tech-news",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    fid: 1,
    mentions_positions: [],
    mention_fids: [],
    embedded_urls: ["https://example.com/tech-news"],
    deleted_at: null,
    author: { fid: 1, fname: "alice", display_name: "Alice", pfp_url: null },
    mentions: [],
  },
  {
    hash: "0x789ghi012jkl",
    text: "This is incredible news for the community https://example.com/tech-news",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    fid: 2,
    mentions_positions: [],
    mention_fids: [],
    embedded_urls: ["https://example.com/tech-news"],
    deleted_at: null,
    author: { fid: 2, fname: "bob", display_name: "Bob", pfp_url: null },
    mentions: [],
  },
  {
    hash: "0xabc123def456",
    text: "Great discussion on this topic https://example.com/tech-news",
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    fid: 3,
    mentions_positions: [],
    mention_fids: [],
    embedded_urls: ["https://example.com/tech-news"],
    deleted_at: null,
    author: { fid: 3, fname: "charlie", display_name: "Charlie", pfp_url: null },
    mentions: [],
  },
];

async function fetchData() {
  const apiKey = process.env.NEYNAR_API_KEY;

  if (!apiKey) {
    console.warn("[Neynar] No API key configured, using mock data. Set NEYNAR_API_KEY env var.");
    return await processTrendingCasts(mockCasts);
  }

  try {
    // Fetch trending casts from the last 24 hours, ranked by engagement
    const casts = await getTrendingCastsWithUrls({
      timeWindow: "24h",
      limit: 100,
      apiKey,
    });

    // Filter out unwanted domains
    const filteredCasts = casts.filter((cast) => {
      const hasBlockedDomain = cast.embedded_urls.some((url) =>
        ["imgur.com", "warpcast.com", "far.quest", "farquest.app"].some((blocked) =>
          url.toLowerCase().includes(blocked)
        )
      );
      return !hasBlockedDomain && cast.author.fname;
    });

    return await processTrendingCasts(filteredCasts);
  } catch (error) {
    console.error("[Neynar] API error, falling back to mock data:", error);
    return await processTrendingCasts(mockCasts);
  }
}
