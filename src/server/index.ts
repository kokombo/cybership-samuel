import { publicProcedure, router } from "./trpc";
import { prisma } from "@/utils/prisma";
import { $Enums } from "@prisma/client";
import * as Yup from "yup";

export const appRouter = router({
  getOrders: publicProcedure
    .input(
      Yup.object({
        limit: Yup.number().min(1),
        status: Yup.mixed<$Enums.FulfilmentStatus>().oneOf(
          Object.values($Enums.FulfilmentStatus)
        ),
        cursor: Yup.string(),
      })
    )
    .query(async ({ input }) => {
      const limit = input.limit ?? 50;
      const { cursor, status } = input;

      const orders = await prisma.order.findMany({
        take: limit + 1,
        where: status ? { status } : undefined,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined = undefined;

      if (orders.length > limit) {
        const nextItem = orders.pop();
        nextCursor = nextItem?.id;
      }

      return {
        orders,
        nextCursor,
      };
    }),
});

export type AppRouter = typeof appRouter;
