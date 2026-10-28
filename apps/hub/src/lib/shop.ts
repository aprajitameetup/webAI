/** Data and cart for the mock ordering site used in the console demo. Fictional restaurants and dishes. */

export interface Dish {
  id: string;
  name: string;
  restaurant: string;
  category: string;
  price: number;
  veg: boolean;
  rating: number;
  etaMin: number;
}

// [name, restaurant, category, price in rupees, veg, rating, delivery minutes]
const ROWS: [string, string, string, number, boolean, number, number][] = [
  ["Sev Usal", "Mandvi Snack Corner", "Street Food", 60, true, 4.4, 18],
  ["Sev Usal", "Sursagar Chaat House", "Street Food", 90, true, 4.3, 22],
  ["Sev Usal", "Fatehgunj Foods", "Street Food", 80, true, 4.0, 25],
  ["Sev Usal", "Alkapuri Street Bites", "Street Food", 110, true, 4.5, 20],
  ["Sev Usal", "Raopura Rasoi", "Street Food", 70, true, 4.2, 24],
  ["Dabeli", "Mandvi Snack Corner", "Street Food", 30, true, 4.2, 18],
  ["Pav Bhaji", "Alkapuri Street Bites", "Street Food", 140, true, 4.4, 24],
  ["Pani Puri", "Sursagar Chaat House", "Street Food", 50, true, 4.5, 20],
  ["Sev Puri", "Sursagar Chaat House", "Street Food", 70, true, 4.1, 20],
  ["Dahi Puri", "Fatehgunj Foods", "Street Food", 80, true, 4.2, 25],
  ["Khaman Dhokla", "Raopura Rasoi", "Farsan", 80, true, 4.5, 26],
  ["Khandvi", "Raopura Rasoi", "Farsan", 90, true, 4.3, 26],
  ["Fafda Jalebi", "Fatehgunj Foods", "Farsan", 120, true, 4.6, 25],
  ["Methi Thepla", "Raopura Rasoi", "Farsan", 70, true, 4.2, 26],
  ["Handvo", "Raopura Rasoi", "Farsan", 100, true, 4.0, 28],
  ["Gujarati Thali", "Raopura Rasoi", "Gujarati Meals", 260, true, 4.6, 35],
  ["Khichdi Kadhi", "Raopura Rasoi", "Gujarati Meals", 150, true, 4.4, 30],
  ["Undhiyu", "Raopura Rasoi", "Gujarati Meals", 220, true, 4.5, 35],
  ["Dal Dhokli", "Raopura Rasoi", "Gujarati Meals", 160, true, 4.3, 32],
  ["Sev Tameta", "Fatehgunj Foods", "Gujarati Meals", 130, true, 4.1, 28],
  ["Shrikhand", "Alkapuri Sweet House", "Sweets", 90, true, 4.6, 30],
  ["Basundi", "Alkapuri Sweet House", "Sweets", 100, true, 4.5, 30],
  ["Mohanthal", "Alkapuri Sweet House", "Sweets", 110, true, 4.3, 30],
  ["Gulab Jamun", "Alkapuri Sweet House", "Sweets", 80, true, 4.4, 30],
  ["Masala Chaas", "Mandvi Snack Corner", "Beverages", 30, true, 4.3, 18],
  ["Sugarcane Juice", "Sursagar Chaat House", "Beverages", 40, true, 4.2, 20],
  ["Kesar Milk", "Alkapuri Sweet House", "Beverages", 70, true, 4.4, 30],
  ["Margherita Pizza", "Pizza Piazza", "Pizza", 199, true, 4.3, 30],
  ["Paneer Tikka Pizza", "Pizza Piazza", "Pizza", 289, true, 4.1, 32],
  ["Pepperoni Feast Pizza", "Pizza Piazza", "Pizza", 399, false, 4.5, 32],
  ["Veg Biryani", "Biryani Junction", "Biryani", 219, true, 4.1, 38],
  ["Chicken Biryani", "Biryani Junction", "Biryani", 289, false, 4.5, 38],
  ["Aloo Tikki Burger", "Burger Barn", "Burgers", 99, true, 4.0, 25],
  ["Chicken Zinger Burger", "Burger Barn", "Burgers", 169, false, 4.4, 25],
  ["Veg Hakka Noodles", "Noodle Lane", "Chinese", 160, true, 4.0, 33],
  ["Chicken Noodles", "Noodle Lane", "Chinese", 190, false, 4.2, 33],
];

export const DISHES: Dish[] = ROWS.map(([name, restaurant, category, price, veg, rating, etaMin], i) => ({
  id: `d${i + 1}`,
  name,
  restaurant,
  category,
  price,
  veg,
  rating,
  etaMin,
}));

export const CATEGORIES = [...new Set(DISHES.map((d) => d.category))];

export interface DishQuery {
  query?: string;
  vegetarian?: boolean;
  maxPrice?: number;
  sortBy?: "price" | "rating" | "eta";
  limit?: number;
}

export function searchDishes(q: DishQuery = {}): Dish[] {
  const words = (q.query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  let rows = DISHES.filter((d) => {
    const hay = `${d.name} ${d.restaurant} ${d.category}`.toLowerCase();
    return words.every((w) => hay.includes(w)) && (!q.vegetarian || d.veg) && (q.maxPrice === undefined || d.price <= q.maxPrice);
  });
  if (q.sortBy === "price") rows = [...rows].sort((a, b) => a.price - b.price);
  if (q.sortBy === "rating") rows = [...rows].sort((a, b) => b.rating - a.rating);
  if (q.sortBy === "eta") rows = [...rows].sort((a, b) => a.etaMin - b.etaMin);
  return q.limit ? rows.slice(0, q.limit) : rows;
}

/** The cart behind the page's ADD buttons and the add_to_cart tool. */
export class Cart {
  items = new Map<string, number>();
  private listeners = new Set<() => void>();

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  add(id: string, quantity = 1) {
    const dish = DISHES.find((d) => d.id === id);
    if (!dish) throw new Error(`No dish with id "${id}". Use search_dishes to find ids.`);
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error("quantity must be a whole number, 1 or more");
    this.items.set(id, (this.items.get(id) ?? 0) + quantity);
    this.listeners.forEach((l) => l());
    return dish;
  }

  count() {
    return [...this.items.values()].reduce((a, b) => a + b, 0);
  }

  lines() {
    return [...this.items].map(([id, quantity]) => {
      const d = DISHES.find((x) => x.id === id)!;
      return { id, name: d.name, restaurant: d.restaurant, quantity, price: d.price };
    });
  }

  total() {
    return this.lines().reduce((a, l) => a + l.price * l.quantity, 0);
  }

  clear() {
    this.items.clear();
    this.listeners.forEach((l) => l());
  }
}
