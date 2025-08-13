import type { Game } from "@/types/game";
import type { GenreMapping } from "@/types/genreMapping";

const useDb = Boolean(process.env.DATABASE_URL);

// Minimal typed Pool interface to avoid any
type Queryable = { query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }> };

// Lazy pg import to avoid bundling when not needed
let _pool: Queryable | null = null;
let _settingsTableEnsured = false;
let _genreMappingsTableEnsured = false;
let _gamesTableEnsured = false;
let _slugRedirectsTableEnsured = false;
async function getPool(): Promise<Queryable> {
  if (_pool) return _pool;
  const mod: unknown = await import("pg");
  type ModA = { Pool: new (cfg: { connectionString?: string }) => Queryable };
  type ModB = { default: { Pool: new (cfg: { connectionString?: string }) => Queryable } };
  const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";
  const hasDirect = (m: unknown): m is ModA => {
    if (!isObject(m)) return false;
    const v = (m as Record<string, unknown>)["Pool"];
    return typeof v === "function";
  };
  const hasDefault = (m: unknown): m is ModB => {
    if (!isObject(m)) return false;
    const d = (m as Record<string, unknown>)["default"];
    if (!isObject(d)) return false;
    const v = (d as Record<string, unknown>)["Pool"];
    return typeof v === "function";
  };
  const Pool = hasDirect(mod) ? mod.Pool : hasDefault(mod) ? mod.default.Pool : (() => { throw new Error("pg Pool not found"); })();
  _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return _pool as Queryable;
}

async function ensureSettingsTable() {
  if (!useDb || _settingsTableEnsured) return;
  try {
    const pool = await getPool();
    await pool.query(
      `create table if not exists app_settings (
         key text primary key,
         value jsonb
       )`
    );
    _settingsTableEnsured = true;
  } catch {
    // ignore; consumer will fallback to defaults
  }
}

async function ensureGenreMappingsTable() {
  if (!useDb || _genreMappingsTableEnsured) return;
  try {
    const pool = await getPool();
    await pool.query(
      `create table if not exists genre_mappings (
         id text primary key,
         name text not null,
         includes text[] not null default '{}',
         emoji text
       )`
    );
    // In case table exists without emoji column in older deployments
    await pool.query(`alter table genre_mappings add column if not exists emoji text`);
    _genreMappingsTableEnsured = true;
  } catch {
    // ignore; operations may still work if table exists; callers will error otherwise
  }
}

async function ensureGamesTable() {
  if (!useDb || _gamesTableEnsured) return;
  try {
    const pool = await getPool();
    await pool.query(
      `create table if not exists games (
         id text primary key,
         slug text,
         title text not null,
         featured boolean,
         genre text[],
         platforms text[],
         mobile boolean,
         height int,
         width int,
         rating numeric,
         released text,
         thumbnail text,
         description text,
         tags text[],
         url text,
         updated_at timestamptz default now()
       )`
    );
    // In case of older deployments missing the column
    await pool.query(`alter table games add column if not exists slug text`);
    await pool.query(`alter table games add column if not exists updated_at timestamptz default now()`);
  // Helpful index for slug lookups and enforce uniqueness when not null
  await pool.query(`create index if not exists games_slug_idx on games (slug)`);
  await pool.query(`create unique index if not exists games_slug_unique on games (slug) where slug is not null`);
    _gamesTableEnsured = true;
  } catch {
    // ignore; callers may error if table truly missing
  }
}

async function ensureSlugRedirectsTable() {
  if (!useDb || _slugRedirectsTableEnsured) return;
  try {
    const pool = await getPool();
    await pool.query(
      `create table if not exists slug_redirects (
         old_slug text primary key,
         game_id text not null references games(id)
       )`
    );
    await pool.query(`create index if not exists slug_redirects_game_id_idx on slug_redirects (game_id)`);
    _slugRedirectsTableEnsured = true;
  } catch {
    // ignore
  }
}

// ---------- DB IMPLEMENTATION ----------
async function dbListGames(): Promise<Game[]> {
  await ensureGamesTable();
  const pool = await getPool();
  const { rows } = await pool.query(
  `select id, slug, title, featured, genre, platforms, mobile, height, width, rating, released, thumbnail, description, tags, url, updated_at
     from games order by id asc`
  );
  return (rows as Record<string, unknown>[]).map(dbToGame);
}

