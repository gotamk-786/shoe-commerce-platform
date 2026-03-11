"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Skeleton from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import {
  getOrderDisplayCode,
  getOrderPaymentLabel,
  getOrderSteps,
  statusLabels,
} from "@/lib/order-display";
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
  changePassword,
  downloadInvoice,
  fetchReturns,
  createReturn,
  fetchActivity,
  requestTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
} from "@/lib/api";
import {
  Address,
  Order,
  Product,
  UserProfile,
} from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout, updateProfile as updateProfileAction } from "@/store/slices/user-slice";
import { cn } from "@/lib/utils";

type AccountSection = "profile" | "orders" | "addresses" | "security";

const accountSections: { id: AccountSection; label: string; hint: string }[] = [
  { id: "profile", label: "Profile", hint: "Personal info" },
  { id: "orders", label: "Orders", hint: "Orders & returns" },
  { id: "addresses", label: "Addresses", hint: "Shipping places" },
  { id: "security", label: "Security", hint: "Password & 2FA" },
];

const CHECKOUT_ADDRESS_CACHE_KEY = "thrifty_checkout_addresses";

const writeCheckoutAddressCache = (addresses: Address[]) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CHECKOUT_ADDRESS_CACHE_KEY, JSON.stringify(addresses));
  } catch {
    // ignore cache write failures
  }
};

