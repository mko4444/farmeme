/* eslint-disable @next/next/no-img-element */
import prisma from "@/lib/prisma";
import Link from "next/link";
import dayjs from "@/lib/day";
import { Fragment } from "react";
import { processTrendingCasts } from "@/util/processTrendingCasts";
import { removeOrReplaceUrl } from "@/util/removeOrReplaceUrl";
import { insertNamesAtPoints } from "@/util/insertNamesAtPoints";
import { getHashUri } from "@/util/getHashUri";

export const revalidate = 60;

export default async function Home({ params: { term } }: { params: { term: string } }) {
  const data = await fetchData(decodeURIComponent(term));

  return (
    <main
      className="main"
      style={{
        padding: "0 1rem",
      }}
    >
      <h2>Results for &quot;{term}&quot;</h2>
      {data
        .sort(
          (a, b) =>
            // sort first by # of unique authors and then by timestamp
            b.unique_authors.length - a.unique_authors.length || b.last_timestamp - a.last_timestamp
        )
        .map(({ url, rest_of_casts, last_cast, first_cast, hostname, metadata, last_timestamp }, index) => (
          <div className="card col max-w" key={index}>
            <span>
              <Link target="_blank" href={`https://warpcast.com/${last_cast.author.fname}`}>
                <label>@{first_cast.author.fname}</label>
              </Link>
              <label style={{ margin: "0 .25rem", opacity: 0.5 }}>/</label>
              <Link target="_blank" href={`https://${hostname}`}>
                <label>{hostname}</label>
              </Link>
              <Link
                target="_blank"
                href={`https://warpcast.com/${last_cast.author.fname}/${getHashUri(last_cast.hash)}`}
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
                          <Link
                            target="_blank"
                            href={`https://warpcast.com/${author.fname}/${
                              hash.startsWith("0x") ? hash.slice(0, 8) : `0x${getHashUri(hash)}`
                            }`}
                          >
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

async function fetchData(term: string) {
  const casts = await prisma.cast.findMany({
    where: {
      author: {
        fname: { not: null },
      },
      deleted_at: null,
      text: {
        contains: term,
        mode: "insensitive",
      },
      NOT: [
        ...["imgur.com", "warpcast.com"].map((contains: string) => ({
          text: {
            contains,
          },
        })),
        {
          embedded_urls: {
            isEmpty: true,
          },
        },
      ],
    },
    orderBy: {
      replies: {
        _count: "desc",
      },
    },
    include: {
      author: true,
      mentions: { select: { fid: true, fname: true } },
    },
    take: 100,
  });
  return await processTrendingCasts(casts);
}
