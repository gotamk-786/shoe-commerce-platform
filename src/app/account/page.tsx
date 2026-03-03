"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Skeleton from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { buildTrackingUrl } from "@/lib/tracking";
import {
  fetchOrders,
  fetchProfile,
  handleApiError,
  updateProfile,
  uploadAvatar,
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  fetchPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  fetchNotifications,
  updateNotifications,
  changePassword,
  downloadInvoice,
  fetchPreferences,
  updatePreferences,
  fetchTickets,
  createTicket,
  fetchReturns,
  createReturn,
  fetchActivity,
  requestTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
} from "@/lib/api";
import {
  Address,
  NotificationPreference,
  Order,
  PaymentMethod,
  Product,
  UserProfile,
} from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout, updateProfile as updateProfileAction } from "@/store/slices/user-slice";
import { cn } from "@/lib/utils";

type AccountSection = "profile" | "orders" | "addresses" | "payments" | "security";

const accountSections: { id: AccountSection; label: string; hint: string }[] = [
  { id: "profile", label: "Profile", hint: "Personal info" },
  { id: "orders", label: "Orders", hint: "Orders & returns" },
  { id: "addresses", label: "Addresses", hint: "Shipping places" },
  { id: "payments", label: "Payments", hint: "Payment & alerts" },
  { id: "security", label: "Security", hint: "Password & 2FA" },
];

