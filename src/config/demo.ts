/**
 * The seeded demo accounts surfaced on the public /demo page. The admin account
 * is deliberately excluded and must never be listed here.
 */
export const DEMO_PASSWORD = "demo1234";

/** Curated order: personal first, company owner + employees, then the
 *  family parent and children (the personal account doubles as the family's
 *  PARENT — see `createDemoFamily`). */
export const DEMO_EMAILS = [
  "fahad@naqd.sa",
  "ceo@rkiza.sa",
  "sara@rkiza.sa",
  "omar@rkiza.sa",
  "yousef@rkiza.sa",
  "lama@rkiza.sa",
] as const;
