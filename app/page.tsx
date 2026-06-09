import { getCategories, getProfile } from "@/lib/queries";
import { QuickAdd } from "@/components/QuickAdd";

export default async function HomePage() {
  const [categories, profile] = await Promise.all([getCategories(), getProfile()]);
  return <QuickAdd categories={categories} currency={profile?.currency ?? "ILS"} />;
}
