import { getCategories, getProfile } from "@/lib/queries";
import { ImportScreenshot } from "@/components/ImportScreenshot";

export default async function ImportPage() {
  const [categories, profile] = await Promise.all([getCategories(), getProfile()]);
  const expenseCategories = categories.filter((c) => c.type === "expense" && !c.archived);
  return <ImportScreenshot categories={expenseCategories} currency={profile?.currency ?? "ILS"} />;
}
