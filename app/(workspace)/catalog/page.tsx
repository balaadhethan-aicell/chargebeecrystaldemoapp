import { PlaceholderPage } from "@/components/shell/placeholder-page";

export default function CatalogPage() {
  return (
    <PlaceholderPage
      breadcrumb="Catalog"
      title="Catalog Designer"
      description="Plans, add-ons, and meters are modeled here before being stitched into pricing recommendations and RevenueStory reporting."
      cards={[
        {
          title: "Plans in market",
          value: "12",
          description: "Platform plans remain stable while AI packaging evolves into included credits and weighted overage classes."
        },
        {
          title: "Usage meters",
          value: "4 live",
          description: "The prototype billing draft uses one weighted credit meter plus bucket-level explainability meters."
        },
        {
          title: "Draft AI add-ons",
          value: "2",
          description: "Commercial add-ons let finance and sales separate support-led AI from revenue-focused AI packages."
        }
      ]}
    />
  );
}
