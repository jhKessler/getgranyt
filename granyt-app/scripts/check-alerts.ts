import { prisma } from "../src/server/db";

async function main() {
  const alerts = await prisma.alert.findMany({
    where: { type: "ROW_COUNT_ANOMALY" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      type: true,
      severity: true,
      title: true,
      status: true,
      createdAt: true,
      metadata: true,
    },
  });
  
  console.log("=== ROW_COUNT_ANOMALY Alerts ===");
  console.log(JSON.stringify(alerts, null, 2));
  console.log(`\nTotal: ${alerts.length} alerts`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
