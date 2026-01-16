"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ProductImage } from "@/lib/types";

export default function ProductGallery({ images }: { images: ProductImage[] }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  useEffect(() => {
    setActive(0);
  }, [images]);

  return (
    <div className="grid gap-4 md:grid-cols-[72px_1fr]">
      <div className="flex gap-3 overflow-x-auto md:flex-col md:overflow-visible">
        {images.map((img, idx) => (
          <button
            key={img.url + idx}
            onClick={() => setActive(idx)}
            className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border bg-white ${
              idx === active ? "border-black" : "border-black/10"
            }`}
          >
            {img.url ? (
              <Image src={img.url} alt={img.alt || "Thumb"} fill className="object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-[10px] text-gray-500">
                Image
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="relative aspect-square overflow-hidden rounded-3xl bg-[#ededed]">
        {current?.url ? (
          <motion.div
            key={current.url}
            initial={{ opacity: 0.4, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full w-full"
          >
            <Image
              src={current.url}
              alt={current.alt || "Product"}
              fill
              className="object-contain"
              sizes="(max-width:768px) 100vw, 50vw"
            />
          </motion.div>
        ) : (
          <div className="grid h-full place-items-center text-sm text-gray-500">
            Awaiting product imagery from the API
          </div>
        )}
      </div>
    </div>
  );
}
