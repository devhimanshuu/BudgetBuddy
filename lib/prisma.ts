import { PrismaClient, Prisma } from "@prisma/client";

const softDeleteLogic = {
  async delete(this: any, { args }: any) {
    return this.update({
      ...args,
      data: { deletedAt: new Date() },
    });
  },
  async deleteMany(this: any, { args }: any) {
    return this.updateMany({
      ...args,
      data: { deletedAt: new Date() },
    });
  },
  async findMany({ args, query }: any) {
    if (args.where?.deletedAt === undefined) {
      args.where = { ...args.where, deletedAt: null };
    }
    return query(args);
  },
  async findFirst({ args, query }: any) {
    if (args.where?.deletedAt === undefined) {
      args.where = { ...args.where, deletedAt: null };
    }
    return query(args);
  },
  async findUnique(this: any, { args }: any) {
    // findUnique only allows unique fields. Adding deletedAt: null filter
    // requires switching to findFirst.
    const where = { ...args.where };
    if (where.deletedAt === undefined) {
      where.deletedAt = null;
    }
    return this.findFirst({
      ...args,
      where,
    });
  },
  async count({ args, query }: any) {
    if (args.where?.deletedAt === undefined) {
      args.where = { ...args.where, deletedAt: null };
    }
    return query(args);
  },
  async groupBy({ args, query }: any) {
    if (args.where?.deletedAt === undefined) {
      args.where = { ...args.where, deletedAt: null };
    }
    return query(args);
  },
  async aggregate({ args, query }: any) {
    if (args.where?.deletedAt === undefined) {
      args.where = { ...args.where, deletedAt: null };
    }
    return query(args);
  },
};

const prismaClientSingleton = () => {
  const client = new PrismaClient();
  
  return client.$extends({
    query: {
      transaction: softDeleteLogic,
      workspace: softDeleteLogic,
      workspaceMember: softDeleteLogic,
      invite: softDeleteLogic,
      category: softDeleteLogic,
      tag: softDeleteLogic,
      attachment: softDeleteLogic,
      budget: softDeleteLogic,
      savingsGoal: softDeleteLogic,
      asset: softDeleteLogic,
      recurringTransaction: softDeleteLogic,
      vaultEntry: softDeleteLogic,
      beneficiary: softDeleteLogic,
    },
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
