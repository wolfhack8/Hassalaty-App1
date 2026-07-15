import { createDemoFamily } from "../src/server/family/seed-family";

createDemoFamily()
  .then((res) => {
    console.log(`Seeded demo family (parent: ${res.parent.email} / demo1234)`);
    for (const child of res.children) {
      console.log(`  child: ${child.email} / ${child.tempPassword ?? "demo1234"}`);
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
