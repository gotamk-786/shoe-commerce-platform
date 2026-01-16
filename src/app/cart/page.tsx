"use client";

import Link from "next/link";
import Button from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { formatCurrency } from "@/lib/format";
import { removeItem, updateQuantity } from "@/store/slices/cart-slice";

export default function CartPage() {
  const items = useAppSelector((state) => state.cart.items);
  const dispatch = useAppDispatch();
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="pill mb-2 inline-block text-gray-700">Cart</p>
          <h1 className="text-2xl font-semibold text-gray-900">Your selection</h1>
        </div>
        <Link href="/collection">
          <Button variant="ghost">Continue shopping</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-black/10 bg-white p-8 text-center text-gray-600 shadow-[0_20px_60px_rgba(12,22,44,0.08)]">
          Cart is empty. Start with the collection.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-[0_16px_50px_rgba(12,22,44,0.08)] md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.color ? `Color ${item.color}` : "Color: standard"} {item.sizeUS || item.sizeEU
                    ? `- Size ${item.sizeUS ? `US ${item.sizeUS}` : ""}${item.sizeUS && item.sizeEU ? " / " : ""}${item.sizeEU ? `EU ${item.sizeEU}` : ""}`
                    : "- Size: any"} - {formatCurrency(item.price)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-black/10 px-3 py-1">
                  <button
                    onClick={() =>
                      dispatch(updateQuantity({ id: item.id, quantity: Math.max(1, item.quantity - 1) }))
                    }
                  >
                    −
                  </button>
                  <span className="text-sm">{item.quantity}</span>
                  <button
                    onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                  >
                    +
                  </button>
                </div>
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
          ))}
          <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-4 shadow-[0_16px_50px_rgba(12,22,44,0.08)]">
            <div>
              <p className="text-sm text-gray-600">Subtotal</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(subtotal)}</p>
            </div>
            <Link href="/checkout">
              <Button variant="primary">Checkout</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
