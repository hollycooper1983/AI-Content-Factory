-- BookNoble schema
-- Every business-owned table is protected by Row Level Security so an owner
-- can only ever read or write their own records. Customers on the public
-- booking page never touch tables directly: they call the SECURITY DEFINER
-- functions at the bottom, which expose only what booking requires.

create extension if not exists btree_gist;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$'),
  industry text not null default 'other'
    check (industry in ('hair', 'nails', 'detailing', 'housekeeping', 'events', 'other')),
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  about text not null default '' check (char_length(about) <= 1000),
  timezone text not null default 'America/New_York',
  currency text not null default 'USD',
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro')),
  buffer_minutes int not null default 0 check (buffer_minutes between 0 and 240),
  min_notice_minutes int not null default 120 check (min_notice_minutes between 0 and 20160),
  max_advance_days int not null default 60 check (max_advance_days between 1 and 365),
  slot_step_minutes int not null default 30 check (slot_step_minutes between 5 and 240),
  cancel_window_hours int not null default 24 check (cancel_window_hours between 0 and 336),
  deposits_enabled boolean not null default false,
  booking_page_enabled boolean not null default true,
  -- Stripe Connect account that receives this business's customer payments.
  stripe_account_id text,
  created_at timestamptz not null default now()
);
create unique index businesses_one_per_owner on public.businesses (owner_id);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '',
  duration_minutes int not null check (duration_minutes between 5 and 1440),
  price_cents int not null default 0 check (price_cents >= 0),
  deposit_cents int not null default 0 check (deposit_cents >= 0),
  active boolean not null default true,
  sort_order int not null default 0
);
create index on public.services (business_id);

create table public.weekly_hours (
  business_id uuid not null references public.businesses (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  open boolean not null default false,
  -- [{ "start": 540, "end": 1020 }], minutes after local midnight
  ranges jsonb not null default '[]',
  breaks jsonb not null default '[]',
  primary key (business_id, weekday)
);

create table public.time_off (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  label text not null default '',
  check (end_date >= start_date)
);
create index on public.time_off (business_id);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  phone text not null default '',
  email text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index on public.clients (business_id);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  service_id uuid not null references public.services (id),
  client_id uuid not null references public.clients (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  -- ends_at plus the business buffer; maintained by trigger.
  blocked_until timestamptz not null,
  status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  source text not null default 'owner' check (source in ('owner', 'booking_page')),
  price_cents int not null default 0,
  deposit_cents int not null default 0,
  deposit_status text not null default 'none' check (deposit_status in ('none', 'due', 'paid', 'refunded')),
  notes text not null default '',
  manage_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  -- The double-booking guarantee: no two active appointments of one business
  -- may overlap, buffers included. Enforced atomically by Postgres.
  constraint appointments_no_overlap exclude using gist (
    business_id with =,
    tstzrange(starts_at, blocked_until, '[)') with &&
  ) where (status in ('pending', 'confirmed'))
);
create index on public.appointments (business_id, starts_at);
create index on public.appointments (client_id);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  number text not null,
  -- [{ "description": "...", "quantity": 1, "unitCents": 5000 }]
  lines jsonb not null default '[]',
  tax_rate_bps int not null default 0 check (tax_rate_bps between 0 and 5000),
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'void')),
  due_date date not null default current_date,
  notes text not null default '',
  payment_url text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  unique (business_id, number)
);

create table public.reminder_settings (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  enabled boolean not null default true,
  channels text[] not null default '{email}',
  offsets_hours int[] not null default '{24}',
  template text not null default 'Hi {client}, this is a reminder of your {service} with {business} on {when}. Need to change it? {manage_link}'
);

-- Sent reminders, so the scheduled sender never double-sends.
create table public.reminder_log (
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  offset_hours int not null,
  channel text not null,
  sent_at timestamptz not null default now(),
  primary key (appointment_id, offset_hours, channel)
);

