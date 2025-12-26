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
      {data.length === 0 && (
        <div style={{ padding: "1rem", opacity: 0.66 }}>
          No trending news found. Set NEYNAR_API_KEY for real data.
        </div>
      )}
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
  // Story 1: Tech news (3 authors)
  {
    hash: "0x123abc456def",
    text: "Breaking: Major tech announcement today! https://techcrunch.com/big-news",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    fid: 1,
    mentions_positions: [],
    mention_fids: [],
    embedded_urls: ["https://techcrunch.com/big-news"],
    deleted_at: null,
    author: { fid: 1, fname: "alice", display_name: "Alice", pfp_url: null },
    mentions: [],
  },
  {
    hash: "0x789ghi012jkl",
    text: "This is incredible news https://techcrunch.com/big-news",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    fid: 2,
    mentions_positions: [],
    mention_fids: [],
    embedded_urls: ["https://techcrunch.com/big-news"],
    deleted_at: null,
    author: { fid: 2, fname: "bob", display_name: "Bob", pfp_url: null },
    mentions: [],
  },
  {
    hash: "0xabc123def456",
    text: "Everyone needs to see this https://techcrunch.com/big-news",
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    fid: 3,
    mentions_positions: [],
    mention_fids: [],
    embedded_urls: ["https://techcrunch.com/big-news"],
    deleted_at: null,
    author: { fid: 3, fname: "charlie", display_name: "Charlie", pfp_url: null },
    mentions: [],
  },
  // Story 2: Crypto news (2 authors)
  {
    hash: "0xdef456ghi789",
    text: "New research on L2 scaling https://ethereum.org/research",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    fid: 4,
    mentions_positions: [],
    mention_fids: [],
    embedded_urls: ["https://ethereum.org/research"],
    deleted_at: null,
    author: { fid: 4, fname: "vitalik", display_name: "Vitalik", pfp_url: null },
    mentions: [],
  },
  {
    hash: "0xghi789jkl012",
    text: "Important findings here https://ethereum.org/research",
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    fid: 5,
    mentions_positions: [],
    mention_fids: [],
    embedded_urls: ["https://ethereum.org/research"],
    deleted_at: null,
    author: { fid: 5, fname: "dwr", display_name: "Dan", pfp_url: null },
    mentions: [],
  },
  // Story 3: Farcaster news (2 authors)
  {
    hash: "0xjkl012mno345",
    text: "Farcaster hits 1M users! https://farcaster.xyz/blog/milestone",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    fid: 6,
    mentions_positions: [],
    mention_fids: [],
    embedded_urls: ["https://farcaster.xyz/blog/milestone"],
    deleted_at: null,
    author: { fid: 6, fname: "jesse", display_name: "Jesse", pfp_url: null },
    mentions: [],
  },
  {
    hash: "0xmno345pqr678",
    text: "Congrats to the whole team https://farcaster.xyz/blog/milestone",
    timestamp: new Date(Date.now() - 1000 * 60 * 25),
    fid: 7,
    mentions_positions: [],
    mention_fids: [],
    embedded_urls: ["https://farcaster.xyz/blog/milestone"],
    deleted_at: null,
    author: { fid: 7, fname: "varun", display_name: "Varun", pfp_url: null },
    mentions: [],
  },
];

async function fetchData() {
  const apiKey = process.env.NEYNAR_API_KEY;

  console.log("[Home] API key:", apiKey ? `${apiKey.slice(0, 8)}...` : "MISSING");

  if (!apiKey) {
    console.warn("[Home] No API key - using mock data");
    return await processTrendingCasts(mockCasts);
  }

  try {
    const casts = await getTrendingCastsWithUrls({
      timeWindow: "24h",
      limit: 100,
      apiKey,
    });

    console.log("[Home] Got casts from API:", casts.length);

    // Filter out unwanted domains
    const filteredCasts = casts.filter((cast) => {
      const hasBlockedDomain = cast.embedded_urls.some((url) =>
        ["imgur.com", "warpcast.com", "far.quest", "farquest.app"].some((blocked) =>
          url.toLowerCase().includes(blocked)
        )
      );
      return !hasBlockedDomain && cast.author.fname;
    });

    console.log("[Home] After domain filter:", filteredCasts.length);

    const processed = await processTrendingCasts(filteredCasts);
    console.log("[Home] Processed stories:", processed.length);

    return processed;
  } catch (error) {
    console.error("[Home] API error:", error);
    return await processTrendingCasts(mockCasts);
  }
}
