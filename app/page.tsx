import { getCategories, getLastTransactionDate, getProfile } from "@/lib/queries";
import { QuickAdd } from "@/components/QuickAdd";

export default async function HomePage() {
  const [categories, profile, lastDate] = await Promise.all([
    getCategories(),
    getProfile(),
    getLastTransactionDate(),
  ]);
  return <QuickAdd categories={categories} currency={profile?.currency ?? "ILS"} defaultDate={lastDate} />;
}
