import type { PayloadRequest } from "payload";

import { rejectRateLimitedEndpoint } from "@/lib/endpointRateLimit";
import { createPrintOrder, syncPrintOrder } from "@/lib/printOrderFlow";
import { getPaymentCheckoutUrl } from "@/lib/paymentRecords";
import { rejectDisallowedMutationOrigin } from "@/lib/requestSecurity";

const unauthorized = () =>
  Response.json({ message: "请先登录" }, { status: 401 });

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "订单处理失败";
};

export const createPrintOrderEndpoint = {
  path: "/commerce/print-orders",
  method: "post" as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req);
    if (blocked) return blocked;

    if (!req.user) return unauthorized();

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: "order-create",
    });
    if (rateLimited) return rateLimited;

    try {
      const body = req.json ? await req.json() : {};
      const order = await createPrintOrder({
        materialOption: body.materialOption,
        modelId: Number(body.modelId),
        req,
        shippingAddress: body.shippingAddress,
        shippingName: body.shippingName,
        shippingPhone: body.shippingPhone,
        sizeOption: body.sizeOption,
        sourceTaskId: body.sourceTaskId ? Number(body.sourceTaskId) : undefined,
      });

      return Response.json({
        checkoutUrl: getPaymentCheckoutUrl(order),
        message: "订单已创建，正在进入 Stripe Checkout。",
        order,
      });
    } catch (error) {
      return Response.json(
        { message: getErrorMessage(error) },
        { status: 400 },
      );
    }
  },
};

export const syncPrintOrderEndpoint = {
  path: "/commerce/print-orders/:orderId/sync",
  method: "post" as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req);
    if (blocked) return blocked;

    if (!req.user) return unauthorized();

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: "order-sync",
    });
    if (rateLimited) return rateLimited;

    try {
      const orderId = Number(req.routeParams?.orderId ?? 0);
      const orders = await req.payload.find({
        collection: "print-orders",
        depth: 0,
        limit: 1,
        overrideAccess: false,
        pagination: false,
        req,
        user: req.user,
        where: {
          and: [
            {
              id: {
                equals: orderId,
              },
            },
            {
              user: {
                equals: req.user.id,
              },
            },
          ],
        },
      });

      if (!orders.docs[0]) {
        return Response.json({ message: "Order not found." }, { status: 404 });
      }

      const order = await syncPrintOrder({ orderId, req });
      return Response.json({ message: "订单同步完成", order });
    } catch (error) {
      return Response.json(
        { message: getErrorMessage(error) },
        { status: 400 },
      );
    }
  },
};
