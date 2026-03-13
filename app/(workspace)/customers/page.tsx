import { PlaceholderPage } from "@/components/shell/placeholder-page";

export default function CustomersPage() {
  return (
    <PlaceholderPage
      breadcrumb="Customers"
      title="Customer Workspace"
      description="A chargebee-native account surface that centralizes commercial state, plan posture, and monetization intervention opportunities."
      cards={[
        {
          title: "Priority account",
          value: "Gorgias",
          description: "The demo account has a support platform core, layered AI monetization, and a clear pricing redesign opportunity."
        },
        {
          title: "Expansion watchlist",
          value: "142",
          description: "Operational action growth is increasingly visible in renewal cohorts, making packaging strategy more important than simple usage volume."
        },
        {
          title: "Renewals this quarter",
          value: "61",
          description: "Renewal windows are where packaged AI transitions can be introduced with the least friction."
        }
      ]}
    />
  );
}