-- Web data-deletion requests from people who no longer have the app.
create table public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 254),
  details text not null default '' check (char_length(details) <= 2000),
  status text not null default 'received' check (status in ('received', 'completed', 'rejected')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Server-authoritative end time and buffer; also enforces the Free plan cap.
create or replace function public.appointments_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_duration int;
  v_buffer int;
  v_plan text;
  v_upcoming int;
begin
  if tg_op = 'INSERT' or new.starts_at is distinct from old.starts_at or new.service_id is distinct from old.service_id then
    select duration_minutes into v_duration from services where id = new.service_id and business_id = new.business_id;
    if v_duration is null then
      raise exception 'SERVICE_NOT_FOUND';
    end if;
    new.ends_at := new.starts_at + make_interval(mins => v_duration);
  end if;
  select buffer_minutes, plan into v_buffer, v_plan from businesses where id = new.business_id;
  new.blocked_until := new.ends_at + make_interval(mins => v_buffer);

  if tg_op = 'INSERT' and v_plan = 'free' then
    select count(*) into v_upcoming from appointments
      where business_id = new.business_id and status in ('pending', 'confirmed') and starts_at >= now();
    if v_upcoming >= 30 then
      raise exception 'PLAN_LIMIT';
    end if;
  end if;
  return new;
end $$;

create trigger appointments_before_write
  before insert or update on public.appointments
  for each row execute function public.appointments_before_write();

-- New businesses get default hours and reminder settings.
create or replace function public.businesses_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into weekly_hours (business_id, weekday, open, ranges, breaks)
  select new.id, d,
    d <> 0,
    case when d = 0 then '[]'::jsonb
         when d = 6 then '[{"start":600,"end":900}]'::jsonb
         else '[{"start":540,"end":1020}]'::jsonb end,
    case when d between 1 and 5 then '[{"start":720,"end":780}]'::jsonb else '[]'::jsonb end
  from generate_series(0, 6) d;
  insert into reminder_settings (business_id) values (new.id);
  return new;
end $$;

create trigger businesses_after_insert
  after insert on public.businesses
  for each row execute function public.businesses_after_insert();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

create or replace function public.owns_business(p_business_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from businesses where id = p_business_id and owner_id = auth.uid());
$$;

alter table public.businesses enable row level security;
alter table public.services enable row level security;
alter table public.weekly_hours enable row level security;
alter table public.time_off enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.invoices enable row level security;
alter table public.reminder_settings enable row level security;
alter table public.reminder_log enable row level security;
alter table public.deletion_requests enable row level security;

create policy "owner reads business" on public.businesses for select to authenticated using (owner_id = auth.uid());
create policy "owner creates business" on public.businesses for insert to authenticated with check (owner_id = auth.uid() and plan = 'free');
create policy "owner updates business" on public.businesses for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner deletes business" on public.businesses for delete to authenticated using (owner_id = auth.uid());

-- Owners may not grant themselves a plan or payout account; only server code
-- (service role, e.g. the billing webhook) changes these columns.
revoke update on public.businesses from authenticated;
grant update (name, slug, industry, phone, email, address, about, timezone, currency, buffer_minutes,
  min_notice_minutes, max_advance_days, slot_step_minutes, cancel_window_hours, deposits_enabled,
  booking_page_enabled) on public.businesses to authenticated;

do $$
declare t text;
begin
  foreach t in array array['services', 'weekly_hours', 'time_off', 'clients', 'appointments', 'invoices', 'reminder_settings'] loop
    execute format('create policy "owner all" on public.%I for all to authenticated using (public.owns_business(business_id)) with check (public.owns_business(business_id))', t);
  end loop;
end $$;

create policy "owner reads reminder log" on public.reminder_log for select to authenticated
  using (exists (select 1 from appointments a where a.id = appointment_id and public.owns_business(a.business_id)));

-- Anyone may file a deletion request; nobody but the service role can read them.
create policy "anyone files deletion request" on public.deletion_requests for insert to anon, authenticated with check (true);

-- ---------------------------------------------------------------------------
-- Public booking API (callable without sign-in)
-- ---------------------------------------------------------------------------

create or replace function public.get_public_business(p_slug text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'business', jsonb_build_object(
      'id', b.id, 'name', b.name, 'slug', b.slug, 'industry', b.industry, 'about', b.about,
      'address', b.address, 'timezone', b.timezone, 'currency', b.currency,
      'bufferMinutes', b.buffer_minutes, 'minNoticeMinutes', b.min_notice_minutes,
      'maxAdvanceDays', b.max_advance_days, 'slotStepMinutes', b.slot_step_minutes,
      'cancelWindowHours', b.cancel_window_hours,
      'depositsEnabled', b.deposits_enabled and b.stripe_account_id is not null),
    'services', coalesce((select jsonb_agg(jsonb_build_object(
        'id', s.id, 'businessId', s.business_id, 'name', s.name, 'description', s.description,
        'durationMinutes', s.duration_minutes, 'priceCents', s.price_cents,
        'depositCents', s.deposit_cents, 'active', s.active, 'sortOrder', s.sort_order) order by s.sort_order)
      from services s where s.business_id = b.id and s.active), '[]'::jsonb),
    'availability', jsonb_build_object(
      'weekly', coalesce((select jsonb_agg(jsonb_build_object('weekday', w.weekday, 'open', w.open,
        'ranges', w.ranges, 'breaks', w.breaks) order by w.weekday) from weekly_hours w where w.business_id = b.id), '[]'::jsonb),
      'timeOff', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'businessId', t.business_id,
        'startDate', t.start_date, 'endDate', t.end_date, 'label', '') order by t.start_date)
        from time_off t where t.business_id = b.id and t.end_date >= current_date - 1), '[]'::jsonb))
  )
  from businesses b where b.slug = p_slug and b.booking_page_enabled;
