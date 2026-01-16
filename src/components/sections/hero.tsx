"use client";

import { motion } from "framer-motion";
import Button from "../ui/button";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -right-20 top-10 h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(12,22,44,0.08),_transparent_60%)] blur-3xl" />
        <div className="absolute left-10 top-12 h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(12,22,44,0.06),_transparent_60%)] blur-2xl opacity-70" />
        <div className="absolute left-1/3 top-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,_rgba(15,23,42,0.05),_transparent_60%)] blur-2xl opacity-60" />
      </div>
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-6 py-24 text-center md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pill"
        >
          Precision footwear
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-balance text-4xl font-semibold leading-tight tracking-[-0.02em] text-gray-900 md:text-5xl"
        >
          Thrifty Shoes. Precision comfort.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-2xl text-lg text-gray-600"
        >
          Minimal design, elevated materials, built to move effortlessly.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <Link href="/collection">
            <Button variant="primary">Shop collection</Button>
          </Link>
          <Link href="/collection">
            <Button variant="ghost">View new arrivals</Button>
          </Link>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-10 h-72 w-[70%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0.08),_transparent_60%)] blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-[50%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0.05),_transparent_60%)] blur-3xl" />
      </div>
    </section>
  );
}
