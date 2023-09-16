import { redirect } from "next/navigation";
import dayjs from "@/lib/day";

export default function Page() {
  return redirect("/river/" + dayjs().format("YYYY-MM-DD"));
}
