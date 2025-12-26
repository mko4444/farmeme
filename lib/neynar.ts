// Neynar API client for fetching Farcaster data in real-time

const NEYNAR_API_BASE = "https://api.neynar.com/v2/farcaster";

export interface NeynarCast {
  hash: string;
  text: string;
  timestamp: string;
  embeds: Array<{ url?: string }>;
  author: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string | null;
  };
  reactions: {
    likes_count: number;
    recasts_count: number;
  };
  replies: {
    count: number;
  };
  mentioned_profiles?: Array<{ fid: number; username: string }>;
}

export interface NeynarFeedResponse {
  casts: NeynarCast[];
  next?: { cursor: string };
}

// Time window options for trending feed
export type TimeWindow = "1h" | "6h" | "12h" | "24h" | "7d" | "30d";

/**
 * Fetch trending casts from Neynar API
 * Returns casts ranked by engagement within the specified time window
 */
export async function fetchTrendingCasts(options: {
  timeWindow?: TimeWindow;
  limit?: number;
  apiKey: string;
}): Promise<NeynarCast[]> {
  const { timeWindow = "24h", limit = 100, apiKey } = options;

  const url = new URL(`${NEYNAR_API_BASE}/feed/trending`);
  url.searchParams.set("time_window", timeWindow);
  url.searchParams.set("limit", String(limit));

  console.log("[Neynar] Fetching trending casts...", { timeWindow, limit });

  const response = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      "x-api-key": apiKey,
      "api_key": apiKey, // Some endpoints use this header instead
    },
    next: { revalidate: 60 }, // Cache for 60 seconds
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Neynar] API error response:", errorText);
    throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log("[Neynar] Got response with", data.casts?.length || 0, "casts");

  // Handle different response structures
  const casts = data.casts || data.result?.casts || [];
  return casts as NeynarCast[];
}

/**
 * Filter casts to only those containing URLs (for news aggregation)
 */
export function filterCastsWithUrls(casts: NeynarCast[]): NeynarCast[] {
  return casts.filter((cast) => {
    // Check embeds for URLs
    const hasEmbedUrl = cast.embeds?.some((embed) => embed.url);
    // Also check text for http links
    const hasTextUrl = cast.text?.includes("http");
    return hasEmbedUrl || hasTextUrl;
  });
}

/**
 * Transform Neynar cast to the format expected by processTrendingCasts
 */
export function transformNeynarCast(cast: NeynarCast) {
  // Extract URLs from embeds
  const embedded_urls = cast.embeds
    ?.filter((embed) => embed.url)
    .map((embed) => embed.url as string) || [];

  // Also extract URLs from text if not in embeds
  const urlRegex = /https?:\/\/[^\s]+/g;
  const textUrls = cast.text?.match(urlRegex) || [];
  const allUrls = Array.from(new Set([...embedded_urls, ...textUrls]));

  return {
    hash: cast.hash,
    text: cast.text,
    timestamp: new Date(cast.timestamp),
    fid: cast.author.fid,
    mentions_positions: [] as number[],
    mention_fids: cast.mentioned_profiles?.map((p) => p.fid) || [],
    embedded_urls: allUrls,
    deleted_at: null,
    author: {
      fid: cast.author.fid,
      fname: cast.author.username,
      display_name: cast.author.display_name,
      pfp_url: cast.author.pfp_url,
    },
    mentions: cast.mentioned_profiles?.map((p) => ({
      fid: p.fid,
      fname: p.username,
    })) || [],
    // Include engagement metrics for potential sorting
    _engagement: {
      likes: cast.reactions.likes_count,
      recasts: cast.reactions.recasts_count,
      replies: cast.replies.count,
      total: cast.reactions.likes_count + cast.reactions.recasts_count * 2 + cast.replies.count,
    },
  };
}

/**
 * Main function to get trending casts with URLs, ready for processing
 */
export async function getTrendingCastsWithUrls(options: {
  timeWindow?: TimeWindow;
  limit?: number;
  apiKey: string;
}) {
  const casts = await fetchTrendingCasts(options);
  const castsWithUrls = filterCastsWithUrls(casts);
  return castsWithUrls.map(transformNeynarCast);
}
