-- Accounts (e.g. bank accounts, cash, credit cards) and a default account per user.

-- accounts -------------------------------------------------------------------
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  emoji text not null default '💳',
  is_default boolean not null default false,
  sort_order int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists accounts_user_idx on public.accounts (user_id, sort_order);

-- Only one default account per user.
create unique index if not exists accounts_one_default_per_user
  on public.accounts (user_id) where is_default;

alter table public.transactions
  add column if not exists account_id uuid references public.accounts (id) on delete set null;

alter table public.accounts enable row level security;

drop policy if exists "own accounts" on public.accounts;
create policy "own accounts" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Seed a default "Cash" account for existing users that don't have one yet.
insert into public.accounts (user_id, name, emoji, is_default, sort_order)
select u.id, 'מזומן', '💵', true, 0
from auth.users u
where not exists (
  select 1 from public.accounts a where a.user_id = u.id
);

-- Point existing transactions at each user's default account.
update public.transactions t
set account_id = a.id
from public.accounts a
where a.user_id = t.user_id and a.is_default and t.account_id is null;

-- Seed defaults on signup (accounts) ------------------------------------------
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
    (new.id, 'מצרכים',      '🍔', 'expense', 0),
    (new.id, 'אוכל בחוץ',   '🍴', 'expense', 1),
    (new.id, 'תחבורה',      '🚗', 'expense', 2),
    (new.id, 'קניות',       '🛒', 'expense', 3),
    (new.id, 'חשבונות',     '🧾', 'expense', 4),
    (new.id, 'בילויים',     '🎉', 'expense', 5),
    (new.id, 'בריאות',      '💊', 'expense', 6),
    (new.id, 'אחר',         '➕', 'expense', 7),
    (new.id, 'דלק',         '⛽', 'expense', 8),
    (new.id, 'משכורת',      '💼', 'income',  0),
    (new.id, 'הכנסה נוספת', '➕', 'income',  1);

  insert into public.accounts (user_id, name, emoji, is_default, sort_order) values
    (new.id, 'מזומן', '💵', true, 0);

  return new;
end;
$$;