// Redirect lookups (DB)
async function dbGetGameIdByOldSlug(slug: string): Promise<string | undefined> {
  await ensureSlugRedirectsTable();
  const pool = await getPool();
  const { rows } = await pool.query(`select game_id from slug_redirects where old_slug = $1 limit 1`, [slug]);
  const r = (rows[0] as Record<string, unknown>) || undefined;
  return r && typeof r.game_id === "string" ? r.game_id : undefined;
}
async function dbAddSlugRedirect(oldSlug: string, gameId: string): Promise<boolean> {
  await ensureSlugRedirectsTable();
  const pool = await getPool();
  try {
    await pool.query(`insert into slug_redirects (old_slug, game_id) values ($1, $2) on conflict (old_slug) do update set game_id = excluded.game_id`, [oldSlug, gameId]);
    return true;
  } catch {
    return false;
  }
}
async function dbSlugExists(slug: string, excludeId?: string): Promise<boolean> {
  await ensureGamesTable();
  const pool = await getPool();
  if (excludeId) {
    const { rows } = await pool.query(`select 1 from games where slug = $1 and id <> $2 limit 1`, [slug, excludeId]);
    return Boolean(rows[0]);
  } else {
    const { rows } = await pool.query(`select 1 from games where slug = $1 limit 1`, [slug]);
    return Boolean(rows[0]);
  }
}
async function dbListSlugRedirects(): Promise<Array<{ oldSlug: string; gameId: string }>> {
  await ensureSlugRedirectsTable();
  const pool = await getPool();
  const { rows } = await pool.query(`select old_slug, game_id from slug_redirects order by old_slug asc`);
  return (rows as Record<string, unknown>[]).map((r) => ({ oldSlug: String(r.old_slug), gameId: String(r.game_id) }));
}
async function dbDeleteSlugRedirect(oldSlug: string): Promise<boolean> {
  await ensureSlugRedirectsTable();
  const pool = await getPool();
  const res = await pool.query(`delete from slug_redirects where old_slug = $1`, [oldSlug]);
  const any = (res as unknown as { rowCount?: number }).rowCount ?? 0;
  return (any as number) > 0;
}

async function dbEnsureUniqueSlug(candidate: string, excludeId?: string): Promise<string> {
  const base = candidate.trim();
  if (!base) return base;
  if (!(await dbSlugExists(base, excludeId))) return base;
  // Append -2, -3, ... until unique
  const m = base.match(/^(.*?)-(\d+)$/);
  let stem = base;
  let start = 2;
  if (m) {
    stem = m[1];
    start = Number(m[2]) + 1;
  }
  for (let i = start; i < start + 1000; i++) {
    const next = `${stem}-${i}`;
    if (!(await dbSlugExists(next, excludeId))) return next;
  }
  return `${base}-${Date.now()}`; // extreme fallback
}

// ----- Genre Mappings (DB) -----
async function dbListGenreMappings(): Promise<GenreMapping[]> {
  await ensureGenreMappingsTable();
  const pool = await getPool();
  const { rows } = await pool.query(`select id, name, includes, emoji from genre_mappings order by id asc`);
  return (rows as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    name: String(r.name),
    includes: (r.includes as string[] | null) ?? [],
    emoji: (r.emoji as string | null) ?? undefined,
  }));
}

async function dbUpsertGenreMapping(item: GenreMapping): Promise<GenreMapping> {
  await ensureGenreMappingsTable();
  const pool = await getPool();
  const q = `insert into genre_mappings (id, name, includes, emoji)
             values ($1,$2,$3,$4)
             on conflict (id) do update set name = excluded.name, includes = excluded.includes, emoji = excluded.emoji
             returning id, name, includes, emoji`;
  const { rows } = await pool.query(q, [item.id, item.name, item.includes, item.emoji ?? null]);
  const r = rows[0] as Record<string, unknown>;
  return { id: String(r.id), name: String(r.name), includes: (r.includes as string[] | null) ?? [], emoji: (r.emoji as string | null) ?? undefined };
}

async function dbDeleteGenreMapping(id: string): Promise<boolean> {
  await ensureGenreMappingsTable();
  const pool = await getPool();
  const { rows } = await pool.query(`delete from genre_mappings where id = $1 returning id`, [id]);
  return Boolean(rows[0]);
}

