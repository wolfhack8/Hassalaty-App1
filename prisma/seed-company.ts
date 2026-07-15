import { createDemoCompany } from "../src/server/company/seed-company";

createDemoCompany()
  .then((res) => {
    console.log(`Seeded demo company (owner: ${res.owner.email} / demo1234)`);
    for (const emp of res.employees) {
      console.log(`  employee: ${emp.email} / ${emp.tempPassword ?? "demo1234"}`);
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
