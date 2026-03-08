import { Order } from "./types";

export const statusLabels: Record<Order["status"], string> = {
  processing: "Processing",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const getOrderDisplayCode = (order: Pick<Order, "id" | "code">) =>
  order.code || order.id.slice(-12).toUpperCase();

export const getOrderSteps = (order: Pick<Order, "status" | "paymentMethod">): Order["status"][] => {
  if (order.paymentMethod === "cod" && order.status !== "paid") {
    return ["processing", "shipped", "delivered"];
  }

  return ["processing", "paid", "shipped", "delivered"];
};

export const getOrderPaymentLabel = (
  order: Pick<Order, "status" | "paymentMethod">,
) => {
  if (order.paymentMethod === "cod") {
    return order.status === "delivered" ? "Collected on delivery" : "Cash on delivery";
  }

  if (order.status === "paid" || order.status === "shipped" || order.status === "delivered") {
    return "Paid";
  }

  return "Payment pending";
};
