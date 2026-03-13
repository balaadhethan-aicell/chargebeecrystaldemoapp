import { PlaceholderPage } from "@/components/shell/placeholder-page";

export default function DashboardPage() {
  return (
    <PlaceholderPage
      breadcrumb="Dashboard"
      title="Executive Dashboard"
      description="A calm control plane for pricing, billing, and monetization signals across the account base."
      cards={[
        {
          title: "Net revenue retention",
          value: "114.2%",
          description: "AI-enabled cohorts are compounding faster than the rest of the base, creating a strong signal for packaging refinement."
        },
        {
          title: "AI revenue share",
          value: "18.4%",
          description: "AI is no longer experimental revenue. It is large enough that pricing design changes move core monetization outcomes."
        },
        {
          title: "Pricing experiments",
          value: "3 active",
          description: "Monetization Twin acts as the operator layer that translates product signals into ready-to-ship pricing changes."
        }
      ]}
    />
  );
}
