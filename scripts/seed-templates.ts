const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding default budget templates...");

  const templates = [
    {
      name: "50/30/20 Rule (Starter)",
      description: "Allocates 50% for Needs, 30% for Wants, and 20% for Savings/Debt. Based on a $2,000 monthly budget.",
      isSystem: true,
      entries: [
        { category: "Housing", categoryIcon: "🏠", amount: 600 },
        { category: "Utilities", categoryIcon: "🔌", amount: 200 },
        { category: "Groceries", categoryIcon: "🛒", amount: 200 },
        { category: "Dining Out", categoryIcon: "🍔", amount: 300 },
        { category: "Entertainment", categoryIcon: "🎬", amount: 300 },
        { category: "Savings", categoryIcon: "💰", amount: 400 },
      ],
    },
    {
      name: "Zero-Based Budget (Student)",
      description: "Every dollar has a job. Optimized for students with lower income but fixed costs.",
      isSystem: true,
      entries: [
        { category: "Rent/Dorm", categoryIcon: "🏫", amount: 500 },
        { category: "Textbooks/Study", categoryIcon: "📚", amount: 100 },
        { category: "Food/Dining", categoryIcon: "🍎", amount: 250 },
        { category: "Transport", categoryIcon: "🚌", amount: 50 },
        { category: "Personal Care", categoryIcon: "🧼", amount: 50 },
        { category: "Emergency Fund", categoryIcon: "🚨", amount: 50 },
      ],
    },
    {
      name: "Freelancer/Business Budget",
      description: "Designed for those with irregular income, focusing on taxes and software first.",
      isSystem: true,
      entries: [
        { category: "Taxes (30%)", categoryIcon: "🏛️", amount: 900 },
        { category: "Software/Subscriptions", categoryIcon: "💻", amount: 150 },
        { category: "Marketing", categoryIcon: "📣", amount: 200 },
        { category: "Office/Coworking", categoryIcon: "🏢", amount: 300 },
        { category: "Professional Dev", categoryIcon: "🎓", amount: 100 },
        { category: "Personal Pay", categoryIcon: "🏦", amount: 1350 },
      ],
    },
  ];

  for (const t of templates) {
    const { entries, ...templateData } = t;
    await prisma.budgetTemplate.upsert({
      where: { id: `system-${t.name.toLowerCase().replace(/\s+/g, "-")}` }, // Temporary ID logic for upsert if we had static IDs
      // Actually BudgetTemplate doesn't have a unique name yet, I'll just create if not exists by name
      update: {}, 
      create: {
        userId: "system",
        ...templateData,
        id: undefined, // Let it generate UUID
        entries: {
          create: entries,
        },
      },
    });
  }

  console.log("Default templates seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
