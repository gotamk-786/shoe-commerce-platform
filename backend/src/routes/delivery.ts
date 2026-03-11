import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { DeliveryZoneRecord, findMatchingZone } from "../lib/delivery-zones";
import { reverseGeocode, searchAddresses } from "../lib/geocoding";

const router = Router();

const coordinateSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

router.get("/autocomplete", async (req, res, next) => {
  try {
    const query = z.string().trim().min(3).parse(req.query.q);
    const suggestions = await searchAddresses(query, 5);
    return res.json({ data: suggestions });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Search query must be at least 3 characters." });
    }
    return next(error);
  }
});

router.get("/reverse-geocode", async (req, res, next) => {
  try {
    const { lat, lng } = coordinateSchema.parse(req.query);
    const result = await reverseGeocode(lat, lng);
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Valid latitude and longitude are required." });
    }
    return next(error);
  }
});

router.post("/validate-zone", async (req, res, next) => {
  try {
    const { lat, lng, city } = coordinateSchema
      .extend({
        city: z.string().trim().optional(),
      })
      .parse(req.body);

    const zones = (await (prisma as any).deliveryZone.findMany({
      where: city
        ? {
            isActive: true,
            OR: [{ city: city.trim() }, { city: { equals: city.trim(), mode: "insensitive" } }],
          }
        : { isActive: true },
      orderBy: [{ shippingFee: "asc" }, { createdAt: "asc" }],
    })) as DeliveryZoneRecord[];

    const fallbackZones =
      zones.length > 0
        ? zones
        : ((await (prisma as any).deliveryZone.findMany({
            where: { isActive: true },
            orderBy: [{ shippingFee: "asc" }, { createdAt: "asc" }],
          })) as DeliveryZoneRecord[]);

    const match = findMatchingZone(fallbackZones, { lat, lng });
    if (!match) {
      return res.json({
        available: false,
        message: "Delivery not available in this area.",
      });
    }

    return res.json({
      available: true,
      zone: {
        id: match.zone.id,
        name: match.zone.name,
        city: match.zone.city,
        coverageType: match.zone.coverageType,
        shippingFee: match.zone.shippingFee,
        estimatedDeliveryTime: match.zone.estimatedDeliveryTime,
        codAvailable: match.zone.codAvailable,
        distanceKm: match.distanceKm,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Valid delivery coordinates are required." });
    }
    return next(error);
  }
});

export default router;
