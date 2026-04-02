import { PrismaClient } from "@prisma/client";

const softDeleteLogic = {
  async delete({ model, operation, args, query }: any) {
    return (model as any).update({
      ...args,
      data: { deletedAt: new Date() },
    });
  },
  async deleteMany({ model, operation, args, query }: any) {
    return (model as any).updateMany({
      ...args,
      data: { deletedAt: new Date() },
    });
  },
  async findMany({ model, operation, args, query }: any) {
    if (args.where?.deletedAt === undefined) {
      args.where = { ...args.where, deletedAt: null };
    }
    return query(args);
  },
  async findFirst({ model, operation, args, query }: any) {
    if (args.where?.deletedAt === undefined) {
      args.where = { ...args.where, deletedAt: null };
    }
    return query(args);
  },
  async findUnique({ model, operation, args, query }: any) {
    if (args.where?.deletedAt === undefined) {
      return (model as any).findFirst({
        ...args,
        where: { ...args.where, deletedAt: null },
      });
    }
    return (model as any).findFirst(args);
  },
  async count({ model, operation, args, query }: any) {
    if (args.where?.deletedAt === undefined) {
      args.where = { ...args.where, deletedAt: null };
    }
    return query(args);
  },
  async groupBy({ model, operation, args, query }: any) {
    if (args.where?.deletedAt === undefined) {
      args.where = { ...args.where, deletedAt: null };
    }
    return query(args);
  },
  async aggregate({ model, operation, args, query }: any) {
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
