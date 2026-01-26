import * as Sentry from "@sentry/node"


Sentry.init({
  dsn: "https://499c480a4a5b1ad6f55afc28c6a630e0@o4510738770821120.ingest.us.sentry.io/4510738889965568",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});