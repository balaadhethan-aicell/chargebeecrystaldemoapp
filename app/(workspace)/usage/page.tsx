import { PlaceholderPage } from "@/components/shell/placeholder-page";

export default function UsagePage() {
  return (
    <PlaceholderPage
      breadcrumb="Usage"
      title="Usage Intelligence"
      description="Normalized product signals feed deterministic scoring, chart data, and pricing recommendations inside Monetization Twin."
      cards={[
        {
          title: "Tracked action types",
          value: "9",
          description: "Raw actions are mapped in code into support deflection, operational, and revenue value buckets."
        },
        {
          title: "Latest monthly volume",
          value: "935k",
          description: "AI usage is dominated by support deflection, but customer value is increasingly generated in the smaller revenue action segment."
        },
        {
          title: "Meter fidelity",
          value: "Deterministic replay",
          description: "Usage buckets and pricing comparisons are computed in code from live or adapter-backed inputs rather than LLM-generated numbers."
        }
      ]}
    />
  );
}
