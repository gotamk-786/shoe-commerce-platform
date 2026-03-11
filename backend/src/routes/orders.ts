import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { requireAdmin } from "../middleware/auth";
import { requireUser } from "../middleware/jwt-auth";
import { sendMail } from "../lib/mailer";
import { sendSms } from "../lib/sms";
import { logActivity } from "../lib/activity";
import { buildOrderCode } from "../lib/order-code";
import {
  DeliveryZoneRecord,
  findMatchingZone,
  findNationwideZone,
} from "../lib/delivery-zones";
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
    lat: z.number().optional(),
    lng: z.number().optional(),
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

    const doc = new PDFDocument({ size: "A4", margin: 36 });
    doc.pipe(res);

    const address =
      order.deliveryAddress && typeof order.deliveryAddress === "object"
        ? (order.deliveryAddress as Record<string, string | number | boolean | null>)
        : null;
    const shipping =
      order.shipping && typeof order.shipping === "object"
        ? (order.shipping as Record<string, string | number | boolean | null>)
        : null;
    const asText = (value: string | number | boolean | null | undefined) =>
      value === null || value === undefined ? "" : String(value);
    const invoiceCode = buildOrderCode(order.id, order.placedAt);
    const placedDate = new Date(order.placedAt).toLocaleDateString();
    const customerName = asText(address?.fullName ?? shipping?.fullName ?? order.user.name);
    const customerEmail = asText(address?.email ?? shipping?.email ?? order.user.email);
    const customerPhone = asText(address?.phone ?? shipping?.phone ?? "");
    const customerAddress = [
      asText(address?.fullAddress),
      [address?.houseNo, address?.street, address?.landmark, address?.area, address?.city, address?.state, address?.postalCode, address?.country]
        .map(asText)
        .filter(Boolean)
        .join(", "),
      [shipping?.fullAddress, shipping?.city, shipping?.country].map(asText).filter(Boolean).join(", "),
    ].find((value) => String(value ?? "").trim().length > 0) || "";

    const money = (value: number) => `PKR ${value.toLocaleString()}`;

    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("Thrifty Shoes", 36, 36);
    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#4b5563")
      .text("Order invoice", 36, 64);
    doc
      .roundedRect(360, 36, 199, 78, 14)
      .fillAndStroke("#f8fafc", "#d1d5db");
    doc
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Order Number", 376, 48)
      .fontSize(16)
      .text(invoiceCode, 376, 62)
      .font("Helvetica")
      .fontSize(10)
      .text(`Date: ${placedDate}`, 376, 88)
      .text(`Status: ${String(order.status).toUpperCase()}`, 376, 104);

    doc
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Customer", 36, 138)
      .font("Helvetica")
      .fontSize(10)
      .text(customerName, 36, 158)
      .text(customerEmail, 36, 174);
    if (customerPhone) {
      doc.text(customerPhone, 36, 190);
    }
    if (customerAddress) {
      doc.text(customerAddress, 36, customerPhone ? 206 : 190, { width: 250 });
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Payment", 330, 138)
      .font("Helvetica")
      .fontSize(10)
      .text(`Method: ${order.paymentMethod ?? "manual"}`, 330, 158)
      .text(`Subtotal: ${money(order.subTotal ?? 0)}`, 330, 174)
      .text(`Discount: ${money(order.discountTotal ?? 0)}`, 330, 190)
      .text(`Shipping: ${money(order.shippingFee ?? 0)}`, 330, 206)
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(`Total: ${money(order.total ?? 0)}`, 330, 226);

    const tableTop = 276;
    doc
      .roundedRect(36, tableTop, 523, 28, 10)
      .fillAndStroke("#111827", "#111827");
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Item", 50, tableTop + 9)
      .text("Qty", 330, tableTop + 9)
      .text("Price", 390, tableTop + 9)
      .text("Total", 470, tableTop + 9);

    let currentY = tableTop + 40;
    order.items.forEach((item: any, index: number) => {
      const metaParts = [item.color, item.sizeUS ? `US ${item.sizeUS}` : "", item.sizeEU ? `EU ${item.sizeEU}` : ""]
        .filter(Boolean)
        .join(" / ");
      const lineTotal = item.soldPrice * item.quantity;
      const rowHeight = metaParts ? 38 : 26;
      if (index % 2 === 0) {
        doc.rect(36, currentY - 6, 523, rowHeight).fill("#f8fafc");
      }
      doc
        .fillColor("#111827")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(item.name, 50, currentY, { width: 250 })
        .font("Helvetica")
        .fontSize(9);
      if (metaParts) {
        doc
          .fillColor("#6b7280")
          .text(metaParts, 50, currentY + 14, { width: 250 });
      }
      doc
        .fillColor("#111827")
        .fontSize(10)
        .text(String(item.quantity), 330, currentY)
        .text(money(item.soldPrice), 390, currentY)
        .text(money(lineTotal), 470, currentY);
      currentY += rowHeight;
    });

    const summaryTop = currentY + 18;
    doc
      .roundedRect(330, summaryTop, 229, 82, 12)
      .fillAndStroke("#f8fafc", "#e5e7eb");
    doc
      .fillColor("#111827")
      .font("Helvetica")
      .fontSize(10)
      .text(`Subtotal`, 346, summaryTop + 16)
      .text(money(order.subTotal ?? 0), 470, summaryTop + 16, { width: 70, align: "right" })
      .text(`Discount`, 346, summaryTop + 34)
      .text(money(order.discountTotal ?? 0), 470, summaryTop + 34, { width: 70, align: "right" })
      .text(`Shipping`, 346, summaryTop + 52)
      .text(money(order.shippingFee ?? 0), 470, summaryTop + 52, { width: 70, align: "right" })
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(`Grand Total`, 346, summaryTop + 72)
      .text(money(order.total ?? 0), 454, summaryTop + 72, { width: 86, align: "right" });

    doc
      .fillColor("#6b7280")
      .font("Helvetica")
      .fontSize(9)
      .text("Tracking details will appear after the order is marked as shipped.", 36, 770);

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

    const matchedZone =
      payload.shipping.lat !== undefined && payload.shipping.lng !== undefined
        ? findMatchingZone(deliveryZones, {
            lat: payload.shipping.lat,
            lng: payload.shipping.lng,
          })
        : null;
    const nationwideZone = matchedZone ? null : findNationwideZone(deliveryZones);
    const resolvedZone = matchedZone?.zone ?? nationwideZone ?? deliveryZones[0] ?? null;

    if (payload.paymentMethod === "cod" && resolvedZone && !resolvedZone.codAvailable) {
      return res.status(400).json({ message: "Cash on delivery is not available in this area." });
    }

    const shippingFee = resolvedZone?.shippingFee ?? 0;
    const total = Math.max(subTotal - discountTotal, 0) + shippingFee;
    const deliveryAddressSnapshot = {
      ...payload.shipping,
      estimatedDeliveryTime: resolvedZone?.estimatedDeliveryTime,
      shippingFee,
      deliveryZoneId: resolvedZone?.id,
      deliveryZoneName: resolvedZone?.name,
      codAvailable: resolvedZone?.codAvailable,
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
          deliveryZoneId: resolvedZone?.id,
          deliveryZoneName: resolvedZone?.name,
          codAvailableAtOrderTime: resolvedZone?.codAvailable,
          estimatedDeliveryTimeAtOrderTime: resolvedZone?.estimatedDeliveryTime,
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
