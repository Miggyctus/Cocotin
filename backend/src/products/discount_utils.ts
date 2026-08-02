import { Decimal } from "@prisma/client/runtime/library";

interface DiscountableProduct {
  discountPercent: number | null;
  discountStartDate: Date | null;
  discountEndDate: Date | null;
}

export function isDiscountActive(product: DiscountableProduct): boolean {
  if (product.discountPercent == null) return false;
  const now = new Date();
  if (product.discountStartDate && now < product.discountStartDate) return false;
  if (product.discountEndDate && now > product.discountEndDate) return false;
  return true;
}

export function computeDiscountedPrice(
  price: Decimal | number,
  discountPercent: number
): number {
  const numericPrice = typeof price === "number" ? price : Number(price);
  return Math.round(numericPrice * (1 - discountPercent / 100));
}
