import React, { useEffect, useState } from "react";
import { CATEGORIES, Cart, DISHES } from "../../lib/shop";
import { dishImage } from "../../lib/dishArt";

export type ShopLayout = "original" | "redesigned";

/**
 * A mock of a large ordering site. The markup is deliberately like a real one: generated class names,
 * wrapper divs, split price spans, a sponsored slot between results. The "redesigned" layout renames
 * every class and changes the structure, as a deploy would.
 */
const KEYS = ["root", "bar", "logo", "loc", "cartBtn", "cartCount", "banner", "chips", "chip", "grid", "card", "wrap", "img", "body", "titleRow", "veg", "nonveg", "name", "sub", "rate", "price", "cur", "amt", "btn", "ad", "foot"] as const;
type Classes = Record<(typeof KEYS)[number], string>;

const ORIGINAL: Classes = {
  root: "App_root__a1X0q", bar: "Header_bar__k9P2s", logo: "Header_logo__m3Q8r", loc: "Header_location__u7R1t", cartBtn: "Header_cart__b4N6w", cartCount: "Header_cartCount__w2T5v",
  banner: "Promo_banner__d8L3n", chips: "Chips_row__f5V9c", chip: "Chips_chip__h1Z4b", grid: "Listing_grid__r6C7m",
  card: "Card_card__x7Yk2", wrap: "Card_wrap__j3M1d", img: "Card_img__p8S2e", body: "Card_body__t5G6f", titleRow: "Card_titleRow__k2L8g",
  veg: "Card_veg__z2D9h", nonveg: "Card_nonveg__q4F7j", name: "Card_name__n1B3k", sub: "Card_sub__e9K5l", rate: "Card_rating__y6H8m",
  price: "Card_price__c3W1n", cur: "Card_cur__v7J4p", amt: "Card_amt__s2X6q", btn: "Card_add__g8U2r", ad: "Sponsored_slot__l5A9s", foot: "Footer_links__o4E7t",
};

const REDESIGNED: Classes = {
  root: "Shell_main__7pQ2z", bar: "TopNav_nav__4kD8a", logo: "TopNav_brand__9mC1b", loc: "TopNav_area__2xV6c", cartBtn: "TopNav_basket__5rT3d", cartCount: "TopNav_basketQty__8wH7e",
  banner: "Hero_strip__3nB5f", chips: "Filters_scroller__6jG9g", chip: "Filters_pill__1sL4h", grid: "Results_list__0cK7i",
  card: "Tile_tile__8hQ3z", wrap: "Tile_shell__5aV2j", img: "Tile_photo__2dN9k", body: "Tile_info__7fR4l", titleRow: "Tile_head__4gS8m",
  veg: "Tile_dietVeg__6bR1n", nonveg: "Tile_dietNon__9yT5o", name: "Tile_title__2nL7p", sub: "Tile_meta__1eM3q", rate: "Tile_score__8tJ6r",
  price: "Tile_amount__3uP0s", cur: "Tile_unit__5hW2t", amt: "Tile_figure__7cX9u", btn: "Tile_cta__4zA1v", ad: "Promo_slot__6vB8w", foot: "Site_footer__2qE5x",
};

