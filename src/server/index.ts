import { publicProcedure, router } from "./trpc";
import { prisma } from "@/utils/prisma";
import { $Enums } from "@prisma/client";
import { z } from "zod";

export const appRouter = router({
  getOrders: publicProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        status: z.nativeEnum($Enums.FulfilmentStatus).optional(),
        page: z.number().min(1).default(1),
      })
    )
    .query(async ({ input }) => {
      const { page, status, limit } = input;

      const skip = (page - 1) * limit;

      const orders = await prisma.order.findMany({
        skip,
        take: limit,
        where: status ? { status } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
        },
      });

      const totalOrders = await prisma.order.count({
        where: status ? { status } : undefined,
      });

      return {
        orders,
        totalOrders,
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
      };
    }),
});

export type AppRouter = typeof appRouter;
