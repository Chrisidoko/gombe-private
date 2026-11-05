// Operator 2's dashboard. Rendered on the server only to read the signed-in
// name for the welcome line; the dashboard itself is a client component.
import { getUserFromCookie } from "@/lib/auth";
import ReviewDashboard from "./ReviewDashboard";

export default async function ReviewDashboardPage() {
  const user = await getUserFromCookie();
  return <ReviewDashboard userName={user?.name ?? "Director"} />;
}
