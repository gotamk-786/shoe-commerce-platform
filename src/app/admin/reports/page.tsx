"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import SectionHeading from "@/components/ui/section-heading";
import Card from "@/components/admin/widgets/card";
import Button from "@/components/ui/button";

const revenue = [
  { month: "Jan", value: 32000 },
  { month: "Feb", value: 28000 },
  { month: "Mar", value: 45000 },
  { month: "Apr", value: 38000 },
  { month: "May", value: 52000 },
  { month: "Jun", value: 61000 },
];

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <SectionHeading tone="dark"
        eyebrow="Reports"
        title="Performance"
        description="Revenue trends and product performance."
        action={<Button variant="ghost">Download report</Button>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Revenue (MTD)" value="$61,000" helper="+8% vs last month" tone="emerald" />
        <Card title="Top product" value="Luxe Court Leather" helper="18% of sales" tone="indigo" />
        <Card title="Conversion" value="3.1%" helper="+0.4% vs last week" tone="amber" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Revenue (monthly)</p>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">USD</span>
        </div>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenue}>
              <XAxis dataKey="month" stroke="#9fb4ff" />
              <YAxis stroke="#9fb4ff" />
              <Tooltip
                contentStyle={{ background: "#0b1224", border: "1px solid #1f2a44", color: "#fff" }}
                cursor={{ stroke: "#60a5fa" }}
              />
              <Line type="monotone" dataKey="value" stroke="#60a5fa" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

