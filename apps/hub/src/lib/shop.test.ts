import { describe, expect, it } from "vitest";
import { ModelContextShim } from "./webmcp";
import { Cart, DISHES, searchDishes } from "./shop";
import { registerShopTools } from "./shopTools";

describe("shop", () => {
  it("the cheapest Sev Usal under 100 is one clear answer", () => {
    const [top, second] = searchDishes({ query: "sev usal", maxPrice: 99, sortBy: "price" });
    expect(top.restaurant).toBe("Mandvi Snack Corner");
    expect(top.price).toBe(60);
    expect(second.price).toBeGreaterThan(top.price);
  });

  it("filters, sorts and limits", () => {
    expect(searchDishes({ vegetarian: true }).every((d) => d.veg)).toBe(true);
    expect(searchDishes({ sortBy: "rating", limit: 3 })).toHaveLength(3);
    expect(searchDishes({ query: "biryani", sortBy: "price" })[0].price).toBeLessThanOrEqual(searchDishes({ query: "biryani" })[1].price);
    expect(DISHES.length).toBeGreaterThan(30);
  });

  it("cart totals and unknown ids", () => {
    const c = new Cart();
    c.add("d1", 2);
    expect(c.count()).toBe(2);
    expect(c.total()).toBe(120);
    expect(() => c.add("nope")).toThrow(/search_dishes/);
  });
});

describe("shop tools on the shim", () => {
  it("search, add and read the cart through executeTool", async () => {
    const ctx = new ModelContextShim();
    const cart = new Cart();
    const ac = new AbortController();
    await registerShopTools(ctx, cart, ac.signal);
    expect((await ctx.getTools()).map((t) => t.name)).toEqual(["search_dishes", "add_to_cart", "get_cart"]);
    const found = JSON.parse(await ctx.executeTool("search_dishes", { query: "sev usal", maxPrice: 99, sortBy: "price", limit: 1 }));
    expect(found[0].restaurant).toBe("Mandvi Snack Corner");
    await ctx.executeTool("add_to_cart", { id: found[0].id });
    expect(JSON.parse(await ctx.executeTool("get_cart")).total).toBe(60);
    ac.abort();
    expect(await ctx.getTools()).toHaveLength(0);
  });
});