// ----- App settings (DB) -----
async function dbGetSetting<T = unknown>(key: string): Promise<T | undefined> {
  await ensureSettingsTable();
  try {
    const pool = await getPool();
    const { rows } = await pool.query(`select value from app_settings where key = $1 limit 1`, [key]);
    if (!rows[0]) return undefined;
    const r = rows[0] as Record<string, unknown>;
    return (r.value as T) ?? undefined;
  } catch {
    return undefined;
  }
}
async function dbSetSetting(key: string, value: unknown): Promise<boolean> {
  await ensureSettingsTable();
  try {
    const pool = await getPool();
    await pool.query(
      `insert into app_settings (key, value) values ($1, $2)
       on conflict (key) do update set value = excluded.value`,
      [key, value]
    );
    return true;
  } catch {
    return false;
  }
}

async function dbGetGame(id: string): Promise<Game | undefined> {
  await ensureGamesTable();
  const pool = await getPool();
  const { rows } = await pool.query(
  `select id, slug, title, featured, genre, platforms, mobile, height, width, rating, released, thumbnail, description, tags, url, updated_at
     from games where id = $1 limit 1`,
    [id]
  );
  return rows[0] ? dbToGame(rows[0] as Record<string, unknown>) : undefined;
}

async function dbGetGameBySlug(slug: string): Promise<Game | undefined> {
  await ensureGamesTable();
  const pool = await getPool();
  const { rows } = await pool.query(
  `select id, slug, title, featured, genre, platforms, mobile, height, width, rating, released, thumbnail, description, tags, url, updated_at
   from games where slug = $1 limit 1`,
    [slug]
  );
  return rows[0] ? dbToGame(rows[0] as Record<string, unknown>) : undefined;
}

function dbToGame(r: Record<string, unknown>): Game {
  return {
    id: String(r.id),
  slug: (r.slug as string | null) ?? undefined,
    title: String(r.title),
    featured: (r.featured as boolean | null) ?? undefined,
    genre: (r.genre as string[] | null) ?? undefined,
    platforms: (r.platforms as string[] | null) ?? undefined,
    mobile: (r.mobile as boolean | null) ?? undefined,
    height: (r.height as number | null) ?? undefined,
    width: (r.width as number | null) ?? undefined,
    rating: (r.rating as number | null) ?? undefined,
    released: (r.released as string | null) ?? undefined,
    thumbnail: (r.thumbnail as string | null) ?? undefined,
    description: (r.description as string | null) ?? undefined,
    tags: (r.tags as string[] | null) ?? undefined,
  url: (r.url as string | null) ?? undefined,
  updatedAt: r.updated_at ? new Date(String(r.updated_at)).toISOString() : undefined,
  };
}

async function dbInsert(game: Game): Promise<Game> {
  await ensureGamesTable();
  const pool = await getPool();
  const q = `insert into games (id, slug, title, featured, genre, platforms, mobile, height, width, rating, released, thumbnail, description, tags, url, updated_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, now())
             on conflict (id) do update set
               slug = excluded.slug,
               title = excluded.title,
               featured = excluded.featured,
               genre = excluded.genre,
               platforms = excluded.platforms,
               mobile = excluded.mobile,
               height = excluded.height,
               width = excluded.width,
               rating = excluded.rating,
               released = excluded.released,
               thumbnail = excluded.thumbnail,
               description = excluded.description,
               tags = excluded.tags,
               url = excluded.url,
               updated_at = now()
             returning id, slug, title, featured, genre, platforms, mobile, height, width, rating, released, thumbnail, description, tags, url, updated_at`;
  const params = [
    game.id,
    game.slug ?? null,
    game.title,
    game.featured ?? null,
    game.genre ?? null,
    game.platforms ?? null,
    game.mobile ?? null,
    game.height ?? null,
    game.width ?? null,
    game.rating ?? null,
    game.released ?? null,
    game.thumbnail ?? null,
    game.description ?? null,
    game.tags ?? null,
    game.url ?? null,
  ];
  const { rows } = await pool.query(q, params);
  return dbToGame(rows[0] as Record<string, unknown>);
}

