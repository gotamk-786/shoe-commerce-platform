"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleCart } from "@/store/slices/ui-slice";
import { removeItem, updateQuantity } from "@/store/slices/cart-slice";
import Button from "../ui/button";
import { formatCurrency } from "@/lib/format";
import Image from "next/image";

export default function CartDrawer() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.ui.cartOpen);
  const items = useAppSelector((state) => state.cart.items);

  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black"
            onClick={() => dispatch(toggleCart(false))}
          />
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-[0_25px_80px_rgba(12,22,44,0.22)]"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Cart
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {items.length} item{items.length !== 1 && "s"}
                  </p>
                </div>
                <button
                  className="text-sm text-gray-600 hover:text-black"
                  onClick={() => dispatch(toggleCart(false))}
                >
                  Close
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
                {items.length === 0 && (
                  <div className="glass flex flex-col items-center justify-center rounded-2xl px-4 py-10 text-center text-gray-600">
                    <p className="text-lg font-semibold text-gray-900">Cart is empty</p>
                    <p className="mt-2 max-w-sm text-sm">
                      Pick your next pair from the collection. Everything updates live
                      from the API—no placeholders here.
                    </p>
                    <Button
                      variant="primary"
                      className="mt-4"
                      onClick={() => dispatch(toggleCart(false))}
                    >
                      Browse collection
                    </Button>
                  </div>
                )}

                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-2xl border border-black/10 p-4 shadow-[0_10px_40px_rgba(12,22,44,0.08)]"
                  >
                    <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-gray-100">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs text-gray-500">
                          Image
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <Link
                          href={`/product/${item.slug}`}
                          className="text-sm font-semibold text-gray-900"
                          onClick={() => dispatch(toggleCart(false))}
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-gray-500">
                          {item.color ? `Color ${item.color}` : "Color: standard"}{" "}
                          {item.sizeUS || item.sizeEU
                            ? `• Size ${item.sizeUS ? `US ${item.sizeUS}` : ""}${item.sizeUS && item.sizeEU ? " / " : ""}${item.sizeEU ? `EU ${item.sizeEU}` : ""}`
                            : "• Size: any"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 rounded-full border border-black/10 px-3 py-1">
                          <button
                            className="text-sm text-gray-600"
                            onClick={() =>
                              dispatch(
                                updateQuantity({
                                  id: item.id,
                                  quantity: Math.max(1, item.quantity - 1),
                                }),
                              )
                            }
                          >
                            −
                          </button>
                          <span className="text-sm font-medium">{item.quantity}</span>
                          <button
                            className="text-sm text-gray-600"
                            onClick={() =>
                              dispatch(
                                updateQuantity({
                                  id: item.id,
                                  quantity: item.quantity + 1,
                                }),
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                          <button
                            className="text-xs text-gray-500 underline"
                            onClick={() => dispatch(removeItem(item.id))}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-black/10 px-6 py-5">
                <div className="flex items-center justify-between text-sm text-gray-700">
                  <span>Subtotal</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => dispatch(toggleCart(false))}
                  >
                    Continue shopping
                  </Button>
                  <Link className="flex-1" href="/checkout" onClick={() => dispatch(toggleCart(false))}>
                    <Button variant="primary" full>
                      Checkout
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
