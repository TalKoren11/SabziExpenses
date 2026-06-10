import { getAccounts, getCategories, getLastTransactionDate, getProfile } from "@/lib/queries";
import { QuickAdd } from "@/components/QuickAdd";

export default async function HomePage() {
  const [categories, accounts, profile, lastDate] = await Promise.all([
    getCategories(),
    getAccounts(),
    getProfile(),
    getLastTransactionDate(),
  ]);
  return (
    <QuickAdd
      categories={categories}
      accounts={accounts}
      currency={profile?.currency ?? "ILS"}
      defaultDate={lastDate}
    />
  );
}
