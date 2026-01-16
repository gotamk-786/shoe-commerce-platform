export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
  }).format(value);

export const discountPrice = (price: number, discount?: number) => {
  if (!discount || discount <= 0) return price;
  const final = price - price * (discount / 100);
  return Math.max(final, 0);
};
