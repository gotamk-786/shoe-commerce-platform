"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { createOrder, fetchPaymentSettings, handleApiError, validateCoupon } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { clearCart } from "@/store/slices/cart-slice";

type Shipping = {
  name: string;
  email: string;
  address: string;
  city: string;
  country: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [shipping, setShipping] = useState<Shipping>({
    name: "",
    email: "",
    address: "",
    city: "",
    country: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("easypaisa");
  const [note, setNote] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponStatus, setCouponStatus] = useState<{ loading: boolean; error?: string }>({
    loading: false,
  });
  const [paymentSettings, setPaymentSettings] = useState({
    paymentRequired: false,
    allowCod: true,
    allowDummy: true,
  });
  const [status, setStatus] = useState<{ loading: boolean; error?: string; done?: boolean }>({
    loading: false,
  });

  const subTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = Math.max(subTotal - discount, 0);

  useEffect(() => {
    fetchPaymentSettings()
      .then((data) => setPaymentSettings(data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      setStep((prev) => (prev + 1) as 0 | 1 | 2);
      return;
    }
    try {
      setStatus({ loading: true });
      if (paymentSettings.paymentRequired && paymentMethod === "cod") {
        setStatus({ loading: false, error: "Please select a payment method to continue." });
        return;
      }
      await createOrder({
        items,
        shipping: { ...shipping, note },
        paymentMethod,
        couponCode: couponCode || undefined,
      });
      dispatch(clearCart());
      setStatus({ loading: false, done: true });
      router.push("/account");
    } catch (err) {
      setStatus({ loading: false, error: handleApiError(err) });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-wrap gap-3 text-sm">
        {["Shipping", "Payment", "Review"].map((label, idx) => (
          <div
            key={label}
            className={`pill ${idx === step ? "bg-black text-white" : "text-gray-700"}`}
          >
            {idx + 1}. {label}
          </div>
        ))}
      </div>
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {step === 0 && (
            <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
              <h2 className="text-xl font-semibold text-gray-900">Shipping details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Full name"
                  required
                  value={shipping.name}
                  onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  required
                  value={shipping.email}
                  onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                />
              </div>
              <Input
                label="Address"
                required
                value={shipping.address}
                onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="City"
                  required
                  value={shipping.city}
                  onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                />
                <Input
                  label="Country"
                  required
                  value={shipping.country}
                  onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
              <h2 className="text-xl font-semibold text-gray-900">Payment method</h2>
              {paymentSettings.paymentRequired && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Payment required is enabled. COD will be disabled.
                </div>
              )}
              {[
                { id: "easypaisa", label: "EasyPaisa" },
                { id: "jazzcash", label: "JazzCash" },
                ...(paymentSettings.allowDummy
                  ? [{ id: "dummy", label: "Dummy test payment (paid)" }]
                  : []),
                ...(paymentSettings.allowCod ? [{ id: "cod", label: "Cash on Delivery" }] : []),
              ].map((method) => (
                <label
                  key={method.id}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 ${
                    paymentMethod === method.id
                      ? "border-black bg-black text-white"
                      : "border-black/10 bg-white text-gray-800"
                  }`}
                >
                  <span className="text-sm font-medium">{method.label}</span>
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id)}
                    className="h-4 w-4"
                  />
                </label>
              ))}
              <Input
                label="Order note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Sizing, delivery windows, or special handling"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
              <h2 className="text-xl font-semibold text-gray-900">Review</h2>
              <p className="text-sm text-gray-600">Shipping to {shipping.address}</p>
              <p className="text-sm text-gray-600">Payment: {paymentMethod}</p>
              <p className="text-sm font-semibold text-gray-900">
                Total: {formatCurrency(total)}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep((prev) => (prev - 1) as 0 | 1 | 2)}>
                Back
              </Button>
            )}
            <Button variant="primary" type="submit" disabled={status.loading}>
              {step < 2 ? "Continue" : "Place order"}
            </Button>
          </div>
          {status.error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {status.error}
            </div>
          )}
        </form>

        <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Order summary</h3>
            <span className="text-sm text-gray-600">{items.length} items</span>
          </div>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-gray-500">
                    {item.quantity} - {formatCurrency(item.price)} {item.color ? `- ${item.color}` : ""}{item.sizeUS || item.sizeEU
                      ? ` - ${item.sizeUS ? `US ${item.sizeUS}` : ""}${item.sizeUS && item.sizeEU ? " / " : ""}${item.sizeEU ? `EU ${item.sizeEU}` : ""}`
                      : ""}
                  </p>
                </div>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-black/10 pt-4 text-sm">
            <div className="flex items-center justify-between text-gray-700">
              <span>Subtotal</span>
              <span>{formatCurrency(subTotal)}</span>
            </div>
            {discount > 0 && (
              <div className="mt-2 flex items-center justify-between text-gray-700">
                <span>Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-gray-700">
              <span>Shipping</span>
              <span className="text-green-600">Complimentary</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-base font-semibold text-gray-900">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-700 shadow-[0_12px_40px_rgba(12,22,44,0.08)]">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
              </div>
              <Button
                variant="ghost"
                onClick={async () => {
                  if (!couponCode) return;
                  try {
                    setCouponStatus({ loading: true });
                    const data = await validateCoupon(couponCode, subTotal);
                    setDiscount(data.discount);
                    setCouponStatus({ loading: false });
                  } catch (err) {
                    setCouponStatus({ loading: false, error: handleApiError(err) });
                    setDiscount(0);
                  }
                }}
                disabled={couponStatus.loading}
              >
                {couponStatus.loading ? "Applying..." : "Apply"}
              </Button>
            </div>
            {couponStatus.error && (
              <p className="mt-2 text-xs text-rose-500">{couponStatus.error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
