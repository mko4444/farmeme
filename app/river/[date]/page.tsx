/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import dayjs from "@/lib/day";
import { removeOrReplaceUrl } from "@/util/removeOrReplaceUrl";
import { insertNamesAtPoints } from "@/util/insertNamesAtPoints";
import { getTrendingCastsWithUrls, type TimeWindow } from "@/lib/neynar";

export default async function Home({
  params,
}: {
  params: {
    date: string;
  };
}) {
  const date = dayjs(params.date).startOf("day").toDate();
  const today = dayjs().startOf("day").toDate();
  const data = await fetchData(params.date);

  return (
    <main className="river">
      <div className="row-fs-c max-w" style={{ padding: "1rem", gap: ".5rem" }}>
        <h2 style={{ padding: 0 }}>{dayjs(date).format("dddd, MMMM D")}</h2>
        <div />
        <Link href={`/river/${dayjs(date).subtract(1, "day").format("YYYY-MM-DD")}`}>
          <button className="arrow-btn" style={{ minWidth: "1.5rem", borderRadius: 100 }}>
            ←
          </button>
        </Link>
        <Link
          style={{
            opacity: dayjs(date).isSame(today, "day") ? 0.5 : 1,
            pointerEvents: dayjs(date).isSame(today, "day") ? "none" : "auto",
          }}
          href={`/river/${dayjs(date).add(1, "day").format("YYYY-MM-DD")}`}
        >
          <button className="arrow-btn" style={{ minWidth: "1.5rem", borderRadius: 100 }}>
            →
          </button>
        </Link>
      </div>
      {data
        .filter(({ timestamp }: any) => dayjs(timestamp).isSame(date, "day"))
        .map(({ timestamp, hash, author, text, hostname, url, mention_fids, mentions, mentions_positions }: any) => (
          <div className="card row" key={hash} style={{ padding: ".5rem 1rem" }}>
            <label
              style={{
                fontWeight: 400,
                width: 58,
              }}
            >
              {dayjs(timestamp).format("h:mm A")}
            </label>
            <p
              className="line-1 flex"
              style={{
                lineHeight: "1.25",
              }}
            >
              <Link href="/">
                <label>@{author.fname}</label>
              </Link>
              <label style={{ margin: "0 .25rem", opacity: 0.5 }}>/</label>
              <Link href="/">
                <label>{hostname}</label>
              </Link>
              {": "}
              <span style={{ width: ".25rem" }} />
              <Link href={url}>
                <h1
                  style={{
                    display: "inline",
                    fontSize: "inherit",
                    lineHeight: "1.25",
                  }}
                >
                  {removeOrReplaceUrl(insertNamesAtPoints(text, mention_fids, mentions_positions, mentions)) || url}
                </h1>
              </Link>
              <Link
                target="_blank"
                href={`https://warpcast.com/${author.fname}/${hash.slice(0, 10)}`}
                style={{ marginLeft: ".5rem", color: "inherit", opacity: 0.66, whiteSpace: "nowrap" }}
              >
                View cast
              </Link>
            </p>
          </div>
        ))}
      {data.length === 0 && (
        <div style={{ padding: "1rem", opacity: 0.66 }}>
          No casts with links found for this date. Try a more recent date.
        </div>
      )}
    </main>
  );
}

async function fetchData(date: string) {
  const apiKey = process.env.NEYNAR_API_KEY;
  const requestedDate = dayjs(date).startOf("day");
  const today = dayjs().startOf("day");

  // Calculate days ago to determine time window
  const daysAgo = today.diff(requestedDate, "day");

  if (!apiKey) {
    console.warn("[Neynar] No API key configured for river");
    return [];
  }

  // Neynar only supports up to 7d or 30d windows
  // For older dates, we can't fetch data
  if (daysAgo > 7) {
    console.warn("[Neynar] Date too far in past, max 7 days supported");
    return [];
  }

  try {
    // Determine appropriate time window
    let timeWindow: TimeWindow = "24h";
    if (daysAgo >= 1) timeWindow = "7d";

    const casts = await getTrendingCastsWithUrls({
      timeWindow,
      limit: 100,
      apiKey,
    });

    // Filter to only casts from the requested date
    const castsForDate = casts.filter((cast) =>
      dayjs(cast.timestamp).isSame(requestedDate, "day")
    );

    // Filter out unwanted domains
    const filteredCasts = castsForDate.filter((cast) => {
      const hasBlockedDomain = cast.embedded_urls.some((url) =>
        ["chain://", "localhost", "imgur.com", "warpcast.com", "farquest"].some(
          (blocked) => url.toLowerCase().includes(blocked)
        )
      );
      return !hasBlockedDomain;
    });

    // Get unique URLs and their first casts
    const unique_urls: string[] = [];
    const url_arr: object[] = [];

    // Sort by timestamp ascending
    const sortedCasts = filteredCasts.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (const cast of sortedCasts) {
      for (const url of cast.embedded_urls) {
        if (!unique_urls.includes(url)) {
          unique_urls.push(url);
          url_arr.push({
            url,
            hash: cast.hash,
            timestamp: cast.timestamp,
            author: cast.author,
            text: cast.text,
            mention_fids: cast.mention_fids,
            mentions: cast.mentions,
            mentions_positions: cast.mentions_positions,
            hostname: new URL(url).hostname,
          });
        }
      }
    }

    return url_arr;
  } catch (error) {
    console.error("[Neynar] River fetch error:", error);
    return [];
  }
}
