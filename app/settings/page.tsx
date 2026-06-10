import { getAccounts, getCategories, getProfile } from "@/lib/queries";
import { Settings } from "@/components/Settings";

export default async function SettingsPage() {
  const [categories, accounts, profile] = await Promise.all([getCategories(), getAccounts(), getProfile()]);
  return (
    <Settings
      categories={categories}
      accounts={accounts}
      currency={profile?.currency ?? "ILS"}
      siriToken={profile?.siri_token ?? ""}
    />
  );
}
