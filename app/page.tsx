/* eslint-disable @next/next/no-img-element */
import prisma from "@/lib/prisma";
import Link from "next/link";
import { uniq } from "lodash";
import dayjs from "@/lib/day";
import { Fragment } from "react";
import Image from "next/image";
import * as cheerio from "cheerio";

const lastDate = dayjs().startOf("day").subtract(3, "day").toDate();

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
      NOT: ["imgur.com", "warpcast.com", "far.quest", "farquest.app", "lu.ma", "zora.co", "imgur.com"].map(
        (contains: string) => ({
          text: {
            contains,
          },
        })
      ),
    },
    include: {
      author: true,
    },
  });

  return await processData(casts);
}

async function fetchPageMetadata(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('meta[property="og:title"]').attr("content") || $("title").text() || null;
    const description =
      $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || null;
    const image = $('meta[property="og:image"]').attr("content") || $('link[rel="image_src"]').attr("href") || null;

    return { title, description, image };
  } catch (error) {
    console.error("Fetch error:", error);
    return { title: null, description: null, image: null };
  }
}

async function processData(casts: any) {
  const uniqueUrlsWithCasts: any = {};

  casts.forEach((cast: any) => {
    if (cast.embedded_urls) {
      cast.embedded_urls.forEach((url: string) => {
        if (!uniqueUrlsWithCasts[url]) {
          uniqueUrlsWithCasts[url] = [];
        }
        uniqueUrlsWithCasts[url].push(cast);
      });
    }
  });

  const arr = await Promise.all(
    Object.keys(uniqueUrlsWithCasts)
      .filter((key) => {
        const hasMultipleCasts = uniqueUrlsWithCasts[key].length > 1;
        const hasMultipleAuthors = uniq(uniqueUrlsWithCasts[key].map((cast: any) => cast.author.fname)).length > 1;
        return hasMultipleCasts && hasMultipleAuthors;
      })
      .map(async (key) => {
        const castsForKey = uniqueUrlsWithCasts[key].filter(
          (cast: any, i: number, arr: any[]) => i === 0 || cast.author.fname !== arr[i - 1].author.fname
        );
        const [first, ...rest] = castsForKey.sort((a: any, b: any) => a.timestamp - b.timestamp);
        const link_hostname = new URL(key).hostname;
        const cleaned_text = removeOrReplaceUrl(first.text);
        const metadata = await fetchPageMetadata(key);

        return {
          first_timestamp: first.timestamp,
          last_timestamp: rest[rest.length - 1].timestamp || first.timestamp,
          first_cast: first,
          rest_of_casts: rest,
          cleaned_text,
          hostname: link_hostname,
          unique_authors: uniq(castsForKey.map((cast: any) => cast.author.fname)),
          metadata,
          url: key,
        };
      })
  );

  return arr.sort((a, b) => b.unique_authors.length - a.unique_authors.length);
}

function removeOrReplaceUrl(inputStr: string) {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urls = inputStr.match(urlPattern);

  if (urls) {
    urls.forEach((url) => {
      if (inputStr.trim().endsWith(url)) {
        inputStr = inputStr.replace(url, "");
      } else {
        inputStr = inputStr.replace(url, "[link]");
      }
    });
  }

  return inputStr.replace(/[:;\s]+$/, "").trim();
}

export default async function Home() {
  const data = await fetchData();

  return (
    <main className="main">
      <h2>Top News</h2>
      {data.map(
        (
          { url, first_cast, rest_of_casts, cleaned_text, hostname, metadata, first_timestamp, last_timestamp },
          index
        ) => (
          <div className="main--card col max-w" key={index}>
            <span>
              <Link target="_blank" href={`https://warpcast.com/${first_cast.author.fname}`}>
                <label>@{first_cast.author.fname}</label>
              </Link>
              <label> / </label>
              <Link target="_blank" href={`https://${hostname}`}>
                <label>{hostname}</label>
              </Link>
            </span>
            <div className="max-w row-sb-fs" style={{ gap: "1rem" }}>
              <div className="col flex" style={{ gap: ".33rem" }}>
                <Link target="_blank" href={first_cast.embedded_urls[0]}>
                  <h1 className="line-3">{cleaned_text || metadata.title || url}</h1>
                </Link>
                <span className="line-3">
                  {cleaned_text && (
                    <span>
                      {metadata.title}
                      {metadata.description && <span> • </span>}
                    </span>
                  )}
                  {metadata.description}
                </span>
                {rest_of_casts.length > 0 && (
                  <p>
                    <b style={{ color: "#408840" }}>More: </b>
                    {rest_of_casts.map(({ author, hash }: any, i: number) => (
                      <Fragment key={author.fid}>
                        {i > 0 && <span>, </span>}
                        <Link target="_blank" href={`https://warpcast.com/${author.fname}/${hash.slice(0, 8)}`}>
                          <span>@{author.fname}</span>
                        </Link>
                      </Fragment>
                    ))}
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
