import type { Game } from "@/types/game";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export type FeedType = "GenericList" | "HTMLGames" | "Playsaurus" | "GameMonetize" | "OnlineGames";

export type FeedAdapter = {
  id: FeedType;
  name: string;
  describeMapping: string[]; // For simple on-screen mapping visualization
  parse(input: unknown): Game[];
};

function toArray(val: unknown): string[] | undefined {
  if (val == null) return undefined;
  if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof val === "string") return val.split(/[\,\n]/).map((s) => s.trim()).filter(Boolean);
  return undefined;
}

const GenericList: FeedAdapter = {
  id: "GenericList",
  name: "Generic: { title, url, thumbnail, ... }",
  describeMapping: [
    "title → title",
    "url → url",
    "thumbnail → thumbnail",
    "description → description",
    "genre|genres → genre[]",
    "tags → tags[]",
    "platforms → platforms[]",
  ],
  parse(input: unknown): Game[] {
    const obj = (typeof input === "object" && input !== null ? (input as Record<string, Json>) : undefined);
    const arr: Json[] = Array.isArray(input) ? (input as Json[]) : (obj && Array.isArray(obj.data as Json[]) ? ((obj.data as Json[]) || []) : []);
    return (arr as Json[]).map((raw, i) => {
      const it = (typeof raw === "object" && raw !== null ? (raw as Record<string, Json>) : {});
      const title = String(it.title || it.name || "").trim();
      const url = String(it.url || it.link || it.playUrl || "").trim();
      const thumbnail = String(it.thumbnail || it.thumb || it.image || it.icon || "").trim();
      const id = String(it.id || it.slug || `ext-${i}`).trim();
      return {
        id,
        title,
        url,
        thumbnail,
        description: it.description ? String(it.description) : undefined,
        genre: toArray(it.genre || it.genres),
        tags: toArray(it.tags),
        platforms: toArray(it.platforms),
        rating: it.rating != null ? Number(it.rating as number) : undefined,
        mobile: it.mobile != null ? Boolean(it.mobile) : undefined,
        height: it.height != null ? Number(it.height as number) : undefined,
        width: it.width != null ? Number(it.width as number) : undefined,
        released: it.released ? String(it.released) : undefined,
        featured: it.featured != null ? Boolean(it.featured) : undefined,
      } as Game;
    }).filter((g) => g.title && g.url && g.thumbnail);
  },
};

// Example adapter for HTMLGames feed style (approximate mapping as example)
const HTMLGames: FeedAdapter = {
  id: "HTMLGames",
  name: "HTMLGames fjson",
  describeMapping: [
    "name → title",
    "url → url",
    "thumb5|thumb6|thumb8… → thumbnail",
    "description → description",
    "category → genre[]",
    "create_date → released",
    "width|height → width|height",
  ],
  parse(input: unknown): Game[] {
    const obj = (typeof input === "object" && input !== null ? (input as Record<string, Json>) : undefined);
    let arr: Json[] = [];
    if (Array.isArray(input)) {
      arr = input as Json[];
    } else if (obj && Array.isArray(obj.games as Json[])) {
      // Some feeds may wrap in { games: [...] }
      arr = (obj.games as Json[]) || [];
    } else if (obj && ("name" in obj || "url" in obj || "embed" in obj)) {
      // Single fjson object
      arr = [obj as Json];
    }

    const pickThumb = (it: Record<string, Json>): string => {
      const order = ["thumb5", "thumb6", "thumb8", "thumb7", "thumb4", "thumb3", "thumb2", "thumb1"];
      for (const k of order) {
        const v = it[k];
        if (typeof v === "string" && v) return v;
      }
      const fallback = it["image"] || it["thumbnail"] || it["icon"];
      return typeof fallback === "string" ? fallback : "";
    };

    return arr.map((raw, i) => {
      const it = (typeof raw === "object" && raw !== null ? (raw as Record<string, Json>) : {});
      const url = String(it.url || (it as Record<string, Json>)["game_url"] || "").trim();
      const title = String(it.name || it.title || "").trim();
      const thumbnail = pickThumb(it);
      return {
        id: String(it.id || `htmlgames-${i}`),
        title,
        url,
        thumbnail,
        description: it.description ? String(it.description) : (it.desc ? String(it.desc) : undefined),
        genre: toArray(it.category),
        tags: toArray(it.tags),
        released: it.create_date ? String(it.create_date) : undefined,
        width: it.width != null ? Number(it.width as number) : undefined,
        height: it.height != null ? Number(it.height as number) : undefined,
      } as Game;
    }).filter((g) => g.title && g.url && g.thumbnail);
  },
};

