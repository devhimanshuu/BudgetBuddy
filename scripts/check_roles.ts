import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const memberships = await prisma.workspaceMember.findMany({
    include: { workspace: true }
  });
  console.log(JSON.stringify(memberships, null, 2));
}

main();
