import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { requireAdmin } from "../middleware/auth";
import { requireUser } from "../middleware/jwt-auth";
import { clearCachedResponseByPrefix } from "../lib/response-cache";
import { buildOrderCode } from "../lib/order-code";

const router = Router();

const clearProductCaches = () => {
  clearCachedResponseByPrefix("products:list:");
  clearCachedResponseByPrefix("products:detail:");
};

router.use(requireUser, requireAdmin);

router.get("/customers", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });

    return res.json({
      data: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        orders: user._count.orders,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

const customerStatusSchema = z.object({
  isBlocked: z.boolean(),
});

router.patch("/customers/:id", async (req, res, next) => {
  try {
    const payload = customerStatusSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isBlocked: payload.isBlocked },
    });
    return res.json({ id: user.id, isBlocked: user.isBlocked });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  sellPrice: z.number().int().nonnegative(),
  costPrice: z.number().int().nonnegative(),
  discount: z.number().int().nonnegative().optional(),
  condition: z.string().optional(),
  gender: z.string().optional(),
  sizes: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z
    .record(z.string(), z.union([z.string(), z.number(), z.array(z.string())]))
    .optional(),
  stock: z.number().int().nonnegative(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  images: z.array(z.object({ url: z.string().url(), alt: z.string().optional() })).optional(),
  categoryId: z.string().optional(),
  variants: z
    .array(
      z.object({
        color: z.string().min(1),
        priceOverride: z.number().int().nonnegative().optional(),
        images: z.array(z.object({ url: z.string().url(), alt: z.string().optional() })).optional(),
        sizes: z.array(
          z.object({
            sizeUS: z.string().optional(),
            sizeEU: z.string().optional(),
            stock: z.number().int().nonnegative(),
          }),
        ),
      }),
    )
    .optional(),
});

router.get("/products", async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        variants: true,
      },
    });

    res.json({ data: products });
  } catch (error) {
    next(error);
  }
});

router.post("/products", async (req, res, next) => {
  try {
    const payload = productSchema.parse(req.body);

    const totalStock =
      payload.variants?.reduce(
        (sum, variant) =>
          sum + variant.sizes.reduce((inner, size) => inner + size.stock, 0),
        0,
      ) ?? payload.stock;

    const product = await prisma.product.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        sellPrice: payload.sellPrice,
        costPrice: payload.costPrice,
        discount: payload.discount,
        condition: payload.condition,
        gender: payload.gender,
        sizes: payload.sizes ?? [],
        tags: payload.tags ?? [],
        metadata: payload.metadata ?? {},
        stock: totalStock,
        active: payload.active ?? true,
        featured: payload.featured ?? false,
        images: payload.images ?? [],
        categoryId: payload.categoryId,
        variants: payload.variants
          ? {
              create: payload.variants.map((variant) => ({
                color: variant.color,
                priceOverride: variant.priceOverride,
                images: variant.images ?? [],
                sizes: {
                  create: variant.sizes.map((size) => ({
                    sizeUS: size.sizeUS,
                    sizeEU: size.sizeEU,
                    stock: size.stock,
                  })),
                },
              })),
            }
          : undefined,
      },
    });

    clearProductCaches();
    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

router.patch("/products/:id", async (req, res, next) => {
  try {
    const payload = productSchema.partial().parse(req.body);

    const totalStock =
      payload.variants?.reduce(
        (sum, variant) =>
          sum + (variant.sizes?.reduce((inner, size) => inner + size.stock, 0) ?? 0),
        0,
      ) ?? payload.stock;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        sellPrice: payload.sellPrice,
        costPrice: payload.costPrice,
        discount: payload.discount,
        condition: payload.condition,
        gender: payload.gender,
        sizes: payload.sizes,
        tags: payload.tags,
        metadata: payload.metadata,
        stock: totalStock,
        active: payload.active,
        featured: payload.featured,
        images: payload.images,
        categoryId: payload.categoryId,
        variants: payload.variants
          ? {
              deleteMany: { productId: req.params.id },
              create: payload.variants.map((variant) => ({
                color: variant.color,
                priceOverride: variant.priceOverride,
                images: variant.images ?? [],
                sizes: {
                  create: variant.sizes.map((size) => ({
                    sizeUS: size.sizeUS,
                    sizeEU: size.sizeEU,
                    stock: size.stock,
                  })),
                },
              })),
            }
          : undefined,
      },
    });

    clearProductCaches();
    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

