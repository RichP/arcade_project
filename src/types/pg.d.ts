declare module "pg" {
  export class Pool {
    constructor(cfg?: { connectionString?: string });
    query(sql: string, params?: unknown[]): Promise<{ rows: unknown[] }>;
    end(): Promise<void>;
  }
  const _default: { Pool: typeof Pool };
  export default _default;
}
