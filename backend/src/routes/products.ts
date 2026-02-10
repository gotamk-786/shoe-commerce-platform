import { Router } from "express";
import prisma from "../prisma";

const router = Router();

const normalizeImages = (images: unknown): { url: string; alt?: string }[] => {
  if (!images) return [];
  if (Array.isArray(images)) {
    if (images.length === 0) return [];
    if (typeof images[0] === "string") {
      return (images as string[]).filter(Boolean).map((url) => ({ url }));
    }
    return images as { url: string; alt?: string }[];
  }
  return [];
};

router.get("/", async (req, res, next) => {
  try {
    const featured = req.query.featured === "true";
    const limit = req.query.limit ? Number(req.query.limit) : 12;
    const page = req.query.page ? Number(req.query.page) : 1;
    const category = req.query.category ? String(req.query.category) : undefined;
    const condition = req.query.condition ? String(req.query.condition) : undefined;
    const gender = req.query.gender ? String(req.query.gender) : undefined;
    const size = req.query.size ? String(req.query.size) : undefined;
    const color = req.query.color ? String(req.query.color) : undefined;
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const exclude = req.query.exclude ? String(req.query.exclude) : undefined;
    const sort = req.query.sort ? String(req.query.sort) : undefined;
    const q = req.query.q ? String(req.query.q).trim() : undefined;

    const where: Record<string, unknown> = { active: true };
    if (featured) where.featured = true;
    if (condition) where.condition = condition;
    if (gender) where.gender = gender;
    if (exclude) where.id = { not: exclude };
    if (category) {
      where.category = { is: { OR: [{ id: category }, { name: category }] } };
    }
    if (size || color) {
      where.variants = {
        some: {
          ...(color ? { color } : {}),
          ...(size
            ? {
                sizes: {
                  some: {
                    OR: [{ sizeUS: size }, { sizeEU: size }],
                  },
                },
              }
            : {}),
        },
      };
    }
    if (minPrice || maxPrice) {
      where.sellPrice = {
        ...(minPrice ? { gte: minPrice } : {}),
        ...(maxPrice ? { lte: maxPrice } : {}),
      };
    }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const orderBy =
      sort === "price_asc"
        ? { sellPrice: "asc" }
        : sort === "price_desc"
          ? { sellPrice: "desc" }
          : { createdAt: "desc" };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        sellPrice: true,
        discount: true,
        condition: true,
        gender: true,
        sizes: true,
        tags: true,
        metadata: true,
        stock: true,
        active: true,
        featured: true,
        images: true,
        category: { select: { id: true, name: true } },
          variants: {
            select: {
              id: true,
              color: true,
              priceOverride: true,
              images: true,
              sizes: {
                select: { id: true, sizeUS: true, sizeEU: true, stock: true },
              },
            },
          },
        },
      }),
    ]);

    res.json({
      data: products.map((product) => {
        const firstVariant = product.variants[0];
        const variantImages = normalizeImages(firstVariant?.images);
        const productImages = normalizeImages(product.images);
        return {
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          price: product.sellPrice,
          discount: product.discount ?? undefined,
          condition: product.condition ?? undefined,
          gender: product.gender ?? undefined,
          stock: product.stock,
          active: product.active,
          featured: product.featured,
          images: variantImages.length ? variantImages : productImages,
          sizes: (product.sizes as string[]) ?? undefined,
          tags: (product.tags as string[]) ?? undefined,
          metadata:
            (product.metadata as Record<string, string | number | string[]>) ??
            undefined,
          category: product.category?.name,
          categoryId: product.category?.id,
          variants: product.variants.map((variant) => ({
            id: variant.id,
            color: variant.color,
            priceOverride: variant.priceOverride ?? undefined,
            images: (variant.images as { url: string; alt?: string }[]) ?? [],
            sizes: variant.sizes,
          })),
        };
      }),
      page,
      limit,
      total,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
      where: { slug: req.params.slug, active: true },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        sellPrice: true,
        discount: true,
        condition: true,
        gender: true,
        sizes: true,
        tags: true,
        metadata: true,
        stock: true,
        active: true,
        featured: true,
        images: true,
        category: { select: { id: true, name: true } },
        variants: {
          select: {
            id: true,
            color: true,
            priceOverride: true,
            images: true,
            sizes: {
              select: { id: true, sizeUS: true, sizeEU: true, stock: true },
            },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const variantImages = normalizeImages(product.variants[0]?.images);
    const productImages = normalizeImages(product.images);

    return res.json({
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.sellPrice,
      discount: product.discount ?? undefined,
      condition: product.condition ?? undefined,
      gender: product.gender ?? undefined,
      stock: product.stock,
      active: product.active,
      featured: product.featured,
      images: variantImages.length ? variantImages : productImages,
      sizes: (product.sizes as string[]) ?? undefined,
      tags: (product.tags as string[]) ?? undefined,
      metadata:
        (product.metadata as Record<string, string | number | string[]>) ??
        undefined,
      category: product.category?.name,
      categoryId: product.category?.id,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        color: variant.color,
        priceOverride: variant.priceOverride ?? undefined,
        images: (variant.images as { url: string; alt?: string }[]) ?? [],
        sizes: variant.sizes,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