router.patch("/products/:id/stock", async (req, res, next) => {
  try {
    const payload = z.object({ stock: z.number().int().nonnegative() }).parse(req.body);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { stock: payload.stock },
    });
    clearProductCaches();
    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

router.patch("/products/:id/discount", async (req, res, next) => {
  try {
    const payload = z.object({ discount: z.number().int().nonnegative() }).parse(req.body);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { discount: payload.discount },
    });
    clearProductCaches();
    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

router.delete("/products/:id", async (req, res, next) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    clearProductCaches();
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.get("/inventory/low", async (_req, res, next) => {
  try {
    const threshold = Number(process.env.STOCK_ALERT_THRESHOLD ?? 5);
    const [variantSizes, products] = await Promise.all([
      prisma.variantSize.findMany({
        where: { stock: { lte: threshold } },
        include: {
          variant: {
            include: { product: true },
          },
        },
        orderBy: { stock: "asc" },
      }),
      prisma.product.findMany({
        where: { stock: { lte: threshold } },
        orderBy: { stock: "asc" },
      }),
    ]);

    return res.json({
      variantSizes: variantSizes.map((item) => ({
        id: item.id,
        stock: item.stock,
        sizeUS: item.sizeUS,
        sizeEU: item.sizeEU,
        color: item.variant.color,
        productId: item.variant.productId,
        productName: item.variant.product.name,
      })),
      products: products.map((product) => ({
        id: product.id,
        stock: product.stock,
        name: product.name,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

const orderStatusSchema = z.object({
  status: z.enum(["processing", "paid", "shipped", "delivered", "cancelled"]),
});

const trackingSchema = z.object({
  courierName: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  trackingUrl: z.string().url().optional().nullable(),
});

router.get("/orders", async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { placedAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    });

    return res.json({
      data: orders.map((order) => ({
        id: order.id,
        code: buildOrderCode(order.id, order.placedAt),
        status: order.status,
        total: order.total,
        placedAt: order.placedAt,
        paymentMethod: order.paymentMethod ?? undefined,
        customer: order.user,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/orders/:id", async (req, res, next) => {
  try {
    const payload = orderStatusSchema.parse(req.body);
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: payload.status },
    });
    return res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

router.patch("/orders/:id/tracking", async (req, res, next) => {
  try {
    const payload = trackingSchema.parse(req.body);
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        courierName: payload.courierName ?? null,
        trackingNumber: payload.trackingNumber ?? null,
        trackingUrl: payload.trackingUrl ?? null,
      },
    });
    return res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  period: z.enum(["daily", "weekly", "monthly"]).optional(),
});

const resolveDateRange = (query: unknown) => {
  const parsed = dateRangeSchema.parse(query);
  const to = parsed.to ? new Date(parsed.to) : new Date();
  const from = parsed.from ? new Date(parsed.from) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from, to, period: parsed.period ?? "daily" };
};

const formatBucketKey = (date: Date, period: "daily" | "weekly" | "monthly") => {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  if (period === "monthly") {
    return `${year}-${month}`;
  }
  if (period === "weekly") {
    const firstDay = new Date(Date.UTC(year, 0, 1));
    const dayOfYear = Math.floor((date.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((dayOfYear + firstDay.getUTCDay() + 1) / 7);
    return `${year}-W${`${week}`.padStart(2, "0")}`;
  }
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

router.get("/profit/orders", async (req, res, next) => {
  try {
    const { from, to } = resolveDateRange(req.query);

    const items = await prisma.orderItem.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        order: { select: { id: true, status: true, placedAt: true } },
      },
    });

    res.json({
      data: items.map((item) => {
        const profitPerUnit = item.soldPrice - item.costPriceAtSale;
        const profitTotal = profitPerUnit * item.quantity;
        return {
          id: item.id,
          orderId: item.orderId,
          orderStatus: item.order.status,
          placedAt: item.order.placedAt,
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          soldPrice: item.soldPrice,
          costPriceAtSale: item.costPriceAtSale,
          profitPerUnit,
          profitTotal,
          createdAt: item.createdAt,
        };
      }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid query", issues: error.flatten() });
    }
    return next(error);
  }
});

router.get("/profit/summary", async (req, res, next) => {
  try {
    const { from, to, period } = resolveDateRange(req.query);

    const items = await prisma.orderItem.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      select: {
        soldPrice: true,
        costPriceAtSale: true,
        quantity: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const buckets = new Map<string, { revenue: number; cost: number; profit: number; count: number }>();

    for (const item of items) {
      const key = formatBucketKey(item.createdAt, period);
      const revenue = item.soldPrice * item.quantity;
      const cost = item.costPriceAtSale * item.quantity;
      const profit = revenue - cost;
      const bucket = buckets.get(key) ?? { revenue: 0, cost: 0, profit: 0, count: 0 };
      bucket.revenue += revenue;
      bucket.cost += cost;
      bucket.profit += profit;
      bucket.count += 1;
      buckets.set(key, bucket);
    }

    const data = Array.from(buckets.entries()).map(([key, value]) => ({
      period: key,
      revenue: value.revenue,
      cost: value.cost,
      profit: value.profit,
      orderItems: value.count,
    }));

    res.json({
      period,
      from,
      to,
      data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid query", issues: error.flatten() });
    }
    return next(error);
  }
});

const returnStatusSchema = z.object({
  status: z.enum(["requested", "reviewing", "approved", "rejected"]),
});

router.get("/returns", async (_req, res, next) => {
  try {
    const items = await prisma.returnRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        order: { select: { id: true, total: true, placedAt: true } },
      },
    });

    return res.json({
      data: items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        reason: item.reason,
        status: item.status,
        createdAt: item.createdAt,
        customer: item.user,
        order: item.order,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/returns/:id", async (req, res, next) => {
  try {
    const payload = returnStatusSchema.parse(req.body);
    const request = await prisma.returnRequest.update({
      where: { id: req.params.id },
      data: { status: payload.status },
    });
    return res.json(request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.flatten() });
    }
    return next(error);
  }
});

export default router;