export default function AccountPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.user.token);
  const persistedProfile = useAppSelector((state) => state.user.profile);
  const [profile, setProfile] = useState<UserProfile | null>(persistedProfile);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(!persistedProfile);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(persistedProfile?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(persistedProfile?.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverUrl, setCoverUrl] = useState(persistedProfile?.coverUrl ?? "");
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
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
  const [addressStatus, setAddressStatus] = useState<{
    saving: boolean;
    deletingId?: string;
  }>({
    saving: false,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
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
  const [sectionLoaded, setSectionLoaded] = useState({
    addresses: false,
    ordersExtras: false,
  });
  const totalSpend = orders.reduce((sum, order) => sum + order.total, 0);
  const lastOrder = orders[0];
  const completionScore = [
    Boolean(profile?.name),
    Boolean(profile?.email),
    Boolean(avatarUrl),
    Boolean(coverUrl),
    addresses.length > 0,
    twoFactorEnabled,
  ].filter(Boolean).length;
  const completionPercent = Math.round((completionScore / 6) * 100);
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
      setOrdersLoading(false);
      return;
    }

    let active = true;

    const loadProfile = async () => {
      try {
        const user = await fetchProfile();
        if (!active) return;
        setProfile(user);
        setName(user.name);
        setAvatarUrl(user.avatarUrl ?? "");
        setCoverUrl(user.coverUrl ?? "");
        setTwoFactorEnabled(user.twoFactorEnabled ?? false);
      } catch (err) {
        if (!active) return;
        setError(handleApiError(err));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const loadOrders = async () => {
      try {
        const data = await fetchOrders();
        if (!active) return;
        setOrders(data || []);
      } catch (err) {
        if (!active) return;
        setError(handleApiError(err));
      } finally {
        if (active) {
          setOrdersLoading(false);
        }
      }
    };

    void loadProfile();
    void loadOrders();

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let active = true;

    const loadSection = async () => {
      try {
        if (activeAccountSection === "addresses" && !sectionLoaded.addresses) {
          const addressData = await fetchAddresses();
          if (!active) return;
          setAddresses(addressData || []);
          writeCheckoutAddressCache(addressData || []);
          setSectionLoaded((prev) => ({ ...prev, addresses: true }));
        }

        if (activeAccountSection === "orders" && !sectionLoaded.ordersExtras) {
          const [returnData, activityData] = await Promise.all([
            fetchReturns(),
            fetchActivity(),
          ]);
          if (!active) return;
          setReturns(returnData || []);
          setActivity(activityData || []);
          setSectionLoaded((prev) => ({ ...prev, ordersExtras: true }));
        }
      } catch (err) {
        if (active) {
          setError(handleApiError(err));
        }
      }
    };

    void loadSection();

    return () => {
      active = false;
    };
  }, [
    activeAccountSection,
    sectionLoaded.addresses,
    sectionLoaded.ordersExtras,
    token,
  ]);

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

  const resetAddressForm = () => {
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
    setEditingAddressId(null);
  };

  const handleAddressSave = async () => {
    if (addressStatus.saving) {
      return;
    }

    try {
      setAddressStatus({ saving: true });

      if (editingAddressId) {
        await updateAddress(editingAddressId, addressForm);
      } else {
        await createAddress(addressForm);
      }

      const refreshed = await fetchAddresses();
      setAddresses(refreshed);
      writeCheckoutAddressCache(refreshed);
      resetAddressForm();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setAddressStatus({ saving: false });
    }
  };

  const handleAddressDelete = async (addressId: string) => {
    if (addressStatus.deletingId || addressStatus.saving) {
      return;
    }

    try {
      setAddressStatus({ saving: false, deletingId: addressId });
      await deleteAddress(addressId);
      setAddresses((prev) => {
        const next = prev.filter((item) => item.id !== addressId);
        writeCheckoutAddressCache(next);
        return next;
      });
      if (editingAddressId === addressId) {
        resetAddressForm();
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setAddressStatus({ saving: false });
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
          <Button variant="primary" onClick={() => router.push("/login")}>
            Log in
          </Button>
          <Button variant="ghost" onClick={() => router.push("/register")}>
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
                  {ordersLoading ? "Loading orders..." : `${orders.length} orders`}
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
          Add a photo, address, and secure login to complete your profile.
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

      <div className="grid items-start gap-6">
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
          <div className={cn("space-y-6", isSectionOpen("profile") ? "block" : "hidden")}>
            <div className="hidden items-center justify-between md:flex">
              <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gray-500">
                Personal
              </span>
            </div>
            <div className="flex flex-col gap-5 rounded-2xl border border-black/10 bg-slate-50/60 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full bg-black text-sm font-semibold text-white">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={profile?.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center">{initials}</div>
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 grid h-7 w-7 cursor-pointer place-items-center rounded-full border border-white bg-black text-sm text-white shadow">
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
                <div className="text-sm text-gray-600">
                  <p className="text-lg font-semibold text-gray-900">{profile?.name}</p>
                  <p>{profile?.email}</p>
                  <p className="text-xs text-gray-500">
                    {uploading ? "Uploading photo..." : "Tap + to add a PNG/JPG (max 5MB)."}
                  </p>
                </div>
              </div>
              {!showProfileForm && (
                <div className="flex flex-wrap gap-3">
                  <Button variant="ghost" onClick={() => setShowProfileForm(true)}>
                    Edit profile
                  </Button>
                  <Button variant="ghost" onClick={() => router.push("/wishlist")}>
                    View wishlist
                  </Button>
                </div>
              )}
            </div>

            {showProfileForm && (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                  <Input label="Email address" value={profile?.email} disabled />
                </div>
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
                    className="flex flex-col gap-4 rounded-2xl border border-black/10 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        Order #{getOrderDisplayCode(order)}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-medium text-gray-700">
                          {getOrderPaymentLabel(order)}
                        </span>
                        <span className="text-xs text-gray-500">{statusLabels[order.status]}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.2em] text-gray-400">
                        {getOrderSteps(order).map((step, idx) => {
                          const activeIndex = getOrderSteps(order).indexOf(order.status);
                          const isActive = idx <= activeIndex;
                          return (
                            <span
                              key={`${order.id}-${step}`}
                              className={`rounded-full px-2 py-1 ${
                                isActive ? "bg-black text-white" : "bg-black/5 text-gray-400"
                              }`}
                            >
                              {statusLabels[step]}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
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
                            router.push(`/account/orders/${order.id}`);
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
                              link.download = `invoice-${order.code || order.id}.pdf`;
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
                      if (addressStatus.saving || addressStatus.deletingId) {
                        return;
                      }
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
                    disabled={addressStatus.saving || Boolean(addressStatus.deletingId)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => void handleAddressDelete(address.id)}
                    disabled={addressStatus.saving || Boolean(addressStatus.deletingId)}
                  >
                    {addressStatus.deletingId === address.id ? "Deleting..." : "Delete"}
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
                onClick={() => void handleAddressSave()}
                disabled={addressStatus.saving || Boolean(addressStatus.deletingId)}
              >
                {addressStatus.saving
                  ? editingAddressId
                    ? "Updating..."
                    : "Adding..."
                  : editingAddressId
                    ? "Update address"
                    : "Add address"}
              </Button>
              {editingAddressId && (
                <Button
                  variant="ghost"
                  onClick={resetAddressForm}
                  disabled={addressStatus.saving || Boolean(addressStatus.deletingId)}
                >
                  Cancel edit
                </Button>
              )}
            </div>
          </div>
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
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {recentlyViewed.slice(0, 4).map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => router.push(`/product/${product.slug}`)}
                  className="rounded-2xl border border-black/10 bg-white p-3 text-left shadow-[0_12px_40px_rgba(12,22,44,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(12,22,44,0.08)]"
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
