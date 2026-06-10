import { getAccounts, getProfile, getTransactions } from "@/lib/queries";
import { Overview } from "@/components/Overview";

export default async function OverviewPage() {
  const [transactions, accounts, profile] = await Promise.all([getTransactions(), getAccounts(), getProfile()]);
  return (
    <Overview
      transactions={transactions}
      currency={profile?.currency ?? "ILS"}
      showAccounts={accounts.filter((a) => !a.archived).length > 1}
    />
  );
}
