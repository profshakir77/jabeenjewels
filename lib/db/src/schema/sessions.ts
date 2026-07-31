import { pgTable, varchar, json, timestamp, index } from "drizzle-orm/pg-core";

export const sessionsTable = pgTable("sessions", {
  sid: varchar("sid").primaryKey().notNull(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
}, (table) => ({
  expireIdx: index("IDX_session_expire").on(table.expire),
}));