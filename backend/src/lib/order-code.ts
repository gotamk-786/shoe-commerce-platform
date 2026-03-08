const hashString = (input: string) => {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 1_000_000;
  }
  return Math.abs(hash);
};

export const buildOrderCode = (orderId: string, placedAt: Date) => {
  const timePart = `${placedAt.getTime()}`.slice(-6).padStart(6, "0");
  const hashPart = `${hashString(orderId)}`.padStart(6, "0").slice(0, 6);
  return `${timePart}${hashPart}`;
};
