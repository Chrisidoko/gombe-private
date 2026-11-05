// Moved into the Reviews page; kept so old links and bookmarks still work
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/reviews?tab=demand");
}