const css = (c: Classes) => `
#shop{background:#fff;color:#1c1c1c;font:14px/1.4 Arial,Helvetica,sans-serif;text-align:left}
#shop .${c.bar}{display:flex;align-items:center;gap:14px;padding:9px 16px;border-bottom:1px solid #eee;position:sticky;top:0;background:#fff;z-index:2}
#shop .${c.logo}{font-weight:800;font-size:20px;color:#e8590c}
#shop .${c.loc}{color:#555;font-size:13px;flex:1}
#shop .${c.cartBtn}{display:flex;align-items:center;gap:8px;border:1px solid #ddd;border-radius:8px;padding:6px 12px;font-weight:600;background:#fff}
#shop .${c.cartCount}{background:#e8590c;color:#fff;border-radius:10px;padding:0 7px;font-size:12px;min-width:18px;text-align:center}
#shop .${c.banner}{margin:10px 16px;padding:10px 16px;border-radius:10px;background:linear-gradient(90deg,#ffe8cc,#fff4e6);font-weight:700;font-size:14px;color:#c2410c}
#shop .${c.chips}{display:flex;gap:6px;padding:0 16px 8px;flex-wrap:wrap}
#shop .${c.chip}{border:1px solid #ddd;border-radius:18px;padding:3px 10px;font-size:12px;background:#fff;color:#333}
#shop .${c.grid}{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:10px;padding:4px 16px 16px}
#shop .${c.card}{border:1px solid #eee;border-radius:12px;overflow:hidden;background:#fff}
#shop .${c.wrap}{display:flex;flex-direction:column}
#shop .${c.img}{display:block;width:100%;height:84px;object-fit:cover}
#shop .${c.body}{padding:9px 11px;display:flex;flex-direction:column;gap:5px}
#shop .${c.titleRow}{display:flex;align-items:center;gap:6px}
#shop .${c.veg},#shop .${c.nonveg}{width:12px;height:12px;border:1.5px solid;display:inline-block;position:relative;flex-shrink:0}
#shop .${c.veg}{border-color:#2f9e44}
#shop .${c.nonveg}{border-color:#c92a2a}
#shop .${c.veg}::after,#shop .${c.nonveg}::after{content:"";position:absolute;inset:2px;border-radius:50%}
#shop .${c.veg}::after{background:#2f9e44}
#shop .${c.nonveg}::after{background:#c92a2a}
#shop .${c.name}{font-size:14px;font-weight:700;margin:0;color:#1c1c1c}
#shop .${c.sub}{color:#777;font-size:12px}
#shop .${c.rate}{background:#2f9e44;color:#fff;border-radius:4px;padding:0 6px;font-size:12px;font-weight:700}
#shop .${c.price}{font-weight:700;font-size:14px}
#shop .${c.cur}{margin-right:2px}
#shop .${c.btn}{border:1px solid #2f9e44;color:#2f9e44;background:#fff;border-radius:6px;padding:5px 0;font-weight:800;cursor:pointer}
#shop .${c.ad}{border:1px dashed #ccc;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#888;font-size:12px;min-height:96px;background:#fafafa}
#shop .${c.foot}{display:flex;gap:18px;flex-wrap:wrap;padding:18px 20px;border-top:1px solid #eee;color:#777;font-size:12px}
`;

const hue = (category: string) => (CATEGORIES.indexOf(category) * 41 + 20) % 360;

export default function ShopSite({ layout, cart }: { layout: ShopLayout; cart: Cart }) {
  const c = layout === "original" ? ORIGINAL : REDESIGNED;
  const [, bump] = useState(0);
  useEffect(() => cart.subscribe(() => bump((n) => n + 1)), [cart]);

  const cards: React.ReactNode[] = [];
  DISHES.forEach((d, i) => {
    cards.push(
      <div className={c.card} key={d.id}>
        <div className={c.wrap}>
          <img className={c.img} src={dishImage(d)} alt={d.name} loading="lazy" />
          <div className={c.body}>
            <div className={c.titleRow}>
              <span className={d.veg ? c.veg : c.nonveg} />
              {layout === "original" ? <h3 className={c.name}>{d.name}</h3> : <p className={c.name}>{d.name}</p>}
            </div>
            <div className={c.sub}>
              {d.restaurant} · {d.etaMin} min
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className={c.rate}>★ {d.rating.toFixed(1)}</span>
              {layout === "original" ? (
                <div className={c.price}>
                  <span className={c.cur}>₹</span>
                  <span className={c.amt}>{d.price}</span>
                </div>
              ) : (
                <strong className={c.price}>₹{d.price}</strong>
              )}
            </div>
            <button className={c.btn} onClick={() => cart.add(d.id)}>ADD</button>
          </div>
        </div>
      </div>,
    );
    if ((i + 1) % 9 === 0) cards.push(<div className={c.ad} key={`ad${i}`}>Sponsored</div>);
  });

  return (
    <div id="shop" className={c.root}>
      <style>{css(c)}</style>
      <div className={c.bar}>
        <span className={c.logo}>Plateful</span>
        <span className={c.loc}>Deliver to: Alkapuri, Vadodara</span>
        <span className={c.cartBtn}>
          Cart <span className={c.cartCount}>{cart.count()}</span>
        </span>
      </div>
      <div className={c.banner}>Free delivery on orders above ₹499</div>
      <div className={c.chips}>
        {["Veg only", "Rating 4.0+", "Fast delivery", ...CATEGORIES].map((x) => (
          <span className={c.chip} key={x}>{x}</span>
        ))}
      </div>
      <div className={c.grid}>{cards}</div>
      <div className={c.foot}>
        {["About", "Careers", "Partner with us", "Help", "Terms", "Privacy", "Cookie policy"].map((x) => (
          <span key={x}>{x}</span>
        ))}
      </div>
    </div>
  );
}
