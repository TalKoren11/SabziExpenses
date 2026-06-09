import { getCategories, getProfile } from "@/lib/queries";
import { Settings } from "@/components/Settings";

export default async function SettingsPage() {
  const [categories, profile] = await Promise.all([getCategories(), getProfile()]);
  return (
    <Settings
      categories={categories}
      currency={profile?.currency ?? "ILS"}
      siriToken={profile?.siri_token ?? ""}
    />
  );
}
