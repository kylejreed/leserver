import { and, eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

export class SqliteRepo<TSelect, TInsert, TUpdate, TUnique extends Partial<Record<keyof TSelect, any>>> {
  constructor(
    public db: BunSQLiteDatabase<any>,
    public schema: any,
  ) {}

  async getAll() {
    return this.db.select().from(this.schema).all() as TSelect[];
  }

  async findOne(where: TUnique) {
    return (
      await this.db
        .select()
        .from(this.schema)
        .where(and(...this.toWhere(where)))
    )[0] as TSelect;
  }

  async where(w: Partial<TSelect>): Promise<TSelect[]> {
    return (await this.db
      .select()
      .from(this.schema)
      .where(and(...this.toWhere(w)))) as TSelect[];
  }

  async exists(where: TUnique) {
    return !!(await this.findOne(where));
  }

  create(data: TInsert): Promise<void>;
  create(data: TInsert, returning?: boolean): Promise<TSelect>;
  async create(data: TInsert, returning?: boolean): Promise<void | TSelect> {
    const query = this.db.insert(this.schema).values(data as any);
    if (returning) {
      return (await query.returning()) as TSelect;
    }

    await query.execute();
  }

  async update(where: TUnique, data: TUpdate): Promise<void>;
  async update(where: TUnique, data: TUpdate, returning?: boolean): Promise<TSelect>;
  async update(where: TUnique, data: TUpdate, returning?: boolean): Promise<void | TSelect> {
    const query = this.db
      .update(this.schema)
      .set(data as any)
      .where(and(...this.toWhere(where)));

    if (returning) {
      return (await query.returning()) as TSelect;
    }

    await query.execute();
  }

  async delete(where: TUnique) {
    await this.db.delete(this.schema).where(and(...this.toWhere(where)));
  }

  async clear() {
    await this.db.delete(this.schema);
  }

  protected toWhere(where: Partial<TSelect>) {
    return Object.entries(where).map(([k, v]) => eq(this.schema[k], v));
  }
}
