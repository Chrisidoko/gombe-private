// The operator's invoice dashboard. Rendered on the server only to read the
// signed-in name for the welcome line; the dashboard itself is a client
// component.
import { getUserFromCookie } from "@/lib/auth";
import OperatorInvoiceDashboard from "./OperatorInvoiceDashboard";

export default async function OperatorInvoicesPage() {
  const user = await getUserFromCookie();
  return <OperatorInvoiceDashboard userName={user?.name ?? "Operator"} />;
}
