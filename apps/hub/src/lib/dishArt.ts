/**
 * Small flat illustrations for the mock ordering site, drawn in code so the demo needs no network and no
 * image licences. One scene per category, varied a little per dish. Returned as a data URI for an <img>.
 */
import type { Dish } from "./shop";

const O = "#2b2118"; // outline
const rect = (x: number, y: number, w: number, h: number, fill: string, rx = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${O}" stroke-width="2"/>`;
const circ = (cx: number, cy: number, r: number, fill: string, stroke = true) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${stroke ? ` stroke="${O}" stroke-width="2"` : ""}/>`;
const ell = (cx: number, cy: number, rx: number, ry: number, fill: string, stroke = true) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"${stroke ? ` stroke="${O}" stroke-width="2"` : ""}/>`;
const path = (d: string, fill: string, stroke = true) => `<path d="${d}" fill="${fill}"${stroke ? ` stroke="${O}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"` : ""}/>`;
const line = (x1: number, y1: number, x2: number, y2: number, col: string, w = 2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;

const n = (d: Dish) => parseInt(d.id.slice(1), 10);

function scene(d: Dish): string {
  switch (d.category) {
    case "Pizza": {
      const spots: [number, number][] = [[68, 44], [88, 40], [78, 58], [96, 56], [64, 62], [82, 48]];
      const tops = spots.map(([x, y], i) =>
        d.veg ? (i % 2 ? circ(x, y, 4, "#4c9a2a") : circ(x, y, 3, "#3a2a22")) : circ(x, y, 5, "#c0392b") + circ(x - 1, y - 1, 1.2, "#e8a89e", false),
      );
      return circ(80, 52, 40, "#e3a857") + circ(80, 52, 33, "#d9482b") + circ(80, 52, 30, "#f7d66b") + tops.join("") + line(80, 22, 80, 82, "#c9a227", 1.5) + line(54, 37, 106, 67, "#c9a227", 1.5);
    }
    case "Burgers":
      return (
        path("M42 46 Q80 6 118 46 Z", "#e0a050") +
        [58, 76, 94, 66, 86].map((x, i) => ell(x, 30 + (i % 3) * 4, 3, 1.6, "#fbeed0", false)).join("") +
        path("M40 50 Q50 58 60 50 T80 50 T100 50 T120 50 L120 55 L40 55 Z", "#5aa832") +
        rect(42, 55, 76, 9, "#d2402b", 3) +
        rect(40, 64, 80, 12, d.veg ? "#c79a3f" : "#6b3e22", 6) +
        path("M42 76 H118 Q118 90 100 90 H60 Q42 90 42 76 Z", "#e0a050")
      );
    case "Biryani":
      return (
        ell(80, 72, 52, 8, "#00000022", false) +
        path("M32 52 H128 Q124 88 80 88 Q36 88 32 52 Z", "#b9552a") +
        path("M38 52 Q50 20 80 20 Q110 20 122 52 Z", "#f1dfae") +
        [52, 66, 80, 94, 108].map((x, i) => circ(x, 40 + (i % 2) * 6, 2.4, i % 2 ? "#e8a32a" : "#fff7df", false)).join("") +
        (d.veg ? [60, 84, 102].map((x) => circ(x, 36, 4, "#4c9a2a")).join("") : [62, 88].map((x) => rect(x, 30, 12, 9, "#8a4a26", 3)).join("")) +
        rect(30, 50, 100, 6, "#8f3f1c", 3)
      );
    case "Farsan":
      return (
        ell(80, 62, 56, 22, "#f4f1ea") +
        [[48, 52], [66, 50], [84, 52], [102, 50], [57, 66], [75, 65], [93, 66]].map(([x, y]) => rect(x - 7, y - 6, 14, 12, "#f2cf4a", 2)).join("") +
        rect(114, 52, 20, 16, "#ffffff", 6) + ell(124, 56, 7, 2.5, "#4c9a2a", false)
      );
    case "Gujarati Meals":
      return (
        circ(80, 52, 44, "#e8e3d8") + circ(80, 52, 38, "#f6f3ea") +
        ([[62, 40, "#e0742a"], [98, 40, "#c9a227"], [62, 66, "#4c9a2a"], [98, 66, "#d2402b"]] as [number, number, string][]).map(([x, y, col]) => circ(x, y, 11, "#ffffff") + circ(x, y, 8, col, false)).join("") +
        circ(80, 53, 9, "#f0dba0") + circ(80, 53, 4, "#f7efd0", false)
      );
    case "Beverages":
      return (
        path("M54 26 H106 L98 88 H62 Z", "#f6efe0") +
        path("M57 40 H103 L98 88 H62 Z", d.name.includes("Chaas") ? "#efe6c4" : d.name.includes("Milk") ? "#f3d9a0" : "#9ccc4a") +
        line(88, 10, 96, 36, "#d2402b", 4) + ell(80, 26, 26, 4, "#ffffff")
      );
    case "Street Food":
      if (d.name === "Sev Usal")
        return (
          path("M34 54 H126 Q122 88 80 88 Q38 88 34 54 Z", "#b9552a") +
          ell(80, 54, 46, 9, "#e0742a") +
          Array.from({ length: 14 }, (_, i) => line(46 + i * 5.5, 50 + (i % 3), 52 + i * 5.5, 42 + (i % 4) * 2, "#f2cf4a", 2)).join("") +
          rect(24, 22, 24, 14, "#e8b872", 6) + rect(116, 22, 24, 14, "#e8b872", 6)
        );
    // other street food falls through to the plate scene
    default: /* plate */
      return (
        ell(80, 62, 56, 22, "#f4f1ea") +
        [[52, 56], [72, 52], [92, 56], [62, 68], [84, 68]].map(([x, y]) => circ(x, y, 9, "#e3a53a") + circ(x, y, 3, "#6a3a14", false)).join("") +
        rect(112, 50, 22, 18, "#ffffff", 6) + ell(123, 54, 8, 2.5, "#4c9a2a", false)
      );
  }
}

const cache = new Map<string, string>();

export function dishImage(d: Dish): string {
  const hit = cache.get(d.id);
  if (hit) return hit;
  const hue = (n(d) * 37) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100"><rect width="160" height="100" fill="hsl(${hue} 55% 88%)"/>${scene(d)}</svg>`;
  const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  cache.set(d.id, uri);
  return uri;
}
