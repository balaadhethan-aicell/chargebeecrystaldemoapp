import accountData from "@/data/gorgias/account.json";
import dashboardData from "@/data/gorgias/dashboard.json";
import invoicesData from "@/data/gorgias/invoices.json";
import rolloutData from "@/data/gorgias/rollout.json";
import scenariosData from "@/data/gorgias/scenarios.json";
import usageData from "@/data/gorgias/usage.json";

const bundle = {
  account: accountData,
  usage: usageData,
  invoices: invoicesData,
  scenarios: scenariosData,
  rollout: rolloutData,
  dashboard: dashboardData
};

export function getFixtureBundle(accountId: "gorgias" = "gorgias") {
  if (accountId !== "gorgias") {
    throw new Error(`Unsupported demo account: ${accountId}`);
  }

  return bundle;
}
