"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createAddress,
  createOrder,
  deleteAddress,
  fetchAddresses,
  fetchPaymentSettings,
  fetchProductBySlug,
  fetchProfile,
  handleApiError,
  setDefaultAddress,
  updateAddress,
  validateCoupon,
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { clearCart } from "@/store/slices/cart-slice";
import {
  Address,
  DeliveryAddressInput,
} from "@/lib/types";
import AddressForm, { DeliveryAddressDraft } from "@/components/checkout/address-form";
import SavedAddressList from "@/components/checkout/saved-address-list";

const CHECKOUT_ADDRESS_CACHE_KEY = "thrifty_checkout_addresses";

type ShippingContact = {
  fullName: string;
  email: string;
};

const readCachedAddresses = (): Address[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CHECKOUT_ADDRESS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Address[]) : [];
  } catch {
    return [];
  }
};

const writeCachedAddresses = (addresses: Address[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHECKOUT_ADDRESS_CACHE_KEY, JSON.stringify(addresses));
  } catch {
    // ignore cache write failures
  }
};

const getPreferredAddress = (addresses: Address[]) =>
  addresses.find((entry) => entry.isDefault) ?? addresses[0] ?? null;

const buildDraftFromAddress = (address: Address, fallback: ShippingContact): DeliveryAddressDraft => ({
  addressId: address.id,
  label: address.label || "Home",
  fullName: address.fullName || fallback.fullName,
  email: fallback.email,
  phone: address.phone,
  fullAddress:
    address.fullAddress ||
    [address.houseNo, address.street, address.area, address.city, address.postalCode || address.zip, address.country]
      .filter(Boolean)
      .join(", "),
  houseNo: address.houseNo || "",
  street: address.street,
  landmark: address.landmark || "",
  area: address.area || "",
  city: address.city,
  state: address.state || "",
  postalCode: address.postalCode || address.zip || "",
  country: address.country,
  lat: address.lat,
  lng: address.lng,
  placeId: address.placeId,
  deliveryNotes: address.deliveryNotes || "",
});

const createEmptyDraft = (fallback: ShippingContact): DeliveryAddressDraft => ({
  label: "Home",
  fullName: fallback.fullName,
  email: fallback.email,
  phone: "",
  fullAddress: "",
  houseNo: "",
  street: "",
  landmark: "",
  area: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Pakistan",
  deliveryNotes: "",
});

const isValidPhone = (value: string) => /^(\+?\d[\d\s-]{6,})$/.test(value.trim());

