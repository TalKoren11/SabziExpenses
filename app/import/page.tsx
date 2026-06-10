import { getAccounts, getCategories, getProfile } from "@/lib/queries";
import { ImportScreenshot } from "@/components/ImportScreenshot";

export default async function ImportPage() {
  const [categories, accounts, profile] = await Promise.all([getCategories(), getAccounts(), getProfile()]);
  const expenseCategories = categories.filter((c) => c.type === "expense" && !c.archived);
  const defaultAccount = accounts.find((a) => a.is_default && !a.archived) ?? accounts.find((a) => !a.archived) ?? null;
  return (
    <ImportScreenshot
      categories={expenseCategories}
      currency={profile?.currency ?? "ILS"}
      defaultAccountId={defaultAccount?.id ?? null}
    />
  );
}
