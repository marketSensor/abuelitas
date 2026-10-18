import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const families=sqliteTable('families',{id:text('id').primaryKey(),name:text('name').notNull(),owner:text('owner').notNull(),invite:text('invite').notNull().unique()});
export const members=sqliteTable('members',{id:text('id').primaryKey(),family:text('family').notNull(),user:text('user').notNull(),name:text('name').notNull()});
export const recipes=sqliteTable('recipes',{id:text('id').primaryKey(),family:text('family').notNull(),creator:text('creator').notNull(),data:text('data').notNull(),created:text('created').notNull()});
export const lists=sqliteTable('lists',{family:text('family').primaryKey(),data:text('data').notNull()});
