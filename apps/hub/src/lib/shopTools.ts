/** The tools the ordering site registers. */
import type { ModelContextLike, ModelContextTool } from "./webmcp";
import { Cart, DishQuery, searchDishes } from "./shop";

export function shopTools(cart: Cart): ModelContextTool[] {
  return [
    {
      name: "search_dishes",
      description: "Search dishes. Filter by text, vegetarian and maximum price, sort by price, rating or delivery time, and limit the count.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Words in the dish, restaurant or category" },
          vegetarian: { type: "boolean" },
          maxPrice: { type: "integer", description: "In rupees" },
          sortBy: { type: "string", enum: ["price", "rating", "eta"] },
          limit: { type: "integer", minimum: 1 },
        },
      },
      execute: async (input) =>
        searchDishes(input as DishQuery).map(({ id, name, restaurant, price, veg, rating, etaMin }) => ({ id, name, restaurant, price, veg, rating, etaMin })),
    },
    {
      name: "add_to_cart",
      description: "Add a dish to the cart by its id from search_dishes.",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" }, quantity: { type: "integer", minimum: 1 } },
        required: ["id"],
      },
      execute: async ({ id, quantity }) => {
        const dish = cart.add(String(id), quantity === undefined ? 1 : Number(quantity));
        return { added: dish.name, cartItems: cart.count(), total: cart.total() };
      },
    },
    {
      name: "get_cart",
      description: "Show what is in the cart.",
      annotations: { readOnlyHint: true },
      inputSchema: { type: "object", properties: {} },
      execute: async () => ({ items: cart.lines(), total: cart.total() }),
    },
  ];
}

/** Register every tool against one signal, so aborting it removes them all. */
export async function registerShopTools(ctx: ModelContextLike, cart: Cart, signal: AbortSignal): Promise<void> {
  for (const tool of shopTools(cart)) await ctx.registerTool(tool, { signal });
}
