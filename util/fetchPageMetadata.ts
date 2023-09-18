import * as cheerio from "cheerio";

export async function fetchPageMetadata(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "text/html",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $("head title").text() || $("title").text() || $('meta[property="og:title"]').attr("content") || null;
    const description =
      $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || null;
    const image = $('meta[property="og:image"]').attr("content") || $('link[rel="image_src"]').attr("href") || null;

    return { title, description, image };
  } catch (error) {
    return { title: null, description: null, image: null };
  }
}