$$;

-- Times only: who booked and what they booked stays private.
create or replace function public.get_busy_intervals(p_slug text, p_from timestamptz, p_to timestamptz)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.starts_at, a.ends_at
  from appointments a join businesses b on b.id = a.business_id
  where b.slug = p_slug and b.booking_page_enabled
    and a.status in ('pending', 'confirmed')
    and a.ends_at > p_from and a.starts_at < p_to
    and p_to - p_from <= interval '120 days'
  order by a.starts_at;
$$;

-- Business-hours rules for a proposed customer booking. Overlaps are left to
-- the exclusion constraint, which also covers concurrent requests.
create or replace function public.assert_bookable(p_business_id uuid, p_start timestamptz, p_minutes int)
returns void language plpgsql stable security definer set search_path = public as $$
declare
  b businesses%rowtype;
  v_local timestamp;
  v_date date;
  v_start int;
  v_end int;
  w weekly_hours%rowtype;
  r jsonb;
  v_fits boolean := false;
begin
  select * into b from businesses where id = p_business_id;
  if p_start < now() + make_interval(mins => b.min_notice_minutes) then
    raise exception 'TOO_SOON';
  end if;
  v_local := p_start at time zone b.timezone;
  v_date := v_local::date;
  if v_date > (now() at time zone b.timezone)::date + b.max_advance_days then
    raise exception 'TOO_FAR';
  end if;
  if exists (select 1 from time_off t where t.business_id = b.id and v_date between t.start_date and t.end_date) then
    raise exception 'OUTSIDE_HOURS';
  end if;
  v_start := extract(hour from v_local)::int * 60 + extract(minute from v_local)::int;
  v_end := v_start + p_minutes;
  select * into w from weekly_hours where business_id = b.id and weekday = extract(dow from v_local)::int;
  if not found or not w.open then
    raise exception 'OUTSIDE_HOURS';
  end if;
  for r in select * from jsonb_array_elements(w.ranges) loop
    if v_start >= (r->>'start')::int and v_end <= (r->>'end')::int then v_fits := true; end if;
  end loop;
  for r in select * from jsonb_array_elements(w.breaks) loop
    if v_start < (r->>'end')::int and (r->>'start')::int < v_end then v_fits := false; end if;
  end loop;
  if not v_fits then
    raise exception 'OUTSIDE_HOURS';
  end if;
end $$;

