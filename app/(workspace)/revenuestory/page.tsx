import { PlaceholderPage } from "@/components/shell/placeholder-page";

export default function RevenueStoryPage() {
  return (
    <PlaceholderPage
      breadcrumb="RevenueStory"
      title="RevenueStory Overview"
      description="RevenueStory in this prototype is the operating dashboard that proves monetization changes are driving attach, expansion, and healthier pricing behavior."
      cards={[
        {
          title: "Attach lift modeled",
          value: "+14 pts",
          description: "The recommended hybrid model improves AI packaging clarity and expands adoption across the Scale and Enterprise base."
        },
        {
          title: "Revenue index upside",
          value: "128",
          description: "The winning scenario outperforms the current flat model by better matching pricing to workflow value."
        },
        {
          title: "Churn risk direction",
          value: "Down",
          description: "Included credits reduce billing friction while weighted overages improve fairness for higher-value actions."
        }
      ]}
    />
  );
}
