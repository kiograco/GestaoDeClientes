import { addChatbotItemToCart } from "../../helpers/chatbotCartRules";

describe("chatbot cart rules", () => {
  it("cria carrinho a partir da primeira escolha do cliente", () => {
    expect(addChatbotItemToCart([], 10, 2)).toEqual([
      { productId: 10, quantity: 2 }
    ]);
  });

  it("soma quantidade quando produto ja esta no carrinho", () => {
    expect(addChatbotItemToCart([{ productId: 10, quantity: 1 }], 10, 2)).toEqual([
      { productId: 10, quantity: 3 }
    ]);
  });

  it("rejeita quantidade invalida", () => {
    expect(() => addChatbotItemToCart([], 10, 0)).toThrow(
      "INVALID_CART_QUANTITY"
    );
  });
});
