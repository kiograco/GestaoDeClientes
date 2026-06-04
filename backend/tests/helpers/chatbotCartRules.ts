interface CartItem {
  productId: number;
  quantity: number;
}

export const addChatbotItemToCart = (
  cart: CartItem[],
  productId: number,
  quantity: number
): CartItem[] => {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("INVALID_CART_QUANTITY");
  }

  const existing = cart.find(item => item.productId === productId);
  if (existing) {
    return cart.map(item =>
      item.productId === productId
        ? { ...item, quantity: item.quantity + quantity }
        : item
    );
  }

  return [...cart, { productId, quantity }];
};