create or replace function public.create_public_booking(
  p_slug text, p_service_id uuid, p_starts_at timestamptz,
  p_name text, p_phone text, p_email text, p_notes text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  b businesses%rowtype;
  s services%rowtype;
  v_client uuid;
  v_deposit int;
  a appointments%rowtype;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_phone text := trim(coalesce(p_phone, ''));
begin
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 120
     or char_length(v_email) > 254 or char_length(v_phone) > 40 or char_length(coalesce(p_notes, '')) > 1000
     or (v_email = '' and v_phone = '') then
    raise exception 'INVALID_DETAILS';
  end if;
  select * into b from businesses where slug = p_slug and booking_page_enabled;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into s from services where id = p_service_id and business_id = b.id and active;
  if not found then raise exception 'SERVICE_NOT_FOUND'; end if;

  perform assert_bookable(b.id, p_starts_at, s.duration_minutes);

  select id into v_client from clients
    where business_id = b.id and ((v_email <> '' and email = v_email) or (v_phone <> '' and phone = v_phone))
    limit 1;
  if v_client is null then
    insert into clients (business_id, name, phone, email) values (b.id, trim(p_name), v_phone, v_email)
    returning id into v_client;
  end if;

  v_deposit := case when b.deposits_enabled and b.stripe_account_id is not null then s.deposit_cents else 0 end;
  begin
    insert into appointments (business_id, service_id, client_id, starts_at, ends_at, blocked_until, status, source,
      price_cents, deposit_cents, deposit_status, notes)
    values (b.id, s.id, v_client, p_starts_at, p_starts_at, p_starts_at, 'confirmed', 'booking_page',
      s.price_cents, v_deposit, case when v_deposit > 0 then 'due' else 'none' end, coalesce(p_notes, ''))
    returning * into a;
  exception when exclusion_violation then
    raise exception 'SLOT_TAKEN';
  end;

  return jsonb_build_object('appointmentId', a.id, 'manageToken', a.manage_token,
    'startsAt', a.starts_at, 'endsAt', a.ends_at, 'depositCents', a.deposit_cents, 'checkoutUrl', null);
end $$;

create or replace function public.get_managed_booking(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'appointment', jsonb_build_object('id', a.id, 'startsAt', a.starts_at, 'endsAt', a.ends_at,
      'status', a.status, 'depositCents', a.deposit_cents, 'depositStatus', a.deposit_status),
    'serviceId', s.id, 'serviceName', s.name, 'businessName', b.name, 'slug', b.slug,
    'cancelWindowHours', b.cancel_window_hours)
  from appointments a join services s on s.id = a.service_id join businesses b on b.id = a.business_id
  where a.manage_token = p_token and char_length(p_token) >= 32;
$$;

create or replace function public.cancel_managed_booking(p_token text) returns void
language plpgsql security definer set search_path = public as $$
declare a appointments%rowtype; v_window int;
begin
  select * into a from appointments where manage_token = p_token and char_length(p_token) >= 32 for update;
  if not found or a.status not in ('pending', 'confirmed') then raise exception 'NOT_CHANGEABLE'; end if;
  select cancel_window_hours into v_window from businesses where id = a.business_id;
  if a.starts_at - now() < make_interval(hours => v_window) then raise exception 'TOO_LATE'; end if;
  update appointments set status = 'cancelled' where id = a.id;
end $$;

create or replace function public.reschedule_managed_booking(p_token text, p_starts_at timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare a appointments%rowtype; v_window int; v_minutes int;
begin
  select * into a from appointments where manage_token = p_token and char_length(p_token) >= 32 for update;
  if not found or a.status not in ('pending', 'confirmed') then raise exception 'NOT_CHANGEABLE'; end if;
  select cancel_window_hours into v_window from businesses where id = a.business_id;
  if a.starts_at - now() < make_interval(hours => v_window) then raise exception 'TOO_LATE'; end if;
  select duration_minutes into v_minutes from services where id = a.service_id;
  perform assert_bookable(a.business_id, p_starts_at, v_minutes);
  begin
    update appointments set starts_at = p_starts_at where id = a.id;
  exception when exclusion_violation then
    raise exception 'SLOT_TAKEN';
  end;
end $$;

revoke all on function public.assert_bookable(uuid, timestamptz, int) from public, anon, authenticated;
revoke all on function public.appointments_before_write() from public, anon, authenticated;
revoke all on function public.businesses_after_insert() from public, anon, authenticated;
grant execute on function public.get_public_business(text) to anon, authenticated;
grant execute on function public.get_busy_intervals(text, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.create_public_booking(text, uuid, timestamptz, text, text, text, text) to anon, authenticated;
grant execute on function public.get_managed_booking(text) to anon, authenticated;
grant execute on function public.cancel_managed_booking(text) to anon, authenticated;
grant execute on function public.reschedule_managed_booking(text, timestamptz) to anon, authenticated;