// Example adapter for Playsaurus-style list (like Mr.Mine misc endpoints)
const Playsaurus: FeedAdapter = {
  id: "Playsaurus",
  name: "Playsaurus feed.json",
  describeMapping: [
    "Title → title",
    "Url → url",
    "Asset[] → thumbnail (prefers 512x512, then 1280x720)",
    "Description → description",
    "Category[] → genre[]",
    "Tag[] → tags[]",
    "Mobile → mobile",
    "Height|Width → height|width",
  ],
  parse(input: unknown): Game[] {
    const obj = (typeof input === "object" && input !== null ? (input as Record<string, Json>) : undefined);
    let arr: Json[] = [];
    if (Array.isArray(input)) arr = input as Json[];
    else if (obj && Array.isArray(obj.items as Json[])) arr = (obj.items as Json[]) || [];
    else if (obj && ("Title" in obj || "Url" in obj)) arr = [obj as Json];

    const pickAsset = (assets: Json | undefined): string => {
      if (!Array.isArray(assets)) return "";
      const urls = (assets as Json[]).map((u) => (typeof u === "string" ? u : "")).filter(Boolean);
      const prefer = urls.find((u) => u.includes("512x512"))
        || urls.find((u) => u.includes("1280x720"))
        || urls.find((u) => u.includes("512x384"))
        || urls[0] || "";
      return prefer;
    };

    return arr.map((raw, i) => {
      const it = (typeof raw === "object" && raw !== null ? (raw as Record<string, Json>) : {});
      const title = String((it["Title"] ?? it["title"] ?? "")).trim();
      const url = String((it["Url"] ?? it["url"] ?? "")).trim();
      const thumbnail = pickAsset(it["Asset"]);
      const md5 = String(it["Md5"] ?? "").trim();
      const mobileVal = it["Mobile"];
      const mobile = typeof mobileVal === "string" ? mobileVal.toLowerCase() === "true" : (typeof mobileVal === "boolean" ? mobileVal : undefined);
      const height = it["Height"] != null ? Number(it["Height"] as number) : undefined;
      const width = it["Width"] != null ? Number(it["Width"] as number) : undefined;

      return {
        id: md5 ? `ps-${md5}` : `playsaurus-${i}`,
        title,
        url,
        thumbnail,
        description: it["Description"] ? String(it["Description"]) : undefined,
        genre: toArray(it["Category"]),
        tags: toArray(it["Tag"]),
        mobile,
        height,
        width,
      } as Game;
    }).filter((g) => g.title && g.url && g.thumbnail);
  },
};

