import prisma from "../prisma";

export const logActivity = async (userId: string, type: string, message: string) => {
  await prisma.activityLog.create({
    data: { userId, type, message },
  });
};
