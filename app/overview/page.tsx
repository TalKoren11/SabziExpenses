import { getProfile, getTransactions } from "@/lib/queries";
import { Overview } from "@/components/Overview";

export default async function OverviewPage() {
  const [transactions, profile] = await Promise.all([getTransactions(), getProfile()]);
  return <Overview transactions={transactions} currency={profile?.currency ?? "ILS"} />;
}
