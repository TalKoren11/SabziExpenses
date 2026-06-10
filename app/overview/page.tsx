import { getAccounts, getProfile, getTransactions } from "@/lib/queries";
import { Overview } from "@/components/Overview";

export default async function OverviewPage() {
  const [transactions, accounts, profile] = await Promise.all([getTransactions(), getAccounts(), getProfile()]);
  return (
    <Overview
      transactions={transactions}
      currency={profile?.currency ?? "ILS"}
      accounts={accounts.filter((a) => !a.archived)}
    />
  );
}
