// Mock data for testing when Prisma is not available
const mockCasts = [
  {
    hash: "0x123abc456def",
    text: "Breaking: Major tech announcement today! Check out this amazing article https://example.com/tech-news",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
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
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
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
    timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
    fid: 3,
    mentions_positions: [],
    mention_fids: [],
    embedded_urls: ["https://example.com/tech-news"],
    deleted_at: null,
    author: { fid: 3, fname: "charlie", display_name: "Charlie", pfp_url: null },
    mentions: [],
  },
  {
    hash: "0xdef456ghi789",
    text: "New research findings published https://example.com/research-paper",
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
    fid: 4,
    mentions_positions: [],
    mention_fids: [],
    embedded_urls: ["https://example.com/research-paper"],
    deleted_at: null,
    author: { fid: 4, fname: "diana", display_name: "Diana", pfp_url: null },
    mentions: [],
  },
  {
    hash: "0xghi789jkl012",
    text: "Must read for everyone in the space https://example.com/research-paper",
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    fid: 5,
    mentions_positions: [],
    mention_fids: [],
    embedded_urls: ["https://example.com/research-paper"],
    deleted_at: null,
    author: { fid: 5, fname: "evan", display_name: "Evan", pfp_url: null },
    mentions: [],
  },
];

// Mock Prisma client for development/testing
const createMockPrismaClient = () => {
  return {
    cast: {
      findMany: async (options?: any) => {
        console.log("[Mock Prisma] Using mock data - Prisma client not available");
        // Filter based on options if provided
        let results = [...mockCasts];

        if (options?.where?.text?.contains) {
          const searchTerm = options.where.text.contains.toLowerCase();
          results = results.filter((cast) =>
            cast.text.toLowerCase().includes(searchTerm)
          );
        }

        if (options?.take) {
          results = results.slice(0, options.take);
        }

        return results;
      },
    },
    $connect: async () => {},
    $disconnect: async () => {},
  };
};

let prisma: any;
let Prisma: any = {};

try {
  // Try to import the real Prisma client
  const PrismaModule = require("@prisma/client");
  const { PrismaClient } = PrismaModule;
  Prisma = PrismaModule.Prisma;

  if (process.env.NODE_ENV === "production") {
    prisma = new PrismaClient();
  } else {
    let globalWithPrisma = global as typeof globalThis & {
      prisma: any;
    };
    if (!globalWithPrisma.prisma) {
      globalWithPrisma.prisma = new PrismaClient();
    }
    prisma = globalWithPrisma.prisma;
  }
} catch (error) {
  console.warn("[Prisma] Failed to initialize Prisma client, using mock data:", (error as Error).message);
  prisma = createMockPrismaClient();
}

export default prisma;
export { Prisma };
