import { uniq } from "lodash";
import { fetchPageMetadata } from "./fetchPageMetadata";
import { removeOrReplaceUrl } from "./removeOrReplaceUrl";

export async function processTrendingCasts(casts: any) {
  const uniqueUrlsWithCasts: any = {};

  const forbidden_urls = ["farquest.app", "far.quest"];

  casts.forEach((cast: any) => {
    if (cast.embedded_urls) {
      cast.embedded_urls.forEach((url: string) => {
        if (forbidden_urls.find((u) => url.toLowerCase().includes(u))) return;
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
