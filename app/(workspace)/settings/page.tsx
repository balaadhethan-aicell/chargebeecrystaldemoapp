import { PlaceholderPage } from "@/components/shell/placeholder-page";

export default function SettingsPage() {
  return (
    <PlaceholderPage
      breadcrumb="Settings"
      title="Workspace Settings"
      description="Demo mode, OpenAI narrative controls, and other runtime assumptions can be configured here in a real product surface."
      cards={[
        {
          title: "Demo mode",
          value: "Enabled",
          description: "Narrative generation falls back cleanly so the prototype never breaks if an external dependency is unavailable."
        },
        {
          title: "OpenAI model",
          value: "gpt-5.4",
          description: "Responses API integration is limited to narrative generation and never controls business logic or rankings."
        },
        {
          title: "Schema validation",
          value: "Strict",
          description: "All LLM responses are validated and retried once before canned content is used."
        }
      ]}
    />
  );
}
