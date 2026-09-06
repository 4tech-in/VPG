export function getMaterialPending(order: {
  totalCount?: number | string | null;
  totalQuantity?: number | string | null;
  materialUsed?: number | string | null;
}): number | undefined {
  const total = order.totalCount ?? order.totalQuantity;
  if (total == null || order.materialUsed == null) return undefined;
  const totalNumber = Number(total);
  const usedNumber = Number(order.materialUsed);
  if (!Number.isFinite(totalNumber) || !Number.isFinite(usedNumber)) return undefined;
  return totalNumber - usedNumber;
}
