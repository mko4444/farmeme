"use client";

import { useRouter } from "next/navigation";

export default function Searchbar() {
  const { push } = useRouter();

  function onSubmit(e: any) {
    e.preventDefault();
    return push(`/search/${encodeURIComponent(e.target[0].value)}`);
  }

  return (
    <form onSubmit={onSubmit} className="header--main--search row-c-c" style={{ width: 200 }}>
      <input placeholder="Search Farmeme..." />
      <button type="submit">Search</button>
    </form>
  );
}
