import type { Metadata } from "next";
import { Arsenal } from "next/font/google";
import "@/styles/index.scss";
import dayjs from "@/lib/day";
import Link from "next/link";
import Nav from "./nav";
import Searchbar from "./searchbar";

const font = Arsenal({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Farmeme",
  description: "Recent news on Farcaster",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://farmeme.com",
    images: [
      {
        url: "/favicon.png",
        width: 600,
        height: 600,
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={font.className}>
        <header className="header--top row-sb-c">
          <div className="col-on-mobile row-fs-c" style={{ gap: ".5rem" }}>
            <Link href="https://warpcast.com/matthew">
              <label>A joke / useful site made by @matthew</label>
            </Link>
          </div>
        </header>
        <header className="header--main row-sb-c col-on-mobile max-w">
          <div>
            <Link href="/" className="logo" style={{ width: "auto" }}>
              <div>far</div>
              <div>meme</div>
            </Link>
          </div>
          <div className="header--main--middle max-w col-c-c">
            <span>{dayjs().format("MMMM D, YYYY, h:mm A z")}</span>
          </div>
          <Searchbar />
        </header>
        <Nav />
        {children}
      </body>
    </html>
  );
}
