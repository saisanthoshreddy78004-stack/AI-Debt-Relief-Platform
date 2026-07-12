export const inr = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN");

export const inrCompact = (n: number) => {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)} K`;
  return `₹${n}`;
};
