import type { Metadata } from "next";
import { Arsenal } from "next/font/google";
import "@/styles/index.scss";
import dayjs from "dayjs";
import Link from "next/link";
import Nav from "./nav";

const font = Arsenal({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Farmeme",
  description: "Recent news on Farcaster",
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
        <header className="header--main col-on-mobile row-sb-c max-w">
          <Link href="/">
            <div className="logo">
              far<div>meme</div>
            </div>
          </Link>
          <span>{dayjs().format("MMMM D, YYYY, h:mm A")}</span>
          <div className="header--main--search row-c-c">
            <input placeholder="Search Farmeme..." />
            <button>Search</button>
          </div>
        </header>
        <Nav />
        {children}
      </body>
    </html>
  );
}
