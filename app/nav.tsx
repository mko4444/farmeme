"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import classNames from "classnames";

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav>
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