const toAddressPayload = (draft: DeliveryAddressDraft): Omit<Address, "id"> => ({
  label: draft.label,
  fullName: draft.fullName,
  fullAddress: draft.fullAddress,
  houseNo: draft.houseNo,
  street: draft.street,
  landmark: draft.landmark,
  area: draft.area,
  city: draft.city,
  state: draft.state || "",
  zip: draft.postalCode || "",
  postalCode: draft.postalCode,
  country: draft.country,
  phone: draft.phone,
  lat: draft.lat,
  lng: draft.lng,
  placeId: draft.placeId,
  deliveryNotes: draft.deliveryNotes,
  isDefault: false,
});

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);
  const token = useAppSelector((state) => state.user.token);
  const persistedProfile = useAppSelector((state) => state.user.profile);
  const fallbackContact = useMemo(
    () => ({ fullName: persistedProfile?.name ?? "", email: persistedProfile?.email ?? "" }),
    [persistedProfile],
  );
  const cachedAddresses = useMemo(() => readCachedAddresses(), []);
  const preferredCachedAddress = useMemo(() => getPreferredAddress(cachedAddresses), [cachedAddresses]);

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>(cachedAddresses);
  const [addressMode, setAddressMode] = useState<"saved" | "new">(preferredCachedAddress ? "saved" : "new");
  const [selectedAddressId, setSelectedAddressId] = useState(preferredCachedAddress?.id ?? "");
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DeliveryAddressDraft>(
    preferredCachedAddress ? buildDraftFromAddress(preferredCachedAddress, fallbackContact) : createEmptyDraft(fallbackContact),
  );
  const [saveAddressForLater, setSaveAddressForLater] = useState(false);
  const [addressStatus, setAddressStatus] = useState<{ loading: boolean; error?: string }>({
    loading: Boolean(token) && cachedAddresses.length === 0,
  });
  const [addressAction, setAddressAction] = useState<{ busyId?: string; saving: boolean }>({ saving: false });
  const [paymentMethod, setPaymentMethod] = useState("easypaisa");
  const [note, setNote] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponStatus, setCouponStatus] = useState<{ loading: boolean; error?: string }>({ loading: false });
  const [paymentSettings, setPaymentSettings] = useState({ paymentRequired: false, allowCod: true, allowDummy: true });
  const [paymentSettingsError, setPaymentSettingsError] = useState("");
  const [status, setStatus] = useState<{ loading: boolean; error?: string; done?: boolean }>({ loading: false });

  const subTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingFee = 0;
  const total = Math.max(subTotal - discount, 0) + shippingFee;

  const updateDraft = (patch: Partial<DeliveryAddressDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const syncAddresses = (addresses: Address[]) => {
    setSavedAddresses(addresses);
    writeCachedAddresses(addresses);
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
      .then(async ([profileResult, addressesResult]) => {
        if (!active) return;

        let contact = fallbackContact;
        if (profileResult.status === "fulfilled") {
          contact = {
            fullName: profileResult.value.name || fallbackContact.fullName,
            email: profileResult.value.email || fallbackContact.email,
          };
          setDraft((prev) => ({
            ...prev,
            fullName: prev.fullName || contact.fullName,
            email: prev.email || contact.email,
          }));
        }

        if (addressesResult.status === "fulfilled") {
          const addresses = addressesResult.value || [];
          syncAddresses(addresses);
          const preferred = getPreferredAddress(addresses);
          if (preferred) {
            setSelectedAddressId(preferred.id);
            setAddressMode("saved");
            setDraft(buildDraftFromAddress(preferred, contact));
          } else {
            setAddressMode("new");
          }
          setAddressStatus({ loading: false });
        } else {
          setAddressStatus({ loading: false, error: handleApiError(addressesResult.reason) });
        }
      })
      .catch((error) => {
        if (active) {
          setAddressStatus({ loading: false, error: handleApiError(error) });
        }
      });

    return () => {
      active = false;
    };
  }, [token, fallbackContact]);

  const selectSavedAddress = async (address: Address) => {
    setSelectedAddressId(address.id);
    setAddressMode("saved");
    setEditingAddressId(null);
    setDraft(buildDraftFromAddress(address, fallbackContact));
  };

  const handleEditAddress = (address: Address) => {
    setAddressMode("new");
    setEditingAddressId(address.id);
    setSaveAddressForLater(true);
    setDraft(buildDraftFromAddress(address, fallbackContact));
  };

  const handleDeleteAddress = async (address: Address) => {
    try {
      setAddressAction({ saving: false, busyId: address.id });
      await deleteAddress(address.id);
      const remaining = savedAddresses.filter((entry) => entry.id !== address.id);
      syncAddresses(remaining);
      if (selectedAddressId === address.id) {
        const preferred = getPreferredAddress(remaining);
        if (preferred) {
          await selectSavedAddress(preferred);
        } else {
          setAddressMode("new");
          setSelectedAddressId("");
          setDraft(createEmptyDraft(fallbackContact));
        }
      }
    } catch (error) {
      setStatus({ loading: false, error: handleApiError(error) });
    } finally {
      setAddressAction({ saving: false });
    }
  };

  const handleSetDefault = async (address: Address) => {
    try {
      setAddressAction({ saving: false, busyId: address.id });
      const updated = (await setDefaultAddress(address.id)) as Address;
      const next = savedAddresses.map((entry) => ({
        ...entry,
        ...(entry.id === updated.id ? updated : { isDefault: false }),
      }));
      syncAddresses(next);
      await selectSavedAddress({ ...updated, isDefault: true });
    } catch (error) {
      setStatus({ loading: false, error: handleApiError(error) });
    } finally {
      setAddressAction({ saving: false });
    }
  };

  const persistDraftAddress = async () => {
    if (!token || (!saveAddressForLater && !editingAddressId)) return null;

    const payload = toAddressPayload(draft);

    if (editingAddressId) {
      const updated = (await updateAddress(editingAddressId, payload)) as Address;
      const next = savedAddresses.map((entry) => (entry.id === updated.id ? updated : entry));
      syncAddresses(next);
      setSelectedAddressId(updated.id);
      return updated;
    }

    const alreadySaved = savedAddresses.some(
      (entry) =>
        (entry.fullAddress || entry.street).trim().toLowerCase() === draft.fullAddress.trim().toLowerCase() &&
        entry.phone.trim() === draft.phone.trim(),
    );

    if (alreadySaved) return null;

    const created = (await createAddress({ ...payload, isDefault: savedAddresses.length === 0 })) as Address;
    syncAddresses([created, ...savedAddresses]);
    setSelectedAddressId(created.id);
    return created;
  };

  const validateDraft = async () => {
    if (!draft.fullName.trim() || !draft.email.trim() || !draft.phone.trim()) {
      return "Complete the customer name, email, and phone number.";
    }
    if (!isValidPhone(draft.phone)) {
      return "Enter a valid phone number.";
    }
    if (!draft.fullAddress.trim() || !draft.street.trim() || !draft.city.trim() || !draft.country.trim()) {
      return "Complete the delivery address before continuing.";
    }
    return null;
  };
  const buildShippingPayload = (): DeliveryAddressInput | null => {
    const deliveryNotes = [draft.deliveryNotes, note].filter(Boolean).join(" | ");

    if (addressMode === "saved") {
      const selected = savedAddresses.find((entry) => entry.id === selectedAddressId);
      if (!selected) return null;

      return {
        addressId: selected.id,
        label: selected.label || draft.label,
        fullName: draft.fullName,
        email: draft.email,
        phone: selected.phone,
        fullAddress:
          selected.fullAddress ||
          [selected.houseNo, selected.street, selected.area, selected.city, selected.postalCode || selected.zip, selected.country]
            .filter(Boolean)
            .join(", "),
        houseNo: selected.houseNo || undefined,
        street: selected.street,
        landmark: selected.landmark || undefined,
        area: selected.area || undefined,
        city: selected.city,
        state: selected.state || undefined,
        postalCode: selected.postalCode || selected.zip || undefined,
        country: selected.country,
        lat: selected.lat ?? undefined,
        lng: selected.lng ?? undefined,
        placeId: selected.placeId || undefined,
        deliveryNotes: deliveryNotes || selected.deliveryNotes || undefined,
      };
    }

    return {
      addressId: draft.addressId,
      label: draft.label,
      fullName: draft.fullName,
      email: draft.email,
      phone: draft.phone,
      fullAddress: draft.fullAddress,
      houseNo: draft.houseNo || undefined,
      street: draft.street,
      landmark: draft.landmark || undefined,
      area: draft.area || undefined,
      city: draft.city,
      state: draft.state || undefined,
      postalCode: draft.postalCode || undefined,
      country: draft.country,
      lat: draft.lat ?? undefined,
      lng: draft.lng ?? undefined,
      placeId: draft.placeId || undefined,
      deliveryNotes: deliveryNotes || undefined,
    };
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (step < 2) {
      if (step === 0) {
        if (addressMode === "saved") {
          const selected = savedAddresses.find((entry) => entry.id === selectedAddressId);
          if (!selected) {
            setStatus({ loading: false, error: "Select a saved address or add a new one." });
            return;
          }
        } else {
          const draftError = await validateDraft();
          if (draftError) {
            setStatus({ loading: false, error: draftError });
            return;
          }
          try {
            setAddressAction({ saving: true });
            await persistDraftAddress();
            setEditingAddressId(null);
          } catch (error) {
            setAddressAction({ saving: false });
            setStatus({ loading: false, error: handleApiError(error) });
            return;
          } finally {
            setAddressAction({ saving: false });
          }
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
      const shippingPayload = buildShippingPayload();
      if (!shippingPayload) {
        setStatus({ loading: false, error: "Select or create a valid delivery address first." });
        return;
      }
      if (paymentSettings.paymentRequired && paymentMethod === "cod") {
        setStatus({ loading: false, error: "Please select a payment method to continue." });
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
        if (!product) return null;

        let variant = item.variantId ? product.variants?.find((entry) => entry.id === item.variantId) : undefined;
        if (!variant && item.color) {
          variant = product.variants?.find((entry) => entry.color.trim().toLowerCase() === item.color?.trim().toLowerCase());
        }
        if (!variant && product.variants?.length === 1) variant = product.variants[0];

        if (product.variants?.length) {
          if (!variant) return null;
          const size = variant.sizes.find(
            (entry) =>
              (item.sizeUS && entry.sizeUS?.trim().toLowerCase() === item.sizeUS.trim().toLowerCase()) ||
              (item.sizeEU && entry.sizeEU?.trim().toLowerCase() === item.sizeEU.trim().toLowerCase()),
          );
          if (!size) return null;
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
        setStatus({ loading: false, error: "One or more cart items are outdated. Remove that item and add it again." });
        return;
      }

      const finalItems = resolvedItems.filter((item): item is NonNullable<(typeof resolvedItems)[number]> => item !== null);
      await createOrder({ items: finalItems, shipping: shippingPayload, paymentMethod, couponCode: couponCode || undefined });
      dispatch(clearCart());
      setStatus({ loading: false, done: true });
      router.push("/account");
    } catch (error) {
      setStatus({ loading: false, error: handleApiError(error) });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-wrap gap-3 text-sm">
        {["Shipping", "Payment", "Review"].map((label, idx) => (
          <div key={label} className={`pill ${idx === step ? "!border-black !bg-black !text-white" : "!bg-white !text-gray-800"}`}>
            {idx + 1}. {label}
          </div>
        ))}
      </div>
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {!token && <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Log in first to place your order. Your cart will stay saved.</div>}
          {paymentSettingsError && <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Payment settings could not be refreshed. Default checkout options are being used.</div>}
          {step === 0 && (
            <div className="space-y-5 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Delivery address</h2>
                  <p className="mt-1 text-sm text-gray-500">Choose a saved address or add a new delivery location.</p>
                </div>
                {token ? (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => {
                      const preferred = getPreferredAddress(savedAddresses);
                      if (preferred) void selectSavedAddress(preferred);
                    }} className={`rounded-full px-4 py-2 text-sm font-medium ${addressMode === "saved" ? "bg-black text-white" : "border border-black/10 bg-white text-gray-700"}`}>
                      Saved addresses
                    </button>
                    <button type="button" onClick={() => {
                      setAddressMode("new");
                      setEditingAddressId(null);
                      setSelectedAddressId("");
                      setSaveAddressForLater(false);
                      setDraft(createEmptyDraft(fallbackContact));
                    }} className={`rounded-full px-4 py-2 text-sm font-medium ${addressMode === "new" ? "bg-black text-white" : "border border-black/10 bg-white text-gray-700"}`}>
                      Add new address
                    </button>
                  </div>
                ) : null}
              </div>

              {addressStatus.error && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Saved addresses could not be loaded. You can still add a new address.</div>}

              {addressMode === "saved" && savedAddresses.length > 0 ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input label="Full name" required value={draft.fullName} onChange={(event) => updateDraft({ fullName: event.target.value })} />
                    <Input label="Email" type="email" required value={draft.email} onChange={(event) => updateDraft({ email: event.target.value })} />
                  </div>
                  <SavedAddressList
                    addresses={savedAddresses}
                    selectedId={selectedAddressId}
                    busyId={addressAction.busyId}
                    onSelect={(address) => void selectSavedAddress(address)}
                    onSetDefault={(address) => void handleSetDefault(address)}
                    onEdit={handleEditAddress}
                    onDelete={(address) => void handleDeleteAddress(address)}
                  />
                </>
              ) : (
                <AddressForm
                  value={draft}
                  saveForLater={saveAddressForLater}
                  editMode={Boolean(editingAddressId)}
                  onChange={updateDraft}
                  onSaveForLaterChange={setSaveAddressForLater}
                />
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
              <h2 className="text-xl font-semibold text-gray-900">Payment method</h2>
              {paymentSettings.paymentRequired && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Payment required is enabled. COD will be disabled.</div>}
              {[
                { id: "easypaisa", label: "EasyPaisa" },
                { id: "jazzcash", label: "JazzCash" },
                ...(paymentSettings.allowDummy ? [{ id: "dummy", label: "Dummy test payment (paid)" }] : []),
                ...(paymentSettings.allowCod ? [{ id: "cod", label: "Cash on Delivery" }] : []),
              ].map((method) => (
                <label key={method.id} className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 ${paymentMethod === method.id ? "border-black bg-black text-white" : "border-black/10 bg-white text-gray-800"}`}>
                  <span className="text-sm font-medium">{method.label}</span>
                  <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} className="h-4 w-4" />
                </label>
              ))}
              <Input label="Order note (optional)" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Delivery timing, gate number, or special handling" />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
              <h2 className="text-xl font-semibold text-gray-900">Review</h2>
              <p className="text-sm text-gray-600">Deliver to {draft.fullName} - {draft.phone}</p>
              <p className="text-sm text-gray-600">{draft.fullAddress}</p>
              <p className="text-sm text-gray-600">{draft.area ? `${draft.area}, ` : ""}{draft.city}{draft.state ? `, ${draft.state}` : ""}{draft.postalCode ? ` ${draft.postalCode}` : ""}, {draft.country}</p>
              <p className="text-sm text-gray-600">Payment: {paymentMethod}</p>
              <p className="text-sm font-semibold text-gray-900">Total: {formatCurrency(total)}</p>
            </div>
          )}

          <div className="flex gap-3">
            {step > 0 && <Button type="button" variant="ghost" onClick={() => setStep((prev) => (prev - 1) as 0 | 1 | 2)}>Back</Button>}
            <Button variant="primary" type="submit" disabled={status.loading || addressAction.saving || addressStatus.loading}>
              {!token ? "Log in to continue" : status.loading ? "Processing..." : addressAction.saving ? "Saving address..." : step < 2 ? "Continue" : "Place order"}
            </Button>
          </div>
          {status.error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{status.error}</div>}
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
                  <p className="text-gray-500">{item.quantity} - {formatCurrency(item.price)} {item.color ? `- ${item.color}` : ""}{item.sizeUS || item.sizeEU ? ` - ${item.sizeUS ? `US ${item.sizeUS}` : ""}${item.sizeUS && item.sizeEU ? " / " : ""}${item.sizeEU ? `EU ${item.sizeEU}` : ""}` : ""}</p>
                </div>
                <span className="font-semibold text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-black/10 pt-4 text-sm">
            <div className="flex items-center justify-between text-gray-700"><span>Subtotal</span><span>{formatCurrency(subTotal)}</span></div>
            {discount > 0 && <div className="mt-2 flex items-center justify-between text-gray-700"><span>Discount</span><span>-{formatCurrency(discount)}</span></div>}
            <div className="mt-2 flex items-center justify-between text-gray-700"><span>Shipping</span><span className={shippingFee === 0 ? "text-green-600" : "text-gray-900"}>{shippingFee === 0 ? "Free" : formatCurrency(shippingFee)}</span></div>
            <div className="mt-3 flex items-center justify-between text-base font-semibold text-gray-900"><span>Total</span><span>{formatCurrency(total)}</span></div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-700 shadow-[0_12px_40px_rgba(12,22,44,0.08)]">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input label="Coupon code" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} />
              </div>
              <Button variant="ghost" onClick={async () => {
                if (!couponCode) return;
                try {
                  setCouponStatus({ loading: true });
                  const data = await validateCoupon(couponCode, subTotal);
                  setDiscount(data.discount);
                  setCouponStatus({ loading: false });
                } catch (error) {
                  setCouponStatus({ loading: false, error: handleApiError(error) });
                  setDiscount(0);
                }
              }} disabled={couponStatus.loading}>
                {couponStatus.loading ? "Applying..." : "Apply"}
              </Button>
            </div>
            {couponStatus.error && <p className="mt-2 text-xs text-rose-500">{couponStatus.error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
