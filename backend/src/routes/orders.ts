import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { requireAdmin } from "../middleware/auth";
import { requireUser } from "../middleware/jwt-auth";
import { sendMail } from "../lib/mailer";
import { sendSms } from "../lib/sms";
import { logActivity } from "../lib/activity";
import { buildOrderCode } from "../lib/order-code";
import { DeliveryZoneRecord, findMatchingZone } from "../lib/delivery-zones";
import PDFDocument from "pdfkit";

const router = Router();

const orderItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().positive(),
  sizeUS: z.string().optional(),
  sizeEU: z.string().optional(),
  image: z.string().optional(),
  color: z.string().optional(),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  shipping: z.object({
    addressId: z.string().optional(),
    label: z.string().optional(),
    fullName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(6),
    fullAddress: z.string().min(1),
    houseNo: z.string().optional(),
    street: z.string().min(1),
    landmark: z.string().optional(),
    area: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().min(1),
    lat: z.number(),
    lng: z.number(),
    placeId: z.string().optional(),
    deliveryNotes: z.string().optional(),
  }),
  paymentMethod: z.string().optional(),
  couponCode: z.string().optional(),
});

router.get("/", requireUser, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const orders = (await prisma.order.findMany({
      where: { userId },
      orderBy: { placedAt: "desc" },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            variantId: true,
            color: true,
            sizeUS: true,
            sizeEU: true,
            name: true,
            quantity: true,
            soldPrice: true,
            image: true,
            size: true,
          },
        },
      },
    })) as any[];

    return res.json(
      orders.map((order) => ({
        id: order.id,
        code: buildOrderCode(order.id, order.placedAt),
        status: order.status,
        total: order.total,
        placedAt: order.placedAt,
        paymentMethod: order.paymentMethod ?? undefined,
        shippingFee: order.shippingFee,
        courierName: order.courierName ?? undefined,
        trackingNumber: order.trackingNumber ?? undefined,
        trackingUrl: order.trackingUrl ?? undefined,
        deliveryAddress: order.deliveryAddress ?? undefined,
        deliveryZoneId: order.deliveryZoneId ?? undefined,
        deliveryZoneName: order.deliveryZoneName ?? undefined,
        codAvailableAtOrderTime: order.codAvailableAtOrderTime ?? undefined,
        estimatedDeliveryTimeAtOrderTime: order.estimatedDeliveryTimeAtOrderTime ?? undefined,
        items: order.items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId ?? undefined,
          color: item.color ?? undefined,
          sizeUS: item.sizeUS ?? undefined,
          sizeEU: item.sizeEU ?? undefined,
          name: item.name,
          quantity: item.quantity,
          price: item.soldPrice,
          image: item.image,
        })),
      })),
    );
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", requireUser, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "admin";
    const order = (await prisma.order.findFirst({
      where: isAdmin ? { id: req.params.id } : { id: req.params.id, userId },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            variantId: true,
            color: true,
            sizeUS: true,
            sizeEU: true,
            name: true,
            quantity: true,
            soldPrice: true,
            image: true,
          },
        },
      },
    })) as any;

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json({
      id: order.id,
      code: buildOrderCode(order.id, order.placedAt),
      status: order.status,
      subTotal: order.subTotal,
      discountTotal: order.discountTotal,
      total: order.total,
      shippingFee: order.shippingFee,
      placedAt: order.placedAt,
      paymentMethod: order.paymentMethod ?? undefined,
      deliveryAddress: order.deliveryAddress ?? undefined,
      deliveryZoneId: order.deliveryZoneId ?? undefined,
      deliveryZoneName: order.deliveryZoneName ?? undefined,
      codAvailableAtOrderTime: order.codAvailableAtOrderTime ?? undefined,
      estimatedDeliveryTimeAtOrderTime: order.estimatedDeliveryTimeAtOrderTime ?? undefined,
      courierName: order.courierName ?? undefined,
      trackingNumber: order.trackingNumber ?? undefined,
      trackingUrl: order.trackingUrl ?? undefined,
      items: order.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        color: item.color ?? undefined,
        sizeUS: item.sizeUS ?? undefined,
        sizeEU: item.sizeEU ?? undefined,
        name: item.name,
        quantity: item.quantity,
        price: item.soldPrice,
        image: item.image,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id/invoice", requireUser, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "admin";
    const order = (await prisma.order.findFirst({
      where: isAdmin ? { id: req.params.id } : { id: req.params.id, userId },
      include: {
        items: true,
        user: { select: { name: true, email: true } },
      },
    })) as any;

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="invoice-${order.id}.pdf"`,
    );

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text("Thrifty Shoes", { align: "left" });
    doc.fontSize(12).text("Invoice", { align: "right" });
    doc.moveDown();

    doc.fontSize(10).text(`Invoice ID: ${order.id}`);
    doc.text(`Date: ${new Date(order.placedAt).toLocaleDateString()}`);
    doc.text(`Customer: ${order.user.name} (${order.user.email})`);
    if (order.deliveryAddress && typeof order.deliveryAddress === "object") {
      const address = order.deliveryAddress as Record<string, string | number | boolean | null>;
      doc.text(
        `Delivery: ${String(address.fullName ?? order.user.name)} - ${String(address.phone ?? "")}`,
      );
      doc.text(
        `Address: ${String(
          address.fullAddress ??
            [address.houseNo, address.street, address.area, address.city, address.country]
              .filter(Boolean)
              .join(", "),
        )}`,
      );
    }
    doc.moveDown();

    doc.fontSize(12).text("Items");
    doc.moveDown(0.5);

    order.items.forEach((item: any) => {
      const lineTotal = item.soldPrice * item.quantity;
      const metaParts = [item.color, item.sizeUS ? `US ${item.sizeUS}` : "", item.sizeEU ? `EU ${item.sizeEU}` : ""]
        .filter(Boolean)
        .join(" / ");
      doc
        .fontSize(10)
        .text(
          `${item.name} x${item.quantity} ${metaParts ? `(${metaParts})` : ""} - ${lineTotal}`,
        );
    });

    doc.moveDown();
    doc.fontSize(10).text(`Subtotal: ${order.subTotal}`);
    doc.text(`Discount: ${order.discountTotal}`);
    doc.text(`Shipping: ${order.shippingFee}`);
    doc.fontSize(12).text(`Total: ${order.total}`);

    doc.end();
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireUser, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const payload = createOrderSchema.parse(req.body);
    const uniqueProductIds = Array.from(new Set(payload.items.map((item) => item.productId)));

    const products = await prisma.product.findMany({
      where: { id: { in: uniqueProductIds } },
      include: {
        variants: {
          include: { sizes: true },
        },
      },
    });

    if (products.length !== uniqueProductIds.length) {
      return res.status(400).json({ message: "One or more products are invalid." });
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const normalize = (value?: string | null) => value?.trim().toLowerCase();
    const resolvedItems: Array<
      z.infer<typeof orderItemSchema> & {
        product: (typeof products)[number];
        variant?: (typeof products)[number]["variants"][number];
        resolvedSizeUS?: string;
        resolvedSizeEU?: string;
      }
    > = [];

    for (const item of payload.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(400).json({ message: "Invalid product." });
      }

      let variant = item.variantId
        ? product.variants.find((entry) => entry.id === item.variantId)
        : undefined;

      if (!variant && item.color) {
        variant = product.variants.find(
          (entry) => normalize(entry.color) === normalize(item.color),
        );
      }

      if (!variant && product.variants.length === 1) {
        variant = product.variants[0];
      }

      if (product.variants.length > 0) {
        if (!variant) {
          return res.status(400).json({ message: "Invalid variant." });
        }
        const sizeMatch = variant.sizes.find(
          (entry) =>
            (item.sizeUS && normalize(entry.sizeUS) === normalize(item.sizeUS)) ||
            (item.sizeEU && normalize(entry.sizeEU) === normalize(item.sizeEU)),
        );
        if (!sizeMatch) {
          return res.status(400).json({ message: "Invalid size." });
        }
        if (sizeMatch.stock < item.quantity) {
          return res
            .status(400)
            .json({ message: `Insufficient stock for ${product.name} (${variant.color}).` });
        }
        resolvedItems.push({
          ...item,
          product,
          variant,
          variantId: variant.id,
          color: variant.color,
          resolvedSizeUS: sizeMatch.sizeUS ?? item.sizeUS,
          resolvedSizeEU: sizeMatch.sizeEU ?? item.sizeEU,
        });
      } else if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}.` });
      } else {
        resolvedItems.push({
          ...item,
          product,
          resolvedSizeUS: item.sizeUS,
          resolvedSizeEU: item.sizeEU,
        });
      }
    }

    const subTotal = resolvedItems.reduce((sum, item) => {
      const price = item.variant?.priceOverride ?? item.product.sellPrice;
      return sum + price * item.quantity;
    }, 0);

    const settings = await prisma.appSetting.findMany({
      where: { key: { in: ["paymentRequired", "allowCod", "allowDummy"] } },
    });
    const settingMap = new Map(settings.map((s) => [s.key, s.value]));
    const paymentRequired = settingMap.get("paymentRequired") === "true";
    const allowCod = settingMap.get("allowCod") !== "false";
    const allowDummy = settingMap.get("allowDummy") !== "false";

    if (paymentRequired && !payload.paymentMethod) {
      return res.status(400).json({ message: "Payment method is required." });
    }

    if (payload.paymentMethod === "cod" && !allowCod) {
      return res.status(400).json({ message: "COD is disabled. Please use a payment method." });
    }
    if (payload.paymentMethod === "dummy" && !allowDummy) {
      return res.status(400).json({ message: "Dummy payments are disabled." });
    }

    let discountTotal = 0;
    let couponCode: string | undefined;
    if (payload.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: payload.couponCode.toUpperCase() },
      });
      if (coupon && coupon.active) {
        const isExpired = coupon.expiresAt && coupon.expiresAt < new Date();
        const limitReached = coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;
        if (!isExpired && !limitReached) {
          discountTotal =
            coupon.type === "percent"
              ? Math.floor(subTotal * (coupon.value / 100))
              : coupon.value;
          discountTotal = Math.min(discountTotal, subTotal);
          couponCode = coupon.code;
        }
      }
    }

    const candidateZones = (await (prisma as any).deliveryZone.findMany({
      where: payload.shipping.city
        ? {
            isActive: true,
            OR: [
              { city: payload.shipping.city },
              { city: { equals: payload.shipping.city, mode: "insensitive" } },
            ],
          }
        : { isActive: true },
      orderBy: [{ shippingFee: "asc" }, { createdAt: "asc" }],
    })) as DeliveryZoneRecord[];

    const deliveryZones =
      candidateZones.length > 0
        ? candidateZones
        : ((await (prisma as any).deliveryZone.findMany({
            where: { isActive: true },
            orderBy: [{ shippingFee: "asc" }, { createdAt: "asc" }],
          })) as DeliveryZoneRecord[]);

    const matchedZone = findMatchingZone(deliveryZones, {
      lat: payload.shipping.lat,
      lng: payload.shipping.lng,
    });

    if (!matchedZone) {
      return res.status(400).json({ message: "Delivery not available in this area." });
    }

    if (payload.paymentMethod === "cod" && !matchedZone.zone.codAvailable) {
      return res.status(400).json({ message: "Cash on delivery is not available in this area." });
    }

    const shippingFee = matchedZone.zone.shippingFee;
    const total = Math.max(subTotal - discountTotal, 0) + shippingFee;
    const deliveryAddressSnapshot = {
      ...payload.shipping,
      estimatedDeliveryTime: matchedZone.zone.estimatedDeliveryTime,
      shippingFee,
      deliveryZoneId: matchedZone.zone.id,
      deliveryZoneName: matchedZone.zone.name,
      codAvailable: matchedZone.zone.codAvailable,
    };

    const createdOrder = await prisma.$transaction(async (tx) => {
      const created = await (tx as any).order.create({
        data: {
          userId,
          status: payload.paymentMethod === "dummy" ? "paid" : "processing",
          subTotal,
          discountTotal,
          shippingFee,
          total,
          couponCode,
          shipping: {
            email: payload.shipping.email,
            phone: payload.shipping.phone,
            city: payload.shipping.city,
            country: payload.shipping.country,
          },
          deliveryAddress: deliveryAddressSnapshot,
          deliveryZoneId: matchedZone.zone.id,
          deliveryZoneName: matchedZone.zone.name,
          codAvailableAtOrderTime: matchedZone.zone.codAvailable,
          estimatedDeliveryTimeAtOrderTime: matchedZone.zone.estimatedDeliveryTime,
          paymentMethod: payload.paymentMethod ?? undefined,
          items: {
            create: resolvedItems.map((item) => {
              const product = item.product;
              const variant = item.variant;
              const price = variant?.priceOverride ?? product.sellPrice;
              return {
                productId: product.id,
                variantId: variant?.id,
                color: variant?.color,
                sizeUS: item.resolvedSizeUS,
                sizeEU: item.resolvedSizeEU,
                name: product.name,
                quantity: item.quantity,
                soldPrice: price,
                costPriceAtSale: product.costPrice,
                image: item.image,
              };
            }),
          },
        } as any,
        select: { id: true },
      });

      for (const item of resolvedItems) {
        if (item.variant) {
          const sizeMatch = item.variant.sizes.find(
            (entry) =>
              (item.resolvedSizeUS && normalize(entry.sizeUS) === normalize(item.resolvedSizeUS)) ||
              (item.resolvedSizeEU && normalize(entry.sizeEU) === normalize(item.resolvedSizeEU)),
          );
          if (sizeMatch) {
            await tx.variantSize.update({
              where: { id: sizeMatch.id },
              data: { stock: { decrement: item.quantity } },
            });
          }
          await tx.product.update({
            where: { id: item.product.id },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.product.id },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      if (couponCode) {
        await tx.coupon.update({
          where: { code: couponCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      return created;
    });

    const order = (await prisma.order.findUnique({
      where: { id: createdOrder.id },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            variantId: true,
            color: true,
            sizeUS: true,
            sizeEU: true,
            name: true,
            quantity: true,
            soldPrice: true,
            image: true,
          },
        },
      },
    })) as any;
    if (!order) {
      return res.status(500).json({ message: "Order creation failed." });
    }

    const adminEmails = process.env.ADMIN_ALERT_EMAILS
      ? process.env.ADMIN_ALERT_EMAILS.split(",").map((e) => e.trim()).filter(Boolean)
      : [];
    const threshold = Number(process.env.STOCK_ALERT_THRESHOLD ?? 5);
    const lowStockItems = resolvedItems
      .map((item) => {
        if (item.variant) {
          const sizeMatch = item.variant.sizes.find(
            (entry) =>
              (item.resolvedSizeUS && normalize(entry.sizeUS) === normalize(item.resolvedSizeUS)) ||
              (item.resolvedSizeEU && normalize(entry.sizeEU) === normalize(item.resolvedSizeEU)),
          );
          if (sizeMatch && sizeMatch.stock - item.quantity <= threshold) {
            return `${item.product.name} (${item.variant.color}) size ${item.resolvedSizeUS ?? item.resolvedSizeEU ?? ""}`;
          }
          return null;
        }
        if (item.product.stock - item.quantity <= threshold) {
          return `${item.product.name}`;
        }
        return null;
      })
      .filter(Boolean) as string[];

    if (adminEmails.length && lowStockItems.length) {
      await sendMail(
        adminEmails,
        "Low stock alert",
        `<p>Low stock detected for:</p><ul>${lowStockItems.map((i) => `<li>${i}</li>`).join("")}</ul>`,
      );
    }

    const preference = await prisma.notificationPreference.findUnique({
      where: { userId },
    });
    const shippingEmail = payload.shipping?.email;
    if (shippingEmail && (preference?.emailEnabled ?? true)) {
      await sendMail(
        [shippingEmail],
        "Order confirmation",
        `<p>Thanks for your order!</p><p>Order number: ${buildOrderCode(order.id, order.placedAt)}</p><p>Total: ${total}</p>`,
      );
    }
    const smsNumber = preference?.phone || payload.shipping?.phone;
    if (preference?.smsEnabled && smsNumber) {
      await sendSms(
        smsNumber,
        `Thanks for your order ${buildOrderCode(order.id, order.placedAt)}. Total ${total}.`,
      );
    }

    await logActivity(userId, "order", `Order placed ${buildOrderCode(order.id, order.placedAt)}`);

    return res.status(201).json({
      id: order.id,
      code: buildOrderCode(order.id, order.placedAt),
      status: order.status,
      subTotal: order.subTotal,
      discountTotal: order.discountTotal,
      total: order.total,
      shippingFee: order.shippingFee,
      placedAt: order.placedAt,
      paymentMethod: order.paymentMethod ?? undefined,
      deliveryAddress: order.deliveryAddress ?? undefined,
      deliveryZoneId: order.deliveryZoneId ?? undefined,
      deliveryZoneName: order.deliveryZoneName ?? undefined,
      codAvailableAtOrderTime: order.codAvailableAtOrderTime ?? undefined,
      estimatedDeliveryTimeAtOrderTime: order.estimatedDeliveryTimeAtOrderTime ?? undefined,
      items: order.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        color: item.color ?? undefined,
        sizeUS: item.sizeUS ?? undefined,
        sizeEU: item.sizeEU ?? undefined,
        name: item.name,
        quantity: item.quantity,
        price: item.soldPrice,
        image: item.image,
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

router.get("/stats", requireAdmin, async (_req, res, next) => {
  try {
    const [totalOrders, totalRevenue, pending, delivered] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.order.count({ where: { status: "processing" } }),
      prisma.order.count({ where: { status: "delivered" } }),
    ]);

    return res.json({
      totalOrders,
      totalRevenue: totalRevenue._sum.total ?? 0,
      pending,
      delivered,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
