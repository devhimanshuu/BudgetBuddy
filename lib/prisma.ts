import { PrismaClient } from "@prisma/client";

// Inject deletedAt: null filter into where clause for read operations
function injectSoftDeleteFilter(args: any) {
  if (args.where?.deletedAt === undefined) {
    args.where = { ...args.where, deletedAt: null };
  }
}

// Models that support soft-delete (PascalCase as Prisma reports them)
const SOFT_DELETE_MODELS = [
  "Transaction",
  "Workspace",
  "WorkspaceMember",
  "Invite",
  "Category",
  "Tag",
  "Attachment",
  "Budget",
  "SavingsGoal",
  "Asset",
  "RecurringTransaction",
  "VaultEntry",
  "Beneficiary",
];

const prismaClientSingleton = () => {
  const client = new PrismaClient();

  // Only intercept READ operations to auto-filter soft-deleted records.
  // For DELETE operations, call softDelete() explicitly in application code.
  return client.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }: any) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            injectSoftDeleteFilter(args);
          }
          return query(args);
        },
        async findFirst({ model, args, query }: any) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            injectSoftDeleteFilter(args);
          }
          return query(args);
        },
        async findUnique({ model, args, query }: any) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            injectSoftDeleteFilter(args);
          }
          return query(args);
        },
        async count({ model, args, query }: any) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            injectSoftDeleteFilter(args);
          }
          return query(args);
        },
        async groupBy({ model, args, query }: any) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            injectSoftDeleteFilter(args);
          }
          return query(args);
        },
        async aggregate({ model, args, query }: any) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            injectSoftDeleteFilter(args);
          }
          return query(args);
        },
      },
    },
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
