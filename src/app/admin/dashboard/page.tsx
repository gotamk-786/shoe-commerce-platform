"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import SectionHeading from "@/components/ui/section-heading";
import Card from "@/components/admin/widgets/card";
import TableShell from "@/components/admin/widgets/table-shell";
import {
  adminFetchOrders,
  adminFetchLowStock,
  adminFetchProfitOrders,
  adminFetchProfitSummary,
  fetchOrderStats,
  handleApiError,
} from "@/lib/api";
import { AdminOrder, ProfitOrderItem, ProfitSummaryBucket } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

const formatPeriodLabel = (period: unknown) => {
  if (typeof period !== "string") return "N/A";
  if (period.includes("W")) return period.replace("-", " ");
  if (period.length >= 10) return period.slice(5);
  return period;
};

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const sanitizeOrder = (order: unknown): AdminOrder | null => {
  if (!order || typeof order !== "object") return null;
  const data = order as Record<string, unknown>;
  if (typeof data.id !== "string") return null;
  const customerData =
    data.customer && typeof data.customer === "object"
      ? (data.customer as Record<string, unknown>)
      : {};
  return {
    id: data.id,
    status:
      typeof data.status === "string"
        ? (data.status as AdminOrder["status"])
        : "processing",
    total: typeof data.total === "number" ? data.total : 0,
    placedAt: typeof data.placedAt === "string" ? data.placedAt : new Date().toISOString(),
    customer: {
      name: typeof customerData.name === "string" ? customerData.name : "Unknown customer",
      email: typeof customerData.email === "string" ? customerData.email : "-",
    },
  };
};

