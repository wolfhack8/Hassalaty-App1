import { createDemoUser } from "../src/server/finance/seed-user-finance";

createDemoUser()
  .then((user) => {
    console.log(`Seeded demo user: ${user.email} (password: demo1234)`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
