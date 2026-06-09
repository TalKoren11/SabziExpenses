-- SabziExpenses initial schema: profiles, categories, transactions + RLS + signup seed.

create extension if not exists pgcrypto;

-- Enums --------------------------------------------------------------------
do $$ begin
  create type tx_type as enum ('expense', 'income');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type tx_source as enum ('manual', 'siri', 'screenshot');
exception when duplicate_object then null;
end $$;

-- profiles -----------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  currency text not null default 'ILS',
  siri_token text not null unique,
  created_at timestamptz not null default now()
);

-- categories ---------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  emoji text not null default '🏷️',
  type tx_type not null default 'expense',
  sort_order int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists categories_user_idx on public.categories (user_id, type, sort_order);

-- transactions -------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  type tx_type not null,
  category_id uuid references public.categories (id) on delete set null,
  note text,
  occurred_at timestamptz not null default now(),
  source tx_source not null default 'manual',
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_time_idx on public.transactions (user_id, occurred_at desc);

-- Row Level Security -------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own categories" on public.categories;
create policy "own categories" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own transactions" on public.transactions;
create policy "own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Seed defaults on signup --------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, siri_token)
  values (
    new.id,
    replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
  );

  insert into public.categories (user_id, name, emoji, type, sort_order) values
    (new.id, 'Food & Groceries', '🍔', 'expense', 0),
    (new.id, 'Eating out',       '🍴', 'expense', 1),
    (new.id, 'Transport',        '🚗', 'expense', 2),
    (new.id, 'Shopping',         '🛒', 'expense', 3),
    (new.id, 'Bills',            '🧾', 'expense', 4),
    (new.id, 'Fun',              '🎉', 'expense', 5),
    (new.id, 'Health',           '💊', 'expense', 6),
    (new.id, 'Other',            '➕', 'expense', 7),
    (new.id, 'Salary',           '💼', 'income',  0),
    (new.id, 'Other income',     '➕', 'income',  1);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
