// Register these with your existing Sanity Studio.
// In sanity.config.ts (or .js), import and spread into `schema.types`.
import article     from "./article.js";
import aboutPage   from "./aboutPage.js";
import contactPage from "./contactPage.js";

export const schemaTypes = [article, aboutPage, contactPage];
