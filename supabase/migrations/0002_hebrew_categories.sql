-- Translate default category names to Hebrew, for new and existing users.

-- Translate existing rows that still have the original English default names.
update public.categories set name = 'מצרכים'      where name = 'Food & Groceries' and type = 'expense';
update public.categories set name = 'אוכל בחוץ'   where name = 'Eating out'       and type = 'expense';
update public.categories set name = 'תחבורה'      where name = 'Transport'        and type = 'expense';
update public.categories set name = 'קניות'       where name = 'Shopping'         and type = 'expense';
update public.categories set name = 'חשבונות'     where name = 'Bills'            and type = 'expense';
update public.categories set name = 'בילויים'     where name = 'Fun'              and type = 'expense';
update public.categories set name = 'בריאות'      where name = 'Health'           and type = 'expense';
update public.categories set name = 'אחר'         where name = 'Other'            and type = 'expense';
update public.categories set name = 'משכורת'      where name = 'Salary'           and type = 'income';
update public.categories set name = 'הכנסה נוספת' where name = 'Other income'     and type = 'income';

-- Add a "Fuel" expense category for existing users that don't already have one.
insert into public.categories (user_id, name, emoji, type, sort_order)
select u.id, 'דלק', '⛽', 'expense', 8
from auth.users u
where not exists (
  select 1 from public.categories c
  where c.user_id = u.id and c.name = 'דלק' and c.type = 'expense'
);

-- Seed defaults on signup (Hebrew names) -----------------------------------
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

  return new;
end;
$$;