async function dbUpdate(id: string, patch: Partial<Game>): Promise<Game | undefined> {
  await ensureGamesTable();
  const pool = await getPool();
  // Build dynamic update set
  const fields: [keyof Game, unknown][] = Object.entries(patch).map(([k, v]) => [k as keyof Game, v]);
  if (fields.length === 0) return await dbGetGame(id);
  const cols: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  for (const [k, v] of fields) {
    cols.push(`${k} = $${i++}`);
    params.push(v ?? null);
  }
  params.push(id);
  cols.push(`updated_at = now()`);
  const q = `update games set ${cols.join(", ")} where id = $${i} returning id, slug, title, featured, genre, platforms, mobile, height, width, rating, released, thumbnail, description, tags, url, updated_at`;
  const { rows } = await pool.query(q, params);
  return rows[0] ? dbToGame(rows[0] as Record<string, unknown>) : undefined;
}

async function dbDelete(id: string): Promise<Game | undefined> {
  await ensureGamesTable();
  const pool = await getPool();
  const { rows } = await pool.query(
  `delete from games where id = $1 returning id, slug, title, featured, genre, platforms, mobile, height, width, rating, released, thumbnail, description, tags, url, updated_at`,
    [id]
  );
  return rows[0] ? dbToGame(rows[0] as Record<string, unknown>) : undefined;
}

async function dbUpsertMany(items: Game[]): Promise<number> {
  if (items.length === 0) return 0;
  await ensureGamesTable();
  const pool = await getPool();
  const q = `insert into games (id, slug, title, featured, genre, platforms, mobile, height, width, rating, released, thumbnail, description, tags, url, updated_at)
             values ${items.map((_, i) => `(${paramPlaceholders(16, i * 16)})`).join(",")}
             on conflict (id) do update set
               slug = excluded.slug,
               title = excluded.title,
               featured = excluded.featured,
               genre = excluded.genre,
               platforms = excluded.platforms,
               mobile = excluded.mobile,
               height = excluded.height,
               width = excluded.width,
               rating = excluded.rating,
               released = excluded.released,
               thumbnail = excluded.thumbnail,
               description = excluded.description,
               tags = excluded.tags,
               url = excluded.url,
               updated_at = now()`;
  const params = items.flatMap((g) => [
    g.id,
    g.slug ?? null,
    g.title,
    g.featured ?? null,
    g.genre ?? null,
    g.platforms ?? null,
    g.mobile ?? null,
    g.height ?? null,
    g.width ?? null,
    g.rating ?? null,
    g.released ?? null,
    g.thumbnail ?? null,
    g.description ?? null,
    g.tags ?? null,
    g.url ?? null,
    new Date().toISOString(),
  ]);
  await pool.query(q, params);
  return items.length;
}

