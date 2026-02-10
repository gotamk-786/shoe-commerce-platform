"use client";

import { useEffect, useState } from "react";
import TableShell from "@/components/admin/widgets/table-shell";
import SectionHeading from "@/components/ui/section-heading";
import Button from "@/components/ui/button";
import { adminFetchCustomers, adminUpdateCustomerStatus, handleApiError } from "@/lib/api";
import { AdminCustomer } from "@/lib/types";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [status, setStatus] = useState<{ loading: boolean; error?: string }>({ loading: true });

  useEffect(() => {
    adminFetchCustomers()
      .then((data) => {
        setCustomers(data);
        setStatus({ loading: false });
      })
      .catch((error) => {
        setStatus({ loading: false, error: handleApiError(error) });
      });
  }, []);

  const toggleBlock = async (customer: AdminCustomer) => {
    try {
      await adminUpdateCustomerStatus(customer.id, !customer.isBlocked);
      setCustomers((prev) =>
        prev.map((item) =>
          item.id === customer.id ? { ...item, isBlocked: !item.isBlocked } : item,
        ),
      );
    } catch (error) {
      setStatus({ loading: false, error: handleApiError(error) });
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        tone="dark"
        eyebrow="Customers"
        title="Customer directory"
        description="View shoppers, their orders, and manage access."
      />

      {status.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {status.error}
        </div>
      )}

      <TableShell title="Customers" headers={["Name", "Email", "Orders", "Status", "Action"]}>
        {customers.map((customer) => (
          <tr key={customer.id} className="text-sm text-white/80">
            <td className="py-3">{customer.name}</td>
            <td>{customer.email}</td>
            <td>{customer.orders}</td>
            <td>
              <span
                className={`rounded-full px-2 py-1 text-xs ${
                  customer.isBlocked ? "bg-red-500/20 text-red-200" : "bg-green-500/20 text-green-200"
                }`}
              >
                {customer.isBlocked ? "Blocked" : "Active"}
              </span>
            </td>
            <td>
              <Button variant="ghost" className="text-xs" onClick={() => toggleBlock(customer)}>
                {customer.isBlocked ? "Unblock" : "Block"}
              </Button>
            </td>
          </tr>
        ))}
        {!customers.length && !status.loading && (
          <tr className="text-sm text-white/60">
            <td className="py-3" colSpan={5}>
              No customers yet.
            </td>
          </tr>
        )}
      </TableShell>
    </div>
  );
}

