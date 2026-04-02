import { PrismaClient } from "@prisma/client";

// Inject deletedAt: null filter into where clause for read operations
function injectSoftDeleteFilter(args: any) {
  if (args.where?.deletedAt === undefined) {
    args.where = { ...args.where, deletedAt: null };
  }
}

function buildSoftDeleteLogic() {
  return {
    async delete({ model, args, query }: any) {
      // Instead of deleting, set deletedAt timestamp
      return (model as any).update({
        where: args.where,
        data: { deletedAt: new Date() },
      });
    },
    async deleteMany({ model, args, query }: any) {
      return (model as any).updateMany({
        where: args.where,
        data: { deletedAt: new Date() },
      });
    },
    async findMany({ model, args, query }: any) {
      injectSoftDeleteFilter(args);
      return query(args);
    },
    async findFirst({ args, query }: any) {
      injectSoftDeleteFilter(args);
      return query(args);
    },
    async findUnique({ args, query }: any) {
      // Prisma 6.x allows additional non-unique filters in findUnique where.
      // We simply add deletedAt: null and call the original query.
      injectSoftDeleteFilter(args);
      return query(args);
    },
    async count({ args, query }: any) {
      injectSoftDeleteFilter(args);
      return query(args);
    },
    async groupBy({ args, query }: any) {
      injectSoftDeleteFilter(args);
      return query(args);
    },
    async aggregate({ args, query }: any) {
      injectSoftDeleteFilter(args);
      return query(args);
    },
  };
}

const SOFT_DELETE_MODELS = [
  "transaction",
  "workspace",
  "workspaceMember",
  "invite",
  "category",
  "tag",
  "attachment",
  "budget",
  "savingsGoal",
  "asset",
  "recurringTransaction",
  "vaultEntry",
  "beneficiary",
] as const;

const prismaClientSingleton = () => {
  const client = new PrismaClient();

  const queryExtensions: Record<string, any> = {};
  for (const model of SOFT_DELETE_MODELS) {
    queryExtensions[model] = buildSoftDeleteLogic();
  }

  return client.$extends({
    query: queryExtensions as any,
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
