"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleCart } from "@/store/slices/ui-slice";
import { useEffect, useMemo, useState } from "react";
import Button from "../ui/button";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/format";
import { fetchWishlist } from "@/lib/api";
import { cn } from "@/lib/utils";

const HeartIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
  </svg>
);

const CompareIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="10" y="10" width="10" height="10" rx="1.5" />
    <rect x="4" y="4" width="10" height="10" rx="1.5" />
  </svg>
);

const CartIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 8h12l-1 11H7L6 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

export default function Navbar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);
  const compareCount = useAppSelector((state) => state.compare.items.length);
  const user = useAppSelector((state) => state.user.profile);
  const token = useAppSelector((state) => state.user.token);
  const isAdmin = user?.role === "admin";
  const [wishlistCount, setWishlistCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const wishlistDisplay = token ? wishlistCount : 0;

  const total = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems],
  );

  useEffect(() => {
    if (!token) {
      setWishlistCount(0);
      return;
    }
    fetchWishlist()
      .then((items) => setWishlistCount(items.length))
      .catch(() => setWishlistCount(0));
  }, [token]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousOverflow || "";
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  const links = [
    { href: "/", label: "Home" },
    { href: "/collection", label: "Collection" },
    { href: "/wishlist", label: "Wishlist" },
    { href: "/account", label: "Account" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin Panel" }] : []),
  ];

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <header className="z-50 md:sticky md:top-0 md:backdrop-blur-lg">
        <div className="mx-auto max-w-6xl px-4 py-4 md:px-6">
          <div className="glass fade-border flex flex-col gap-3 rounded-3xl px-5 py-4 md:flex-row md:items-center md:justify-between md:rounded-2xl md:px-4 md:py-3">
            <div className="flex items-center justify-between md:justify-start md:gap-8">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-black text-sm font-bold text-white">
                  TS
                </div>
                <span>Thrifty Shoes</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((value) => !value)}
                className="grid h-12 w-12 place-items-center rounded-full border border-black/10 bg-white text-gray-800 md:hidden"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {mobileMenuOpen ? (
                    <>
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </>
                  ) : (
                    <>
                      <path d="M3 6h18" />
                      <path d="M3 12h18" />
                      <path d="M3 18h18" />
                    </>
                  )}
                </svg>
              </button>
              <nav className="hidden items-center gap-6 text-sm text-gray-700 md:flex" aria-label="Primary navigation">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn("relative pb-1", isLinkActive(link.href) ? "text-black" : "text-gray-600")}
                  >
                    {isLinkActive(link.href) && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute -bottom-1 left-0 h-[2px] w-full bg-black"
                      />
                    )}
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="grid w-full grid-cols-3 gap-2 md:hidden">
              <Link
                href="/wishlist"
                aria-label="Open wishlist"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-black/10 bg-white text-gray-800"
              >
                <HeartIcon className="h-5 w-5" />
                <span className="rounded-full bg-black px-2 py-0.5 text-xs font-semibold text-white">
                  {wishlistDisplay}
                </span>
              </Link>

              <Link
                href="/compare"
                aria-label="Open compare"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-black/10 bg-white text-gray-800"
              >
                <CompareIcon className="h-5 w-5" />
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold text-gray-800">
                  {compareCount}
                </span>
              </Link>

              <button
                type="button"
                onClick={() => dispatch(toggleCart(true))}
                aria-label="Open cart"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-black/10 bg-white text-gray-800"
              >
                <CartIcon className="h-5 w-5" />
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold text-gray-800">
                  {cartItems.length}
                </span>
              </button>
            </div>

            <div className="hidden w-full flex-wrap items-center gap-2 md:flex md:w-auto md:gap-3">
              <Link href="/wishlist">
                <Button variant="ghost" className="text-xs sm:text-sm">
                  <span className="inline-flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-black/5">
                      <HeartIcon className="h-4 w-4 text-gray-700" />
                    </span>
                    <span>Wishlist</span>
                    <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">
                      {wishlistDisplay}
                    </span>
                  </span>
                </Button>
              </Link>

              <Link href="/compare">
                <Button variant="ghost" className="text-xs sm:text-sm">
                  <span className="inline-flex items-center gap-2">
                    <CompareIcon className="h-4 w-4 text-gray-700" />
                    <span>Compare</span>
                    <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-gray-800">
                      {compareCount}
                    </span>
                  </span>
                </Button>
              </Link>

              <Button
                variant="ghost"
                onClick={() => dispatch(toggleCart(true))}
                className="text-xs sm:text-sm"
              >
                <span className="inline-flex items-center gap-2">
                  <CartIcon className="h-4 w-4 text-gray-700" />
                  <span>Cart</span>
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-gray-800">
                    {cartItems.length}
                  </span>
                </span>
                <span className="hidden sm:inline">| {formatCurrency(total)}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[140] bg-black/40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        >
          <aside
            className="h-full w-[86%] max-w-xs overflow-y-auto bg-white px-5 py-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">Menu</p>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full border border-black/10 px-3 py-1 text-sm text-gray-700"
              >
                Close
              </button>
            </div>
            <nav className="space-y-2" aria-label="Mobile navigation">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "block rounded-xl border px-4 py-3 text-base font-medium transition",
                    isLinkActive(link.href)
                      ? "border-gray-300 bg-gray-100 text-gray-900"
                      : "border-black/10 text-gray-800 hover:border-black/20",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