// GameMonetize adapter: supports both their JSON API and simple XML-to-JSON parsing
const GameMonetize: FeedAdapter = {
  id: "GameMonetize",
  name: "GameMonetize feed (JSON/XML)",
  describeMapping: [
    "title → title",
    "url → url (html5.gamemonetize.com/...)",
    "thumb → thumbnail (img.gamemonetize.com/...)",
    "description → description",
    "category → genre[]",
    "tags → tags[]",
    "width|height → width|height",
  ],
  parse(input: unknown): Game[] {
    // JSON shape commonly seen: array of objects with id,title,description,instructions,url,category,tags,thumb,width,height
    const fromJson = (arr: unknown[]): Game[] => {
      return arr.map((raw, i) => {
        const it = (typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {});
        const title = String(it["title"] ?? it["name"] ?? "").trim();
        const url = String(it["url"] ?? "").trim();
        const thumbnail = String(it["thumb"] ?? it["thumbnail"] ?? it["image"] ?? "").trim();
        const id = String(it["id"] ?? `gm-${i}`).trim();
        const width = it["width"] != null ? Number(it["width"] as number) : undefined;
        const height = it["height"] != null ? Number(it["height"] as number) : undefined;
        return {
          id,
          title,
          url,
          thumbnail,
          description: it["description"] ? String(it["description"]) : undefined,
          genre: toArray(it["category"]),
          tags: toArray(it["tags"]),
          width,
          height,
        } as Game;
      }).filter((g) => g.title && g.url && g.thumbnail);
    };

    // If the input is raw XML/text as a string, do a minimal parse for key fields
    const fromXmlText = (xml: string): Game[] => {
      // Very naive parser: splits on <item> ... </item> and extracts simple tags
      const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)).map((m) => m[1]);
      const pick = (src: string, tag: string) => {
        const m = src.match(new RegExp(`<${tag}>([\\s\\S]*?)<\/${tag}>`, "i"));
        return m ? m[1].trim() : "";
      };
      const pickAttr = (src: string, tag: string, attr: string) => {
        const re = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["'][^>]*>`, "i");
        const m = src.match(re);
        return m ? m[1] : "";
      };
      const toList = (src: string, tag: string): string[] | undefined => {
        const val = pick(src, tag);
        if (!val) return undefined;
        return val.split(/[\,\n]/).map((s) => s.trim()).filter(Boolean);
      };
      const results: Game[] = [];
      items.forEach((it, i) => {
        const title = pick(it, "title") || pick(it, "name");
        const url = pick(it, "url") || pick(it, "link");
        const thumbTag = it.match(/<thumb[^>]*>([\s\S]*?)<\/thumb>/i);
        const thumbnail = thumbTag ? thumbTag[1].trim() : pickAttr(it, "enclosure", "url");
        const description = pick(it, "description");
        const category = toList(it, "category");
        const tags = toList(it, "tags");
        const widthStr = pick(it, "width");
        const heightStr = pick(it, "height");
        const g: Game = {
          id: `gm-xml-${i}`,
          title: title.trim(),
          url: url.trim(),
          thumbnail: (thumbnail || "").trim(),
          description: description || undefined,
          genre: category,
          tags,
          width: widthStr ? Number(widthStr) : undefined,
          height: heightStr ? Number(heightStr) : undefined,
        };
        if (g.title && g.url && g.thumbnail) results.push(g);
      });
      return results;
    };

    if (typeof input === "string") {
      return fromXmlText(input);
    }
    if (Array.isArray(input)) {
      return fromJson(input as unknown[]);
    }
    if (input && typeof input === "object") {
      const obj = input as Record<string, unknown>;
      if (Array.isArray(obj["data"])) return fromJson(obj["data"] as unknown[]);
      if (Array.isArray(obj["items"])) return fromJson(obj["items"] as unknown[]);
      // some feeds may directly be an object entry
      if ("title" in obj || "url" in obj) return fromJson([obj]);
    }
    return [];
  },
};

// OnlineGames.io adapter: parses their embed.json feed
const OnlineGames: FeedAdapter = {
  id: "OnlineGames",
  name: "OnlineGames.io embed.json",
  describeMapping: [
    "title → title",
    "embed → url",
    "image → thumbnail",
    "tags → genre[] and tags[] (comma-separated)",
    "description → description",
  ],
  parse(input: unknown): Game[] {
    const toArr = (): Array<Record<string, unknown>> => {
      if (Array.isArray(input)) return input as Array<Record<string, unknown>>;
      if (input && typeof input === "object") {
        const obj = input as Record<string, unknown>;
        if (Array.isArray(obj["data"])) return obj["data"] as Array<Record<string, unknown>>;
        if (Array.isArray(obj["items"])) return obj["items"] as Array<Record<string, unknown>>;
        if (Array.isArray(obj["games"])) return obj["games"] as Array<Record<string, unknown>>;
      }
      return [];
    };

    const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);

    return toArr().map((it, i) => {
      const title = String(it["title"] ?? it["name"] ?? "").trim();
      const url = String(it["embed"] ?? it["url"] ?? "").trim();
      const thumbnail = String(it["image"] ?? it["thumb"] ?? it["thumbnail"] ?? "").trim();
      const id = title ? `ogio-${slug(title)}` : `ogio-${i}`;
      const tags = toArray(it["tags"]);
      return {
        id,
        title,
        url,
        thumbnail,
        description: it["description"] ? String(it["description"]) : undefined,
        // OnlineGames feed exposes only tags; use them for both genre and tags so admin mapping can canonicalize
        genre: tags,
        tags,
      } as Game;
    }).filter((g) => g.title && g.url && g.thumbnail);
  },
};

export const FEED_ADAPTERS: FeedAdapter[] = [GenericList, HTMLGames, Playsaurus, GameMonetize, OnlineGames];
