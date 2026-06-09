export type TxType = "expense" | "income";
export type TxSource = "manual" | "siri" | "screenshot";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  type: TxType;
  sort_order: number;
  archived: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TxType;
  category_id: string | null;
  note: string | null;
  occurred_at: string;
  source: TxSource;
  created_at: string;
}

/** A transaction joined with its category, as returned to the UI. */
export interface TransactionWithCategory extends Transaction {
  category: Pick<Category, "id" | "name" | "emoji"> | null;
}

export interface Profile {
  id: string;
  currency: string;
  siri_token: string;
  language: string;
  created_at: string;
}

/** A single parsed line from an Apple Pay screenshot. */
export interface ParsedExpense {
  merchant: string;
  amount: number;
  /** ISO date (YYYY-MM-DD) or null when not detected. */
  date: string | null;
}
