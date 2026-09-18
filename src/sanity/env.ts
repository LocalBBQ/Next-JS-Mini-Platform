export const apiVersion =
  (process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-03-01").trim();

export const dataset =
  (process.env.NEXT_PUBLIC_SANITY_DATASET || "production").trim();

export const projectId = (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "").trim();

export const isSanityConfigured = projectId.length > 0;
