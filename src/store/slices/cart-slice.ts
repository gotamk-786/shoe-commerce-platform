import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CartItem, Product, ProductVariant, VariantSize } from "@/lib/types";
import { discountPrice } from "@/lib/format";

type CartState = {
  items: CartItem[];
};

const initialState: CartState = {
  items: [],
};

const buildLineId = (productId: string, variantId?: string, sizeId?: string) =>
  `${productId}-${variantId || "base"}-${sizeId || "any"}`;

const mapProductToItem = (
  product: Product,
  variant?: ProductVariant,
  size?: VariantSize,
): CartItem => ({
  id: buildLineId(product.id, variant?.id, size?.id),
  productId: product.id,
  variantId: variant?.id,
  slug: product.slug,
  name: product.name,
  price: discountPrice(variant?.priceOverride ?? product.price, product.discount),
  discount: product.discount,
  sizeUS: size?.sizeUS,
  sizeEU: size?.sizeEU,
  color: variant?.color,
  quantity: 1,
  image: variant?.images?.[0]?.url || product.images?.[0]?.url,
  stock: size?.stock ?? product.stock,
});

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    hydrateCart: (_state, action: PayloadAction<CartState>) => action.payload,
    addItem: (
      state,
      action: PayloadAction<{
        product: Product;
        variant?: ProductVariant;
        size?: VariantSize;
      }>,
    ) => {
      const lineId = buildLineId(
        action.payload.product.id,
        action.payload.variant?.id,
        action.payload.size?.id,
      );
      const existing = state.items.find((item) => item.id === lineId);
      if (existing) {
        existing.quantity = Math.min(
          (existing.quantity ?? 1) + 1,
          existing.stock ?? existing.quantity + 1,
        );
      } else {
        state.items.push(
          mapProductToItem(action.payload.product, action.payload.variant, action.payload.size),
        );
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number }>,
    ) => {
      const line = state.items.find((item) => item.id === action.payload.id);
      if (line) {
        line.quantity = Math.max(1, Math.min(action.payload.quantity, line.stock ?? 99));
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart, hydrateCart } =
  cartSlice.actions;
export default cartSlice.reducer;
