/* eslint-disable @next/next/no-img-element */
import prisma from "@/lib/prisma";
import Link from "next/link";
import dayjs from "@/lib/day";
import { removeOrReplaceUrl } from "@/util/removeOrReplaceUrl";
import { insertNamesAtPoints } from "@/util/insertNamesAtPoints";

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
                href={`https://warpcast.com/${author.fname}/${hash.slice(0, 6)}`}
                style={{ marginLeft: ".5rem", color: "inherit", opacity: 0.66, whiteSpace: "nowrap" }}
              >
                View cast
              </Link>
            </p>
          </div>
        ))}
    </main>
  );
}

async function fetchData(date: string) {
  const casts = await prisma.cast.findMany({
    where: {
      author: {
        fname: { not: null },
      },
      timestamp: {
        gt: dayjs(date).startOf("day").toDate(),
      },
      deleted_at: null,
      text: {
        contains: "http",
      },
      NOT: ["imgur.com", "warpcast.com"].map((contains: string) => ({
        text: {
          contains,
        },
      })),
    },
    include: {
      author: true,
      mentions: { select: { fid: true, fname: true } },
    },
    orderBy: {
      timestamp: "desc",
    },
  });

  const reversed_casts = casts.reverse();
  const unique_urls: string[] = [];
  const url_arr: object[] = [];

  for (const cast of casts) {
    for (const url of cast.embedded_urls) {
      if (url.includes("chain://")) continue;
      if (url.includes("localhost")) continue;
      if (url.includes("imgur.com")) continue;
      if (url.includes("warpcast.com")) continue;
      if (url.includes("farquest")) continue;

      if (!unique_urls.includes(url)) {
        unique_urls.push(url);
      }
    }
  }

  for await (const url of unique_urls) {
    let first_cast = reversed_casts.find((cast) => cast.embedded_urls.includes(url));
    url_arr.push({
      url,
      ...first_cast,
      hostname: url ? new URL(url).hostname : "",
      text: removeOrReplaceUrl(first_cast?.text ?? ""),
    });
  }

  return url_arr.reverse();
}