export default function AdminDashboardPage() {
  const [profitItems, setProfitItems] = useState<ProfitOrderItem[]>([]);
  const [profitSummary, setProfitSummary] = useState<ProfitSummaryBucket[]>([]);
  const [profitStatus, setProfitStatus] = useState({ loading: true, error: "" });
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pending: 0,
    delivered: 0,
  });
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [lowStock, setLowStock] = useState<{
    variantSizes: {
      id: string;
      stock: number;
      sizeUS?: string;
      sizeEU?: string;
      color: string;
      productId: string;
      productName: string;
    }[];
    products: { id: string; stock: number; name: string }[];
  }>({ variantSizes: [], products: [] });
  const [lowStockStatus, setLowStockStatus] = useState({ loading: true, error: "" });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        // Keep requests sequential to avoid saturating low connection-limit pools.
        const items = await adminFetchProfitOrders();
        const summary = await adminFetchProfitSummary({ period: "daily" });
        const stats = await fetchOrderStats();
        const orders = await adminFetchOrders();
        if (!active) return;

        const safeProfitItems = asArray<ProfitOrderItem>(items);
        const safeProfitSummary = asArray<ProfitSummaryBucket>(
          summary && typeof summary === "object" ? (summary as { data?: unknown }).data : [],
        );
        const safeOrders = asArray<unknown>(orders)
          .map(sanitizeOrder)
          .filter((value): value is AdminOrder => Boolean(value));

        setProfitItems(safeProfitItems);
        setProfitSummary(safeProfitSummary);
        setOrderStats({
          totalOrders:
            stats && typeof stats === "object" && typeof (stats as { totalOrders?: unknown }).totalOrders === "number"
              ? ((stats as { totalOrders: number }).totalOrders)
              : 0,
          totalRevenue:
            stats && typeof stats === "object" && typeof (stats as { totalRevenue?: unknown }).totalRevenue === "number"
              ? ((stats as { totalRevenue: number }).totalRevenue)
              : 0,
          pending:
            stats && typeof stats === "object" && typeof (stats as { pending?: unknown }).pending === "number"
              ? ((stats as { pending: number }).pending)
              : 0,
          delivered:
            stats && typeof stats === "object" && typeof (stats as { delivered?: unknown }).delivered === "number"
              ? ((stats as { delivered: number }).delivered)
              : 0,
        });
        setRecentOrders(safeOrders.slice(0, 5));
        setProfitStatus({ loading: false, error: "" });
      } catch (error) {
        if (!active) return;
        setProfitStatus({ loading: false, error: handleApiError(error) });
      }

      try {
        const data = await adminFetchLowStock();
        if (!active) return;
        const payload = data as { variantSizes?: unknown; products?: unknown } | undefined;
        setLowStock({
          variantSizes: asArray<{
            id: string;
            stock: number;
            sizeUS?: string;
            sizeEU?: string;
            color: string;
            productId: string;
            productName: string;
          }>(payload?.variantSizes),
          products: asArray<{ id: string; stock: number; name: string }>(payload?.products),
        });
        setLowStockStatus({ loading: false, error: "" });
      } catch (error) {
        if (!active) return;
        setLowStockStatus({ loading: false, error: handleApiError(error) });
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const profitTotals = useMemo(() => {
    const totals = profitSummary.reduce(
      (acc, bucket) => {
        acc.revenue += bucket.revenue;
        acc.cost += bucket.cost;
        acc.profit += bucket.profit;
        return acc;
      },
      { revenue: 0, cost: 0, profit: 0 },
    );
    return totals;
  }, [profitSummary]);

  const chartData = useMemo(
    () =>
      profitSummary.map((bucket) => ({
        name: formatPeriodLabel(bucket.period),
        sales: bucket.revenue,
      })),
    [profitSummary],
  );

  return (
    <div className="space-y-6">
      <SectionHeading tone="dark"
        eyebrow="Overview"
        title="Dashboard"
        description="Live snapshot of sales, orders, and returns."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Total sales"
          value={formatCurrency(orderStats.totalRevenue)}
          helper="Revenue (all time)"
          tone="emerald"
        />
        <Card
          title="Orders"
          value={`${orderStats.totalOrders}`}
          helper={`${orderStats.pending} pending`}
          tone="blue"
        />
        <Card
          title="Deliveries"
          value={`${orderStats.delivered}`}
          helper="Delivered"
          tone="indigo"
        />
        <Card
          title="Profit (30d)"
          value={formatCurrency(profitTotals.profit)}
          helper="Server-calculated"
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Sales this week</p>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">Daily</span>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#9fb4ff" />
                <YAxis stroke="#9fb4ff" />
                <Tooltip
                  contentStyle={{ background: "#0b1224", border: "1px solid #1f2a44", color: "#fff" }}
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                />
                <Bar dataKey="sales" fill="#60a5fa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <TableShell title="Latest orders" headers={["Order", "Customer", "Total", "Status"]}>
          {recentOrders.map((order) => (
            <tr key={order.id} className="text-sm text-white/80">
              <td className="py-3">{order.id}</td>
              <td>{order.customer.name}</td>
              <td>{formatCurrency(order.total)}</td>
              <td>
                <span className="rounded-full bg-white/10 px-2 py-1 text-xs">
                  {order.status}
                </span>
              </td>
            </tr>
          ))}
          {!recentOrders.length && (
            <tr className="text-sm text-white/60">
              <td className="py-3" colSpan={4}>
                {profitStatus.loading ? "Loading orders..." : "No recent orders yet."}
              </td>
            </tr>
          )}
        </TableShell>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <TableShell title="Profit summary (daily)" headers={["Period", "Revenue", "Cost", "Profit"]}>
          {profitSummary.map((bucket) => (
            <tr key={bucket.period} className="text-sm text-white/80">
              <td className="py-3">{bucket.period}</td>
              <td>{formatCurrency(bucket.revenue)}</td>
              <td>{formatCurrency(bucket.cost)}</td>
              <td className={bucket.profit >= 0 ? "text-emerald-300" : "text-rose-300"}>
                {formatCurrency(bucket.profit)}
              </td>
            </tr>
          ))}
          {!profitSummary.length && (
            <tr className="text-sm text-white/60">
              <td className="py-3" colSpan={4}>
                {profitStatus.loading ? "Loading profit summary..." : "No profit data yet."}
              </td>
            </tr>
          )}
        </TableShell>

        <TableShell
          title="Profit by order item"
          headers={["Order", "Product", "Qty", "Sold", "Cost", "Profit"]}
        >
          {profitItems.map((item) => (
            <tr key={item.id} className="text-sm text-white/80">
              <td className="py-3">{item.orderId}</td>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>{formatCurrency(item.soldPrice)}</td>
              <td>{formatCurrency(item.costPriceAtSale)}</td>
              <td className={item.profitTotal >= 0 ? "text-emerald-300" : "text-rose-300"}>
                {formatCurrency(item.profitTotal)}
              </td>
            </tr>
          ))}
          {!profitItems.length && (
            <tr className="text-sm text-white/60">
              <td className="py-3" colSpan={6}>
                {profitStatus.loading ? "Loading profit items..." : "No profit items yet."}
              </td>
            </tr>
          )}
        </TableShell>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <TableShell
          title="Low stock by size"
          headers={["Product", "Color", "Size", "Stock"]}
        >
          {lowStock.variantSizes.map((row) => (
            <tr key={row.id} className="text-sm text-white/80">
              <td className="py-3">{row.productName}</td>
              <td>{row.color}</td>
              <td>{row.sizeUS ? `US ${row.sizeUS}` : row.sizeEU ? `EU ${row.sizeEU}` : "-"}</td>
              <td className="text-rose-300">{row.stock}</td>
            </tr>
          ))}
          {!lowStock.variantSizes.length && (
            <tr className="text-sm text-white/60">
              <td className="py-3" colSpan={4}>
                {lowStockStatus.loading ? "Loading low stock..." : "No low stock sizes."}
              </td>
            </tr>
          )}
        </TableShell>

        <TableShell title="Low stock products" headers={["Product", "Stock"]}>
          {lowStock.products.map((row) => (
            <tr key={row.id} className="text-sm text-white/80">
              <td className="py-3">{row.name}</td>
              <td className="text-rose-300">{row.stock}</td>
            </tr>
          ))}
          {!lowStock.products.length && (
            <tr className="text-sm text-white/60">
              <td className="py-3" colSpan={2}>
                {lowStockStatus.loading ? "Loading low stock..." : "No low stock products."}
              </td>
            </tr>
          )}
        </TableShell>
      </div>

      {profitStatus.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {profitStatus.error}
        </div>
      )}
      {lowStockStatus.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {lowStockStatus.error}
        </div>
      )}
    </div>
  );
}