export default function AccountPage() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.user.token);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [notifications, setNotifications] = useState<NotificationPreference>({
    emailEnabled: true,
    smsEnabled: false,
    phone: "",
  });
  const [addressForm, setAddressForm] = useState<Omit<Address, "id">>({
    label: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    phone: "",
    isDefault: false,
  });
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState<Omit<PaymentMethod, "id">>({
    provider: "easypaisa",
    label: "",
    maskedNumber: "",
    isDefault: false,
  });
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [preferences, setPreferences] = useState({
    sizeUS: "",
    sizeEU: "",
    brandsText: "",
  });
  const [tickets, setTickets] = useState<
    { id: string; subject: string; message: string; status: string; createdAt: string }[]
  >([]);
  const [ticketForm, setTicketForm] = useState({ subject: "", message: "" });
  const [returns, setReturns] = useState<
    { id: string; orderId: string; reason: string; status: string; createdAt: string }[]
  >([]);
  const [returnForm, setReturnForm] = useState({ orderId: "", reason: "" });
  const [activity, setActivity] = useState<
    { id: string; type: string; message: string; createdAt: string }[]
  >([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorStatus, setTwoFactorStatus] = useState<{ loading: boolean; error?: string }>({
    loading: false,
  });
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [activeAccountSection, setActiveAccountSection] = useState<AccountSection>("profile");
  const totalSpend = orders.reduce((sum, order) => sum + order.total, 0);
  const lastOrder = orders[0];
  const completionScore = [
    Boolean(profile?.name),
    Boolean(profile?.email),
    Boolean(avatarUrl),
    Boolean(coverUrl),
    addresses.length > 0,
    paymentMethods.length > 0,
    Boolean(preferences.sizeUS || preferences.sizeEU || preferences.brandsText),
    twoFactorEnabled,
  ].filter(Boolean).length;
  const completionPercent = Math.round((completionScore / 8) * 100);
  const initials =
    profile?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 3)
      .toUpperCase() || "TS";

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const user = await fetchProfile();
        setProfile(user);
        setName(user.name);
        setAvatarUrl(user.avatarUrl ?? "");
        setCoverUrl(user.coverUrl ?? "");
        const [
          data,
          addressData,
          paymentData,
          notificationData,
          preferenceData,
          ticketData,
          returnData,
          activityData,
        ] = await Promise.all([
          fetchOrders(),
          fetchAddresses(),
          fetchPaymentMethods(),
          fetchNotifications(),
          fetchPreferences(),
          fetchTickets(),
          fetchReturns(),
          fetchActivity(),
        ]);
        setOrders(data || []);
        setAddresses(addressData || []);
        setPaymentMethods(paymentData || []);
        setNotifications(notificationData || { emailEnabled: true, smsEnabled: false, phone: "" });
        setPreferences({
          sizeUS: preferenceData?.sizeUS ?? "",
          sizeEU: preferenceData?.sizeEU ?? "",
          brandsText: Array.isArray(preferenceData?.brands)
            ? preferenceData.brands.join(", ")
            : "",
        });
        setTickets(ticketData || []);
        setReturns(returnData || []);
        setActivity(activityData || []);
        setTwoFactorEnabled(user.twoFactorEnabled ?? false);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  useEffect(() => {
    const storageKey = "thrifty_recently_viewed";
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRecentlyViewed(parsed as Product[]);
      }
    } catch {
      setRecentlyViewed([]);
    }
  }, []);

  const saveProfile = async () => {
    try {
      setSaving(true);
      const updated = await updateProfile({ name });
      setProfile(updated);
      dispatch(updateProfileAction(updated));
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-lg font-semibold text-gray-900">You are signed out</p>
        <p className="mt-2 text-sm text-gray-600">
          Log in to see your profile, orders, and saved pairs.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Button variant="primary" onClick={() => (window.location.href = "/login")}>
            Log in
          </Button>
          <Button variant="ghost" onClick={() => (window.location.href = "/register")}>
            Create account
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12 space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const statusSteps: Order["status"][] = [
    "processing",
    "paid",
    "shipped",
    "delivered",
  ];
  const isSectionOpen = (section: AccountSection) => activeAccountSection === section;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-[0_18px_70px_rgba(12,22,44,0.12)]">
        <div
          className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-slate-100 via-white to-slate-200"
          style={coverUrl ? { backgroundImage: `url(${coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        />
        <div className="relative z-10 flex flex-col gap-6 pt-14 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 overflow-hidden rounded-full bg-black text-sm font-semibold text-white">
              {avatarUrl ? (
                <img src={avatarUrl} alt={profile?.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center">{initials}</div>
              )}
            </div>
            <div>
              <p className="pill mb-2 inline-block">Account</p>
              <h1 className="text-2xl font-semibold text-gray-900">
                Welcome back, {profile?.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span className="rounded-full border border-black/10 bg-white px-3 py-1">
                  {orders.length} orders
                </span>
                <span className="rounded-full border border-black/10 bg-white px-3 py-1">
                  {formatCurrency(totalSpend)} spent
                </span>
                {lastOrder && (
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1">
                    Last order {new Date(lastOrder.placedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer rounded-full border border-black/10 bg-white px-3 py-2 text-xs text-gray-600 shadow-sm">
              Edit cover
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setUploading(true);
                    const uploaded = await uploadAvatar(file);
                    setCoverUrl(uploaded.url);
                    const updated = await updateProfile({ coverUrl: uploaded.url });
                    setProfile(updated);
                    dispatch(updateProfileAction(updated));
                  } catch (err) {
                    setError(handleApiError(err));
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </label>
            <Button variant="ghost" onClick={() => dispatch(logout())}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Profile completion</p>
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-gray-600">
            {completionPercent}%
          </span>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-black/5">
          <div
            className="h-2 rounded-full bg-black"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Add a photo, address, and preferences to unlock a complete profile.
        </p>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_14px_50px_rgba(12,22,44,0.08)]">
        <p className="px-2 text-xs uppercase tracking-[0.2em] text-gray-500">Account menu</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {accountSections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveAccountSection(section.id)}
              className={cn(
                "rounded-2xl border px-4 py-2 text-left transition",
                isSectionOpen(section.id)
                  ? "border-black bg-black text-white shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
                  : "border-black/10 bg-white text-gray-900 hover:border-black/30",
              )}
              aria-pressed={isSectionOpen(section.id)}
            >
              <p className="text-sm font-semibold">{section.label}</p>
              <p className={cn("text-xs", isSectionOpen(section.id) ? "text-white/80" : "text-gray-500")}>
                {section.hint}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[0.5fr_1fr]">
        <div
          className={cn(
            "self-start rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]",
            isSectionOpen("profile") ? "block" : "hidden",
          )}
        >
          <button
            type="button"
            onClick={() => setActiveAccountSection("profile")}
            className="flex w-full items-center justify-between text-left md:hidden"
          >
            <span className="text-lg font-semibold text-gray-900">Profile</span>
            <span className="text-sm text-gray-500">{isSectionOpen("profile") ? "Open" : "Tap to open"}</span>
          </button>
          <div className={cn("space-y-4", isSectionOpen("profile") ? "block" : "hidden")}>
            <div className="hidden items-center justify-between md:flex">
              <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gray-500">
                Personal
              </span>
            </div>
            <div className="flex items-center gap-4">
            <div className="relative">
              <div className="relative h-16 w-16 overflow-hidden rounded-full bg-black text-xs font-semibold text-white">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={profile?.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center">{initials}</div>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 grid h-6 w-6 cursor-pointer place-items-center rounded-full border border-white bg-black text-xs text-white shadow">
                +
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setUploading(true);
                      const uploaded = await uploadAvatar(file);
                      setAvatarUrl(uploaded.url);
                      const updated = await updateProfile({ avatarUrl: uploaded.url });
                      setProfile(updated);
                      dispatch(updateProfileAction(updated));
                    } catch (err) {
                      setError(handleApiError(err));
                    } finally {
                      setUploading(false);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1 text-sm text-gray-600">
              <p className="text-sm font-medium text-gray-900">Profile photo</p>
              <p className="text-xs text-gray-500">
                {uploading ? "Uploading photo..." : "Tap + to add a PNG/JPG (max 5MB)."}
              </p>
            </div>
          </div>
          {!showProfileForm ? (
            <div className="space-y-2 text-sm text-gray-600">
              <p className="text-sm font-medium text-gray-900">{profile?.name}</p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowProfileForm(true)}>
                  Edit profile
                </Button>
                <Button variant="ghost" onClick={() => (window.location.href = "/wishlist")}>
                  View wishlist
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Email address" value={profile?.email} disabled />
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" onClick={saveProfile} disabled={saving}>
                  Save changes
                </Button>
                <Button variant="ghost" onClick={() => setShowProfileForm(false)}>
                  Cancel
                </Button>
              </div>
            </>
          )}
          </div>
        </div>

        <div
          className={cn(
            "self-start rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]",
            isSectionOpen("orders") ? "block" : "hidden",
          )}
        >
          <button
            type="button"
            onClick={() => setActiveAccountSection("orders")}
            className="flex w-full items-center justify-between text-left md:hidden"
          >
            <span className="text-lg font-semibold text-gray-900">Orders</span>
            <span className="text-sm text-gray-500">{isSectionOpen("orders") ? "Open" : "Tap to open"}</span>
          </button>
          <div className={cn("space-y-4", isSectionOpen("orders") ? "block" : "hidden")}>
            <div className="hidden items-center justify-between md:flex">
              <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
              <span className="pill text-gray-700">{orders.length} placed</span>
            </div>
            {orders.length === 0 ? (
              <p className="text-sm text-gray-600">
                No orders yet. Your history will populate as soon as the backend returns data.
              </p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-2xl border border-black/10 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Order #{order.id}</p>
                      <p className="text-xs text-gray-500">{order.status}</p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-gray-400">
                        {statusSteps.map((step, idx) => {
                          const activeIndex = statusSteps.indexOf(order.status);
                          const isActive = idx <= activeIndex;
                          return (
                            <span
                              key={`${order.id}-${step}`}
                              className={`rounded-full px-2 py-1 ${
                                isActive ? "bg-black text-white" : "bg-black/5 text-gray-400"
                              }`}
                            >
                              {step}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.placedAt).toLocaleDateString()}
                      </p>
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            const trackingLink = buildTrackingUrl(
                              order.courierName,
                              order.trackingNumber,
                              order.trackingUrl,
                            );
                            if (trackingLink) {
                              window.open(trackingLink, "_blank");
                              return;
                            }
                            window.location.href = `/account/orders/${order.id}`;
                          }}
                        >
                          Track order
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={async () => {
                            try {
                              const blob = await downloadInvoice(order.id);
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = `invoice-${order.id}.pdf`;
                              link.click();
                              window.URL.revokeObjectURL(url);
                            } catch (err) {
                              setError(handleApiError(err));
                            }
                          }}
                        >
                          Download invoice
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <div
          className={cn(
            "self-start rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]",
            isSectionOpen("addresses") ? "block" : "hidden",
          )}
        >
          <button
            type="button"
            onClick={() => setActiveAccountSection("addresses")}
            className="flex w-full items-center justify-between text-left md:hidden"
          >
            <span className="text-lg font-semibold text-gray-900">Addresses</span>
            <span className="text-sm text-gray-500">
              {isSectionOpen("addresses") ? "Open" : "Tap to open"}
            </span>
          </button>
          <div className={cn("space-y-4", isSectionOpen("addresses") ? "block" : "hidden")}>
            <h3 className="hidden text-lg font-semibold text-gray-900 md:block">Addresses</h3>
            <div className="space-y-2 text-sm text-gray-600">
            {addresses.length === 0 && <p>No saved addresses yet.</p>}
            {addresses.map((address) => (
              <div
                key={address.id}
                className="rounded-2xl border border-black/10 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">
                    {address.label || "Address"}
                  </p>
                  {address.isDefault && (
                    <span className="rounded-full bg-black/5 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-gray-600">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {address.street}, {address.city}, {address.state} {address.zip}
                </p>
                <p className="text-xs text-gray-500">{address.country} • {address.phone}</p>
                <a
                  className="mt-2 inline-block text-xs text-blue-600 underline"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${address.street}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Google Maps
                </a>
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingAddressId(address.id);
                      setAddressForm({
                        label: address.label,
                        street: address.street,
                        city: address.city,
                        state: address.state,
                        zip: address.zip,
                        country: address.country,
                        phone: address.phone,
                        isDefault: address.isDefault,
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      await deleteAddress(address.id);
                      setAddresses((prev) => prev.filter((item) => item.id !== address.id));
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            </div>
            <div className="space-y-3 pt-2">
              <Input
                label="Label"
                value={addressForm.label}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))}
              />
              <Input
                label="Street"
                value={addressForm.street}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, street: e.target.value }))}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="City"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                />
                <Input
                  label="State"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Zip"
                  value={addressForm.zip}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, zip: e.target.value }))}
                />
                <Input
                  label="Country"
                  value={addressForm.country}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, country: e.target.value }))}
                />
              </div>
              <Input
                label="Phone"
                value={addressForm.phone}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) =>
                    setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))
                  }
                />
                Set as default
              </label>
              <Button
                variant="primary"
                onClick={async () => {
                  try {
                    if (editingAddressId) {
                      await updateAddress(editingAddressId, addressForm);
                      setEditingAddressId(null);
                    } else {
                      await createAddress(addressForm);
                    }
                    const refreshed = await fetchAddresses();
                    setAddresses(refreshed);
                    setAddressForm({
                      label: "",
                      street: "",
                      city: "",
                      state: "",
                      zip: "",
                      country: "",
                      phone: "",
                      isDefault: false,
                    });
                  } catch (err) {
                    setError(handleApiError(err));
                  }
                }}
              >
                {editingAddressId ? "Update address" : "Add address"}
              </Button>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "self-start rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]",
            isSectionOpen("payments") ? "block" : "hidden",
          )}
        >
          <button
            type="button"
            onClick={() => setActiveAccountSection("payments")}
            className="flex w-full items-center justify-between text-left md:hidden"
          >
            <span className="text-lg font-semibold text-gray-900">Payment methods</span>
            <span className="text-sm text-gray-500">{isSectionOpen("payments") ? "Open" : "Tap to open"}</span>
          </button>
          <div className={cn("space-y-4", isSectionOpen("payments") ? "block" : "hidden")}>
            <h3 className="hidden text-lg font-semibold text-gray-900 md:block">Payment methods</h3>
            <div className="space-y-2 text-sm text-gray-600">
            {paymentMethods.length === 0 && <p>No payment methods saved.</p>}
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="rounded-2xl border border-black/10 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{method.label}</p>
                  {method.isDefault && (
                    <span className="rounded-full bg-black/5 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-gray-600">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {method.provider} • {method.maskedNumber}
                </p>
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingPaymentId(method.id);
                      setPaymentForm({
                        provider: method.provider,
                        label: method.label,
                        maskedNumber: method.maskedNumber,
                        isDefault: method.isDefault,
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      await deletePaymentMethod(method.id);
                      setPaymentMethods((prev) => prev.filter((item) => item.id !== method.id));
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            </div>
            <div className="space-y-3 pt-2">
              <label className="flex w-full flex-col gap-2 text-sm text-gray-700">
                <span className="text-sm font-medium text-gray-900">Provider</span>
                <select
                  value={paymentForm.provider}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, provider: e.target.value }))}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 shadow-[0_12px_40px_rgba(12,22,44,0.06)] outline-none"
                >
                  <option value="easypaisa">EasyPaisa</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </label>
              <Input
                label="Label"
                value={paymentForm.label}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, label: e.target.value }))}
              />
              <Input
                label="Masked number"
                placeholder="**** 1234"
                value={paymentForm.maskedNumber}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, maskedNumber: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={paymentForm.isDefault}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, isDefault: e.target.checked }))
                  }
                />
                Set as default
              </label>
              <Button
                variant="primary"
                onClick={async () => {
                  try {
                    if (editingPaymentId) {
                      await updatePaymentMethod(editingPaymentId, paymentForm);
                      setEditingPaymentId(null);
                    } else {
                      await createPaymentMethod(paymentForm);
                    }
                    const refreshed = await fetchPaymentMethods();
                    setPaymentMethods(refreshed);
                    setPaymentForm({
                      provider: "easypaisa",
                      label: "",
                      maskedNumber: "",
                      isDefault: false,
                    });
                  } catch (err) {
                    setError(handleApiError(err));
                  }
                }}
              >
                {editingPaymentId ? "Update method" : "Add method"}
              </Button>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "self-start space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]",
            isSectionOpen("payments") ? "block" : "hidden",
          )}
        >
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          <label className="flex items-center justify-between rounded-2xl border border-black/10 px-4 py-3 text-sm">
            <span>Email updates</span>
            <input
              type="checkbox"
              checked={notifications.emailEnabled}
              onChange={async (e) => {
                const next = { ...notifications, emailEnabled: e.target.checked };
                setNotifications(next);
                try {
                  await updateNotifications(next);
                } catch (err) {
                  setError(handleApiError(err));
                }
              }}
            />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-black/10 px-4 py-3 text-sm">
            <span>SMS updates</span>
            <input
              type="checkbox"
              checked={notifications.smsEnabled}
              onChange={async (e) => {
                const next = { ...notifications, smsEnabled: e.target.checked };
                setNotifications(next);
                try {
                  await updateNotifications(next);
                } catch (err) {
                  setError(handleApiError(err));
                }
              }}
            />
          </label>
          <Input
            label="SMS phone"
            placeholder="+92..."
            value={notifications.phone || ""}
            onChange={(e) => setNotifications((prev) => ({ ...prev, phone: e.target.value }))}
          />
          <Button
            variant="ghost"
            onClick={async () => {
              try {
                const updated = await updateNotifications(notifications);
                setNotifications(updated);
              } catch (err) {
                setError(handleApiError(err));
              }
            }}
          >
            Save preferences
          </Button>
        </div>
      </div>

      <div className={cn("gap-6 lg:grid-cols-2 items-start", isSectionOpen("profile") ? "grid" : "hidden")}>
        <div className="self-start space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
          <h3 className="text-lg font-semibold text-gray-900">Preferences</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Size (US)"
              value={preferences.sizeUS}
              onChange={(e) => setPreferences((prev) => ({ ...prev, sizeUS: e.target.value }))}
            />
            <Input
              label="Size (EU)"
              value={preferences.sizeEU}
              onChange={(e) => setPreferences((prev) => ({ ...prev, sizeEU: e.target.value }))}
            />
          </div>
          <Input
            label="Favorite brands"
            placeholder="Nike, Adidas, Puma"
            value={preferences.brandsText}
            onChange={(e) =>
              setPreferences((prev) => ({ ...prev, brandsText: e.target.value }))
            }
          />
          <Button
            variant="primary"
            onClick={async () => {
              try {
                const brands = preferences.brandsText
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean);
                const updated = await updatePreferences({
                  sizeUS: preferences.sizeUS || undefined,
                  sizeEU: preferences.sizeEU || undefined,
                  brands,
                });
                setPreferences({
                  sizeUS: updated.sizeUS ?? "",
                  sizeEU: updated.sizeEU ?? "",
                  brandsText: Array.isArray(updated.brands) ? updated.brands.join(", ") : "",
                });
              } catch (err) {
                setError(handleApiError(err));
              }
            }}
          >
            Save preferences
          </Button>
        </div>

        <div className="self-start space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
          <h3 className="text-lg font-semibold text-gray-900">Support tickets</h3>
          <div className="space-y-2 text-sm text-gray-600">
            {tickets.length === 0 && <p>No tickets yet.</p>}
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-2xl border border-black/10 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{ticket.subject}</p>
                  <span className="rounded-full bg-black/5 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-gray-600">
                    {ticket.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{ticket.message}</p>
              </div>
            ))}
          </div>
          <Input
            label="Subject"
            value={ticketForm.subject}
            onChange={(e) => setTicketForm((prev) => ({ ...prev, subject: e.target.value }))}
          />
          <label className="flex w-full flex-col gap-2 text-sm text-gray-700">
            <span className="text-sm font-medium text-gray-900">Message</span>
            <textarea
              className="min-h-[90px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 shadow-[0_12px_40px_rgba(12,22,44,0.06)] outline-none"
              value={ticketForm.message}
              onChange={(e) => setTicketForm((prev) => ({ ...prev, message: e.target.value }))}
            />
          </label>
          <Button
            variant="primary"
            onClick={async () => {
              try {
                const created = await createTicket(ticketForm);
                setTickets((prev) => [created, ...prev]);
                setTicketForm({ subject: "", message: "" });
              } catch (err) {
                setError(handleApiError(err));
              }
            }}
          >
            Create ticket
          </Button>
        </div>
      </div>

      <div className={cn("gap-6 lg:grid-cols-2 items-start", isSectionOpen("orders") ? "grid" : "hidden")}>
        <div className="self-start space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
          <h3 className="text-lg font-semibold text-gray-900">Returns & refunds</h3>
          <div className="space-y-2 text-sm text-gray-600">
            {returns.length === 0 && <p>No return requests yet.</p>}
            {returns.map((item) => (
              <div key={item.id} className="rounded-2xl border border-black/10 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">Order {item.orderId}</p>
                  <span className="rounded-full bg-black/5 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-gray-600">
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{item.reason}</p>
              </div>
            ))}
          </div>
          <Input
            label="Order ID"
            value={returnForm.orderId}
            onChange={(e) => setReturnForm((prev) => ({ ...prev, orderId: e.target.value }))}
          />
          <label className="flex w-full flex-col gap-2 text-sm text-gray-700">
            <span className="text-sm font-medium text-gray-900">Reason</span>
            <textarea
              className="min-h-[90px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 shadow-[0_12px_40px_rgba(12,22,44,0.06)] outline-none"
              value={returnForm.reason}
              onChange={(e) => setReturnForm((prev) => ({ ...prev, reason: e.target.value }))}
            />
          </label>
          <Button
            variant="primary"
            onClick={async () => {
              try {
                const created = await createReturn(returnForm);
                setReturns((prev) => [created, ...prev]);
                setReturnForm({ orderId: "", reason: "" });
              } catch (err) {
                setError(handleApiError(err));
              }
            }}
          >
            Request return
          </Button>
        </div>

        <div className="self-start space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
          <h3 className="text-lg font-semibold text-gray-900">Activity timeline</h3>
          <div className="space-y-3 text-sm text-gray-600">
            {activity.length === 0 && <p>No activity yet.</p>}
            {activity.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-black" />
                <div>
                  <p className="font-semibold text-gray-900">{item.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div
          className={cn(
            "rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]",
            isSectionOpen("security") ? "block" : "hidden",
          )}
        >
          <button
            type="button"
            onClick={() => setActiveAccountSection("security")}
            className="flex w-full items-center justify-between text-left md:hidden"
          >
            <span className="text-lg font-semibold text-gray-900">Security</span>
            <span className="text-sm text-gray-500">{isSectionOpen("security") ? "Open" : "Tap to open"}</span>
          </button>
          <div className={cn("space-y-4", isSectionOpen("security") ? "block" : "hidden")}>
            <h3 className="hidden text-lg font-semibold text-gray-900 md:block">Security</h3>
            <div className="rounded-2xl border border-black/10 px-4 py-3 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <p>Email 2FA</p>
              <span className="rounded-full bg-black/5 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-gray-600">
                {twoFactorEnabled ? "Enabled" : "Off"}
              </span>
            </div>
            {!twoFactorEnabled ? (
              <div className="mt-2 space-y-2">
                <Button
                  variant="ghost"
                  onClick={async () => {
                    try {
                      setTwoFactorStatus({ loading: true });
                      await requestTwoFactor();
                      setTwoFactorStatus({ loading: false });
                    } catch (err) {
                      setTwoFactorStatus({ loading: false, error: handleApiError(err) });
                    }
                  }}
                >
                  Send code to email
                </Button>
                <Input
                  label="Enter 6-digit code"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                />
                <Button
                  variant="primary"
                  onClick={async () => {
                    try {
                      setTwoFactorStatus({ loading: true });
                      await verifyTwoFactor(twoFactorCode);
                      setTwoFactorEnabled(true);
                      setTwoFactorCode("");
                      setTwoFactorStatus({ loading: false });
                    } catch (err) {
                      setTwoFactorStatus({ loading: false, error: handleApiError(err) });
                    }
                  }}
                  disabled={twoFactorStatus.loading}
                >
                  Verify & enable
                </Button>
              </div>
            ) : (
              <div className="mt-2">
                <Button
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await disableTwoFactor();
                      setTwoFactorEnabled(false);
                    } catch (err) {
                      setError(handleApiError(err));
                    }
                  }}
                >
                  Disable 2FA
                </Button>
              </div>
            )}
            {twoFactorStatus.error && (
              <p className="mt-2 text-xs text-rose-500">{twoFactorStatus.error}</p>
            )}
          </div>
            {!showPasswordForm ? (
              <div className="space-y-3 text-sm text-gray-600">
                <p>Update your password when needed.</p>
                <Button variant="ghost" onClick={() => setShowPasswordForm(true)}>
                  Change password
                </Button>
              </div>
            ) : (
              <>
                <Input
                  label="Current password"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                />
                <Input
                  label="New password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                />
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="primary"
                    onClick={async () => {
                      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                        setError("New password and confirmation must match.");
                        return;
                      }
                      try {
                        await changePassword({
                          currentPassword: passwordForm.currentPassword,
                          newPassword: passwordForm.newPassword,
                        });
                        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                        setShowPasswordForm(false);
                      } catch (err) {
                        setError(handleApiError(err));
                      }
                    }}
                  >
                    Update password
                  </Button>
                  <Button variant="ghost" onClick={() => setShowPasswordForm(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        <div
          className={cn(
            "space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_60px_rgba(12,22,44,0.08)]",
            isSectionOpen("profile") ? "block" : "hidden",
          )}
        >
          <h3 className="text-lg font-semibold text-gray-900">Recently viewed</h3>
          {recentlyViewed.length ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {recentlyViewed.slice(0, 6).map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => (window.location.href = `/product/${product.slug}`)}
                  className="min-w-[180px] rounded-2xl border border-black/10 bg-white p-3 text-left shadow-[0_12px_40px_rgba(12,22,44,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(12,22,44,0.08)]"
                >
                  <div className="relative h-36 overflow-hidden rounded-2xl bg-gray-50">
                    {product.images?.[0]?.url ? (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xs text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-gray-900 line-clamp-2">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500">{formatCurrency(product.price)}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No recent products yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
