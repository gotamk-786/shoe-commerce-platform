"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  createAddress,
  createOrder,
  fetchAddresses,
  fetchPaymentSettings,
  fetchProfile,
  fetchProductBySlug,
  handleApiError,
  validateCoupon,
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { clearCart } from "@/store/slices/cart-slice";
import { Address } from "@/lib/types";

type Shipping = {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);
  const token = useAppSelector((state) => state.user.token);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [shipping, setShipping] = useState<Shipping>({
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    phone: "",
  });
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [addressMode, setAddressMode] = useState<"saved" | "new">("new");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [saveAddressForLater, setSaveAddressForLater] = useState(false);
  const [addressStatus, setAddressStatus] = useState<{ loading: boolean; error?: string }>({
    loading: false,
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
  const [paymentSettingsError, setPaymentSettingsError] = useState("");
  const [status, setStatus] = useState<{ loading: boolean; error?: string; done?: boolean }>({
    loading: false,
  });

  const subTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = Math.max(subTotal - discount, 0);
  const resetShippingAddressFields = () => {
    setShipping((prev) => ({
      ...prev,
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      phone: "",
    }));
  };

  useEffect(() => {
    fetchPaymentSettings()
      .then((data) => {
        setPaymentSettings(data);
        setPaymentSettingsError("");
      })
      .catch((err) => {
        setPaymentSettingsError(handleApiError(err));
      });
  }, []);

  useEffect(() => {
    if (!token) return;

    let active = true;

    Promise.allSettled([fetchProfile(), fetchAddresses()])
      .then(([profileResult, addressesResult]) => {
        if (!active) {
          return;
        }

        if (profileResult.status === "fulfilled") {
          setShipping((prev) => ({
            ...prev,
            name: prev.name || profileResult.value.name || "",
            email: prev.email || profileResult.value.email || "",
          }));
        }

        if (addressesResult.status === "fulfilled") {
          const addresses = addressesResult.value || [];
          setSavedAddresses(addresses);
          const defaultAddress = addresses.find((entry) => entry.isDefault) ?? addresses[0];
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
            setAddressMode("saved");
          } else {
            setAddressMode("new");
          }
          setAddressStatus({ loading: false });
        } else {
          setAddressStatus({ loading: false, error: handleApiError(addressesResult.reason) });
        }
      })
      .catch((err) => {
        if (active) {
          setAddressStatus({ loading: false, error: handleApiError(err) });
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  const applySavedAddress = (addressId: string) => {
    const selected = savedAddresses.find((entry) => entry.id === addressId);
    if (!selected) {
      return;
    }

    setSelectedAddressId(addressId);
    setAddressMode("saved");
    setShipping((prev) => ({
      ...prev,
      address: selected.street,
      city: selected.city,
      state: selected.state,
      zip: selected.zip,
      country: selected.country,
      phone: selected.phone,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      if (step === 0) {
        if (addressMode === "saved") {
          const selected = savedAddresses.find((entry) => entry.id === selectedAddressId);
          if (!selected) {
            setStatus({ loading: false, error: "Select a saved address or enter a new one." });
            return;
          }
          setShipping((prev) => ({
            ...prev,
            address: selected.street,
            city: selected.city,
            state: selected.state,
            zip: selected.zip,
            country: selected.country,
            phone: selected.phone,
          }));
        } else if (
          !shipping.name.trim() ||
          !shipping.email.trim() ||
          !shipping.address.trim() ||
          !shipping.city.trim() ||
          !shipping.country.trim()
        ) {
          setStatus({ loading: false, error: "Complete shipping details before continuing." });
          return;
        }
      }
      setStatus({ loading: false, error: undefined });
      setStep((prev) => (prev + 1) as 0 | 1 | 2);
      return;
    }
    try {
      if (!token) {
        router.push("/login");
        return;
      }
      setStatus({ loading: true });
      if (paymentSettings.paymentRequired && paymentMethod === "cod") {
        setStatus({ loading: false, error: "Please select a payment method to continue." });
        return;
      }
      const shippingPayload =
        addressMode === "saved"
          ? (() => {
              const selected = savedAddresses.find((entry) => entry.id === selectedAddressId);
              if (!selected) {
                return null;
              }
              return {
                name: shipping.name,
                email: shipping.email,
                address: selected.street,
                city: selected.city,
                state: selected.state,
                zip: selected.zip,
                country: selected.country,
                phone: selected.phone,
              };
            })()
          : shipping;

      if (!shippingPayload) {
        setStatus({ loading: false, error: "Select a saved address or enter a new one." });
        return;
      }

      const sanitizedItems = items
        .filter((item) => item.productId)
        .map((item) => ({
          source: item,
          productId: item.productId,
          variantId: item.variantId || undefined,
          quantity: Number(item.quantity) || 1,
          sizeUS: item.sizeUS || undefined,
          sizeEU: item.sizeEU || undefined,
          image: item.image || undefined,
          color: item.color || undefined,
        }));

      if (sanitizedItems.length === 0) {
        setStatus({ loading: false, error: "Your cart is empty or contains invalid items." });
        return;
      }

      const products = await Promise.all(
        Array.from(new Map(sanitizedItems.map((item) => [item.source.slug, item.source.slug])).values()).map(
          (slug) => fetchProductBySlug(slug),
        ),
      );
      const productMap = new Map(products.map((product) => [product.id, product]));
      const resolvedItems = sanitizedItems.map((item) => {
        const product = productMap.get(item.productId);
        if (!product) {
          return null;
        }

        let variant = item.variantId
          ? product.variants?.find((entry) => entry.id === item.variantId)
          : undefined;

        if (!variant && item.color) {
          variant = product.variants?.find(
            (entry) => entry.color.trim().toLowerCase() === item.color?.trim().toLowerCase(),
          );
        }

        if (!variant && product.variants?.length === 1) {
          variant = product.variants[0];
        }

        if (product.variants?.length) {
          if (!variant) {
            return null;
          }

          const size = variant.sizes.find(
            (entry) =>
              (item.sizeUS &&
                entry.sizeUS?.trim().toLowerCase() === item.sizeUS.trim().toLowerCase()) ||
              (item.sizeEU &&
                entry.sizeEU?.trim().toLowerCase() === item.sizeEU.trim().toLowerCase()),
          );

          if (!size) {
            return null;
          }

          return {
            productId: item.productId,
            variantId: variant.id,
            quantity: item.quantity,
            sizeUS: size.sizeUS || undefined,
            sizeEU: size.sizeEU || undefined,
            image: item.image || undefined,
            color: variant.color,
          };
        }

        return {
          productId: item.productId,
          quantity: item.quantity,
          sizeUS: item.sizeUS,
          sizeEU: item.sizeEU,
          image: item.image || undefined,
          color: item.color,
        };
      });

      if (resolvedItems.some((item) => !item)) {
        setStatus({
          loading: false,
          error: "One or more cart items are outdated. Remove that item and add it again.",
        });
        return;
      }

      const finalItems = resolvedItems.filter(
        (
          item,
        ): item is NonNullable<(typeof resolvedItems)[number]> => item !== null,
      );

      if (token && addressMode === "new" && saveAddressForLater) {
        const alreadySaved = savedAddresses.some(
          (entry) =>
            entry.street.trim().toLowerCase() === shippingPayload.address.trim().toLowerCase() &&
            entry.city.trim().toLowerCase() === shippingPayload.city.trim().toLowerCase() &&
            entry.country.trim().toLowerCase() === shippingPayload.country.trim().toLowerCase(),
        );

        if (!alreadySaved) {
          const createdAddress = await createAddress({
            label: "Checkout address",
            street: shippingPayload.address,
            city: shippingPayload.city,
            state: shippingPayload.state,
            zip: shippingPayload.zip,
            country: shippingPayload.country,
            phone: shippingPayload.phone,
            isDefault: savedAddresses.length === 0,
          });
          setSavedAddresses((prev) => [createdAddress, ...prev]);
        }
      }

      await createOrder({
        items: finalItems,
        shipping: Object.fromEntries(
          Object.entries({ ...shippingPayload, note }).filter(([, value]) => value.trim().length > 0),
        ),
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
            className={`pill ${
              idx === step ? "!bg-black !text-white !border-black" : "!bg-white !text-gray-800"
            }`}
          >
            {idx + 1}. {label}
          </div>
        ))}
      </div>
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {!token && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Log in first to place your order. Your cart will stay saved.
            </div>
          )}
          {paymentSettingsError && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Payment settings could not be refreshed. Default checkout options are being used.
            </div>
          )}
          {step === 0 && (
            <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
              <h2 className="text-xl font-semibold text-gray-900">Shipping details</h2>
              {token && savedAddresses.length > 0 && (
                <div className="space-y-4 rounded-2xl border border-black/10 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAddressMode("saved");
                        if (selectedAddressId) {
                          applySavedAddress(selectedAddressId);
                        }
                      }}
                      className={`rounded-full px-4 py-2 text-sm font-medium ${
                        addressMode === "saved"
                          ? "bg-black text-white"
                          : "border border-black/10 bg-white text-gray-700"
                      }`}
                    >
                      Use saved address
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddressMode("new");
                        setSelectedAddressId("");
                        setSaveAddressForLater(false);
                        resetShippingAddressFields();
                      }}
                      className={`rounded-full px-4 py-2 text-sm font-medium ${
                        addressMode === "new"
                          ? "bg-black text-white"
                          : "border border-black/10 bg-white text-gray-700"
                      }`}
                    >
                      Use new address
                    </button>
                  </div>

                  {addressMode === "saved" ? (
                    <div className="grid gap-3">
                      {savedAddresses.map((address) => (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => applySavedAddress(address.id)}
                          className={`rounded-2xl border px-4 py-4 text-left transition ${
                            selectedAddressId === address.id
                              ? "border-black bg-black text-white"
                              : "border-black/10 bg-white text-gray-900"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold">{address.label || "Saved address"}</p>
                            {address.isDefault && (
                              <span
                                className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${
                                  selectedAddressId === address.id
                                    ? "bg-white/15 text-white"
                                    : "bg-black/5 text-gray-600"
                                }`}
                              >
                                Default
                              </span>
                            )}
                          </div>
                          <p className={`mt-2 text-sm ${selectedAddressId === address.id ? "text-white/80" : "text-gray-600"}`}>
                            {address.street}, {address.city}, {address.state} {address.zip}
                          </p>
                          <p className={`text-xs ${selectedAddressId === address.id ? "text-white/65" : "text-gray-500"}`}>
                            {address.country} · {address.phone}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {addressMode === "new" ? (
                    <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-3 text-sm text-gray-600">
                      Enter a fresh delivery address below. Saved address fields have been cleared.
                    </div>
                  ) : null}
                </div>
              )}

              {addressStatus.error && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Saved addresses could not be loaded. You can still enter a new address.
                </div>
              )}

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
                disabled={addressMode === "saved"}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="City"
                  required
                  value={shipping.city}
                  onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                  disabled={addressMode === "saved"}
                />
                <Input
                  label="State / Province"
                  value={shipping.state}
                  onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                  disabled={addressMode === "saved"}
                />
                <Input
                  label="Country"
                  required
                  value={shipping.country}
                  onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                  disabled={addressMode === "saved"}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="ZIP / Postal code"
                  value={shipping.zip}
                  onChange={(e) => setShipping({ ...shipping, zip: e.target.value })}
                  disabled={addressMode === "saved"}
                />
              </div>
              <Input
                label="Phone"
                value={shipping.phone}
                onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                placeholder="03xx xxxxxxx"
                disabled={addressMode === "saved"}
              />
              {token && addressMode === "new" && (
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={saveAddressForLater}
                    onChange={(e) => setSaveAddressForLater(e.target.checked)}
                  />
                  Save this address for next checkout
                </label>
              )}
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
              <p className="text-sm text-gray-600">
                Shipping to {shipping.address}, {shipping.city}
                {shipping.state ? `, ${shipping.state}` : ""}
                {shipping.zip ? ` ${shipping.zip}` : ""}, {shipping.country}
              </p>
              <p className="text-sm text-gray-600">Payment: {paymentMethod}</p>
              <p className="text-sm font-semibold text-gray-900">
                Total: {formatCurrency(total)}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {step > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((prev) => (prev - 1) as 0 | 1 | 2)}
              >
                Back
              </Button>
            )}
            <Button variant="primary" type="submit" disabled={status.loading}>
              {!token ? "Log in to continue" : step < 2 ? "Continue" : "Place order"}
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
