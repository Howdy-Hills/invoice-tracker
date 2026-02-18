import { getCurrentUser } from "@/lib/auth";
import { getAiSettings } from "@/actions/ai-settings";
import { AiSettingsForm } from "./ai-settings-form";

export default async function AiSettingsPage() {
  const { orgId } = await getCurrentUser();
  const settings = await getAiSettings(orgId);
  return (
    <div className="max-w-2xl">
      <AiSettingsForm settings={settings} />
    </div>
  );
}
