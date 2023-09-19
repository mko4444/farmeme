/* eslint-disable @next/next/no-img-element */
import prisma from "@/lib/prisma";
import Link from "next/link";
import dayjs from "@/lib/day";
import { Fragment } from "react";
import { processTrendingCasts } from "@/util/processTrendingCasts";

const lastDate = dayjs().startOf("day").subtract(3, "day").toDate();

export const revalidate = 0;

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
        .map(
          ({ url, rest_of_casts, last_cast, first_cast, cleaned_text, hostname, metadata, last_timestamp }, index) => (
            <div className="card col max-w" key={index}>
              <span>
                <Link target="_blank" href={`https://warpcast.com/${last_cast.author.fname}`}>
                  <label>@{last_cast.author.fname}</label>
                </Link>
                <label style={{ margin: "0 .25rem", opacity: 0.5 }}>/</label>
                <Link target="_blank" href={`https://${hostname}`}>
                  <label>{hostname}</label>
                </Link>
                <Link
                  target="_blank"
                  href={`https://warpcast.com/${last_cast.author.fname}/0x${last_cast.hash.slice(0, 6)}`}
                  style={{ marginLeft: ".5rem", color: "inherit", opacity: 0.66 }}
                >
                  View cast
                </Link>
              </span>
              <div className="max-w row-sb-fs" style={{ gap: "1rem" }}>
                <div className="col flex" style={{ gap: ".33rem" }}>
                  <Link target="_blank" href={last_cast.embedded_urls[0]}>
                    <h1 className="line-3">{cleaned_text || metadata.title || url}</h1>
                  </Link>
                  <span className="line-3">{metadata.description}</span>
                  {rest_of_casts.length > 0 && (
                    <p>
                      <b style={{ color: "#408840" }}>More: </b>
                      {rest_of_casts
                        .filter((f: any) => f.author.fname !== first_cast?.author?.fname)
                        .map(({ author, hash }: any, i: number) => {
                          console.log(hash, first_cast.author, author);
                          return (
                            <Fragment key={author.fid}>
                              {i > 0 && <span>, </span>}
                              <Link target="_blank" href={`https://warpcast.com/${author.fname}/0x${hash.slice(0, 6)}`}>
                                <span>@{author.fname}</span>
                              </Link>
                            </Fragment>
                          );
                        })}
                    </p>
                  )}
                  <span style={{ opacity: 0.66 }}>{dayjs(last_timestamp).fromNow()}</span>
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

async function fetchData() {
  const casts = await prisma.cast.findMany({
    where: {
      timestamp: {
        gt: lastDate,
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
    },
  });

  return await processTrendingCasts(casts);
}
