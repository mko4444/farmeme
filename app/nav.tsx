"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import classNames from "classnames";

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        margin: "0 0.5rem",
        width: "calc(100% - 1rem)",
      }}
    >
      <Link
        href="/"
        className={classNames({
          active: pathname === "/",
        })}
      >
        Home
      </Link>
      <Link
        href="/river"
        className={classNames({
          active: pathname.startsWith("/river"),
        })}
      >
        River
      </Link>
    </nav>
  );
}