// Delete all games (DB)
async function dbDeleteAll(): Promise<number> {
  await ensureGamesTable();
  const pool = await getPool();
  // Use CTE to get affected row count in a single round trip
  const q = `with deleted as (delete from games returning 1) select count(*)::int as count from deleted`;
  const { rows } = await pool.query(q);
  const r = (rows[0] as Record<string, unknown>) || {};
  const n = typeof r.count === "number" ? (r.count as number) : Number(r.count ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function paramPlaceholders(n: number, offset = 0) {
  return Array.from({ length: n }, (_, i) => `$${i + 1 + offset}`).join(",");
}

// ---------- FS IMPLEMENTATION ----------
import { promises as fs } from "fs";
import path from "path";
const dataPath = path.join(process.cwd(), "src", "data", "games.json");
const mappingsPath = path.join(process.cwd(), "src", "data", "genreMappings.json");
const settingsPath = path.join(process.cwd(), "src", "data", "settings.json");
const redirectsPath = path.join(process.cwd(), "src", "data", "slugRedirects.json");

async function fsRead(): Promise<Game[]> {
  const raw = await fs.readFile(dataPath, "utf8");
  try {
    const json = JSON.parse(raw);
    return Array.isArray(json) ? (json as Game[]) : [];
  } catch {
    return [];
  }
}
async function fsWrite(list: Game[]) {
  const json = JSON.stringify(list, null, 2) + "\n";
  const tmpPath = dataPath + ".tmp";
  await fs.writeFile(tmpPath, json, "utf8");
  await fs.rename(tmpPath, dataPath);
}

async function fsReadRedirects(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(redirectsPath, "utf8");
    const json = JSON.parse(raw);
    return (json && typeof json === "object") ? (json as Record<string, string>) : {};
  } catch {
    return {};
  }
}
async function fsWriteRedirects(map: Record<string, string>) {
  const json = JSON.stringify(map, null, 2) + "\n";
  const tmpPath = redirectsPath + ".tmp";
  await fs.writeFile(tmpPath, json, "utf8");
  await fs.rename(tmpPath, redirectsPath);
}
async function fsListSlugRedirects(): Promise<Array<{ oldSlug: string; gameId: string }>> {
  const map = await fsReadRedirects();
  return Object.entries(map)
    .map(([oldSlug, gameId]) => ({ oldSlug, gameId }))
    .sort((a, b) => a.oldSlug.localeCompare(b.oldSlug));
}
async function fsDeleteSlugRedirect(oldSlug: string): Promise<boolean> {
  const map = await fsReadRedirects();
  if (!(oldSlug in map)) return false;
  delete map[oldSlug];
  await fsWriteRedirects(map);
  return true;
}

async function fsSlugExists(slug: string, excludeId?: string): Promise<boolean> {
  const list = await fsRead();
  return list.some((g) => g.slug === slug && (!excludeId || g.id !== excludeId));
}
async function fsEnsureUniqueSlug(candidate: string, excludeId?: string): Promise<string> {
  const base = candidate.trim();
  if (!base) return base;
  if (!(await fsSlugExists(base, excludeId))) return base;
  const m = base.match(/^(.*?)-(\d+)$/);
  let stem = base;
  let start = 2;
  if (m) {
    stem = m[1];
    start = Number(m[2]) + 1;
  }
  for (let i = start; i < start + 1000; i++) {
    const next = `${stem}-${i}`;
    if (!(await fsSlugExists(next, excludeId))) return next;
  }
  return `${base}-${Date.now()}`;
}

async function fsReadMappings(): Promise<GenreMapping[]> {
  try {
    const raw = await fs.readFile(mappingsPath, "utf8");
    const json = JSON.parse(raw);
  if (!Array.isArray(json)) return [];
  // Ensure emoji is undefined when missing
  return (json as GenreMapping[]).map((m) => ({ ...m, emoji: m.emoji ?? undefined }));
  } catch {
    return [];
  }
}
async function fsWriteMappings(list: GenreMapping[]) {
  const json = JSON.stringify(list, null, 2) + "\n";
  const tmpPath = mappingsPath + ".tmp";
  await fs.writeFile(tmpPath, json, "utf8");
  await fs.rename(tmpPath, mappingsPath);
}

// App settings (FS)
async function fsReadSettings(): Promise<Record<string, unknown>> {
  try {
    const raw = await fs.readFile(settingsPath, "utf8");
    const json = JSON.parse(raw);
    return (json && typeof json === "object") ? (json as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
async function fsWriteSettings(obj: Record<string, unknown>) {
  const json = JSON.stringify(obj, null, 2) + "\n";
  const tmpPath = settingsPath + ".tmp";
  await fs.writeFile(tmpPath, json, "utf8");
  await fs.rename(tmpPath, settingsPath);
}

// ---------- PUBLIC API ----------
export const storage = {
  usingDb(): boolean {
    return useDb;
  },
  async listGames(): Promise<Game[]> {
    return useDb ? dbListGames() : fsRead();
  },
  async getGameById(id: string): Promise<Game | undefined> {
    if (useDb) {
      // Try id, then slug for flexibility
      const byId = await dbGetGame(id);
      if (byId) return byId;
      return dbGetGameBySlug(id);
    } else {
      const list = await fsRead();
      return list.find((g) => g.id === id || g.slug === id);
    }
  },
  async addGame(game: Game): Promise<Game> {
    // ensure slug uniqueness
    if (game.slug && game.slug.trim()) {
      const unique = useDb ? await dbEnsureUniqueSlug(game.slug) : await fsEnsureUniqueSlug(game.slug);
      game = { ...game, slug: unique };
    }
    if (useDb) return dbInsert(game);
    const list = await fsRead();
    list.push(game);
    await fsWrite(list);
    return game;
  },
  async updateGame(id: string, patch: Partial<Game>): Promise<Game | undefined> {
    // apply unique slug and record redirect if slug changed
    if (patch.slug && patch.slug.trim()) {
      const unique = useDb ? await dbEnsureUniqueSlug(patch.slug, id) : await fsEnsureUniqueSlug(patch.slug, id);
      if (unique !== patch.slug) patch.slug = unique;
    }
    if (useDb) {
      // capture old slug
      const current = await dbGetGame(id);
      const oldSlug = current?.slug;
      const updated = await dbUpdate(id, patch);
      if (updated && oldSlug && updated.slug && oldSlug !== updated.slug) {
        await dbAddSlugRedirect(oldSlug, id);
      }
      return updated;
    }
    const list = await fsRead();
    const idx = list.findIndex((g) => g.id === id);
    if (idx === -1) return undefined;
    const current = list[idx];
    const oldSlug = current.slug;
    const next: Game = { ...current, ...patch, id: current.id } as Game;
    list[idx] = next;
    await fsWrite(list);
    if (oldSlug && next.slug && oldSlug !== next.slug) {
      const map = await fsReadRedirects();
      map[oldSlug] = id;
      await fsWriteRedirects(map);
    }
    return next;
  },
  async deleteGame(id: string): Promise<Game | undefined> {
    if (useDb) return dbDelete(id);
    const list = await fsRead();
    const idx = list.findIndex((g) => g.id === id);
    if (idx === -1) return undefined;
    const [removed] = list.splice(idx, 1);
    await fsWrite(list);
    return removed;
  },
  async upsertMany(items: Game[]): Promise<number> {
    if (useDb) return dbUpsertMany(items);
    const list = await fsRead();
    const byId = new Map<string, Game>(list.map((g) => [g.id, g]));
    for (const g of items) byId.set(g.id, g);
    const merged = Array.from(byId.values());
    await fsWrite(merged);
    return items.length;
  },
  async deleteAllGames(): Promise<number> {
    if (useDb) return dbDeleteAll();
    const before = await fsRead();
    await fsWrite([]);
    return before.length;
  },
  // Genre mappings
  async listGenreMappings(): Promise<GenreMapping[]> {
    return useDb ? dbListGenreMappings() : fsReadMappings();
  },
  async upsertGenreMapping(item: GenreMapping): Promise<GenreMapping> {
    return useDb ? dbUpsertGenreMapping(item) : (await (async () => {
      const list = await fsReadMappings();
      const idx = list.findIndex((m) => m.id === item.id);
      if (idx === -1) list.push(item); else list[idx] = item;
      await fsWriteMappings(list);
      return item;
    })());
  },
  async deleteGenreMapping(id: string): Promise<boolean> {
    if (useDb) return dbDeleteGenreMapping(id);
    const list = await fsReadMappings();
    const idx = list.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    list.splice(idx, 1);
    await fsWriteMappings(list);
    return true;
  },
  // App settings
  async getSetting<T = unknown>(key: string): Promise<T | undefined> {
    if (useDb) return dbGetSetting<T>(key);
    const all = await fsReadSettings();
    return (all[key] as T) ?? undefined;
  },
  async setSetting(key: string, value: unknown): Promise<boolean> {
    if (useDb) return dbSetSetting(key, value);
    const all = await fsReadSettings();
    all[key] = value;
    await fsWriteSettings(all);
    return true;
  },
  // Redirect helpers
  async addSlugRedirect(oldSlug: string, gameId: string): Promise<boolean> {
    if (!oldSlug || !gameId) return false;
    if (useDb) return dbAddSlugRedirect(oldSlug, gameId);
    const map = await fsReadRedirects();
    map[oldSlug] = gameId;
    await fsWriteRedirects(map);
    return true;
  },
  async getGameIdByOldSlug(oldSlug: string): Promise<string | undefined> {
    if (useDb) return dbGetGameIdByOldSlug(oldSlug);
    const map = await fsReadRedirects();
    return map[oldSlug];
  },
  async listSlugRedirects(): Promise<Array<{ oldSlug: string; gameId: string }>> {
    if (useDb) return dbListSlugRedirects();
    return fsListSlugRedirects();
  },
  async deleteSlugRedirect(oldSlug: string): Promise<boolean> {
    if (useDb) return dbDeleteSlugRedirect(oldSlug);
    return fsDeleteSlugRedirect(oldSlug);
  },
};
