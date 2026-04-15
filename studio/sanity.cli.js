import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: "snlhed6n",
    dataset: "production",
  },
  studioHost: "mplanmag", // deploys to https://mplanmag.sanity.studio — change if taken
});
