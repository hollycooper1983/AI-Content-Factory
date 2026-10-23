-- NextStep Network schema (mirrors src/lib/types.ts; camelCase fields map to snake_case columns).
-- Apply in Supabase: SQL Editor → paste this file → Run.
-- The app talks to the database only from the server using the service-role key and enforces
-- authorization in server code. Row-level security is enabled on every table with NO policies for
-- the anon/authenticated roles, so the public anon key cannot read or write any data directly.

create table if not exists users (
  id text primary key,
  created_at timestamptz not null default now(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  role text not null check (role in ('student','parent','college','employer','mentor','counselor','admin')),
  age_group text not null check (age_group in ('minor','adult')),
  status text not null default 'active' check (status in ('active','suspended')),
  verified boolean not null default false,
  org_id text,
  is_demo boolean default false
);

create table if not exists sessions (
  id text primary key,
  created_at timestamptz not null default now(),
  user_id text not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null
);

create table if not exists organizations (
  id text primary key,
  created_at timestamptz not null default now(),
  name text not null,
  type text not null check (type in ('college','employer','nonprofit','government')),
  verified boolean not null default false,
  description text not null default '',
  website text not null default '',
  location text not null default '',
  owner_id text references users(id) on delete set null,
  college_id text,
  is_demo boolean default false
);

create table if not exists profiles (
  id text primary key,
  created_at timestamptz not null default now(),
  user_id text not null unique references users(id) on delete cascade,
  headline text not null default '',
  about text not null default '',
  school text not null default '',
  school_level text not null default 'other',
  grad_year int,
  state text not null default '',
  city text not null default '',
  career_interests jsonb not null default '[]',
  skills jsonb not null default '[]',
  education jsonb not null default '[]',
  experience jsonb not null default '[]',
  projects jsonb not null default '[]',
  volunteer jsonb not null default '[]',
  activities jsonb not null default '[]',
  awards jsonb not null default '[]',
  certifications jsonb not null default '[]',
  links jsonb not null default '[]',
  avatar_url text not null default '',
  banner_url text not null default '',
  visibility text not null default 'private' check (visibility in ('public','network','private')),
  learning_format text default '',
  residency_status text default 'not_started',
  parent_link_code text
);

create table if not exists groups (
  id text primary key,
  created_at timestamptz not null default now(),
  name text not null,
  description text not null default '',
  visibility text not null check (visibility in ('public','private')),
  admin_id text not null references users(id) on delete cascade,
  rules jsonb not null default '[]',
  resources jsonb not null default '[]',
  adults_only boolean not null default false,
  tags jsonb not null default '[]'
);

create table if not exists posts (
  id text primary key,
  created_at timestamptz not null default now(),
  author_id text not null references users(id) on delete cascade,
  org_id text references organizations(id) on delete set null,
  group_id text references groups(id) on delete cascade,
  body text not null check (char_length(body) <= 3000),
  category text not null,
  link text,
  image_url text,
  repost_of_id text references posts(id) on delete set null,
  removed boolean not null default false
);

create table if not exists comments (
  id text primary key,
  created_at timestamptz not null default now(),
  post_id text not null references posts(id) on delete cascade,
  author_id text not null references users(id) on delete cascade,
  body text not null check (char_length(body) <= 1000),
  removed boolean not null default false
);

create table if not exists reactions (
  id text primary key,
  created_at timestamptz not null default now(),
  post_id text not null references posts(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  type text not null,
  unique (post_id, user_id)
);

create table if not exists saved_items (
  id text primary key,
  created_at timestamptz not null default now(),
  user_id text not null references users(id) on delete cascade,
  kind text not null,
  ref_id text not null,
  unique (user_id, kind, ref_id)
);

create table if not exists connections (
  id text primary key,
  created_at timestamptz not null default now(),
  requester_id text not null references users(id) on delete cascade,
  addressee_id text not null references users(id) on delete cascade,
  status text not null check (status in ('pending','accepted','declined'))
);

create table if not exists blocks (
  id text primary key,
  created_at timestamptz not null default now(),
  blocker_id text not null references users(id) on delete cascade,
  blocked_id text not null references users(id) on delete cascade,
  unique (blocker_id, blocked_id)
);

create table if not exists follows (
  id text primary key,
  created_at timestamptz not null default now(),
  user_id text not null references users(id) on delete cascade,
  org_id text not null references organizations(id) on delete cascade,
  unique (user_id, org_id)
);

create table if not exists group_members (
  id text primary key,
  created_at timestamptz not null default now(),
  group_id text not null references groups(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  status text not null check (status in ('member','pending')),
  role text not null default 'member',
  unique (group_id, user_id)
);

create table if not exists conversations (
  id text primary key,
  created_at timestamptz not null default now(),
  participant_ids jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id text primary key,
  created_at timestamptz not null default now(),
  conversation_id text not null references conversations(id) on delete cascade,
  sender_id text not null references users(id) on delete cascade,
  body text not null check (char_length(body) <= 2000),
  read_by jsonb not null default '[]'
);

create table if not exists notifications (
  id text primary key,
  created_at timestamptz not null default now(),
  user_id text not null references users(id) on delete cascade,
  type text not null,
  text text not null,
  href text not null default '/',
  read boolean not null default false
);

create table if not exists notification_prefs (
  id text primary key,
  created_at timestamptz not null default now(),
  user_id text not null unique references users(id) on delete cascade,
  categories jsonb not null default '{}',
  frequency text not null default 'realtime',
  email boolean not null default false
);

create table if not exists colleges (
  id text primary key,
  created_at timestamptz not null default now(),
  name text not null,
  city text not null,
  state text not null,
  type text not null,
  hbcu boolean not null default false,
  online boolean not null default false,
  hybrid boolean not null default false,
  campus boolean not null default true,
  website text not null,
  admissions_url text not null,
  degrees jsonb not null default '[]',
  majors jsonb not null default '[]',
  tuition_in_state int,
  tuition_out_state int,
  app_fee int,
  free_app_note text,
  test_policy text not null default '',
  transfer_friendly boolean not null default false,
  lab_note text,
  accreditation text not null default '',
  financial_aid_url text,
  verification jsonb not null,
  publish_status text not null default 'draft'
);

create table if not exists college_applications (
  id text primary key,
  created_at timestamptz not null default now(),
  user_id text not null references users(id) on delete cascade,
  college_id text not null references colleges(id) on delete cascade,
  status text not null,
  app_type text not null default '',
  deadline date,
  fee int,
  fee_waiver boolean not null default false,
  checklist jsonb not null default '{}',
  submitted_at text,
  decision_date date,
  enrollment_deposit text not null default '',
  confirmation_number text not null default '',
  notes text not null default '',
  unique (user_id, college_id)
);

create table if not exists fafsa_progress (
  id text primary key,
  created_at timestamptz not null default now(),
  user_id text not null unique references users(id) on delete cascade,
  award_year text not null,
  steps jsonb not null default '{}'
);

create table if not exists aid_offers (
  id text primary key,
  created_at timestamptz not null default now(),
  user_id text not null references users(id) on delete cascade,
  college_name text not null,
  tuition int not null default 0,
  fees int not null default 0,
  housing int not null default 0,
  books int not null default 0,
  transportation int not null default 0,
  grants int not null default 0,
  scholarships int not null default 0,
  work_study int not null default 0,
  loans int not null default 0
);

create table if not exists scholarships (
  id text primary key,
  created_at timestamptz not null default now(),
  name text not null,
  sponsor text not null default '',
  amount_text text not null default '',
  amount_max int,
  eligibility text not null default '',
  levels jsonb not null default '[]',
  tags jsonb not null default '[]',
  states jsonb not null default '[]',
  essay boolean not null default false,
  renewable boolean not null default false,
  need_based boolean not null default false,
  first_gen boolean not null default false,
  deadline date,
  deadline_note text not null default '',
  documents jsonb not null default '[]',
  url text not null check (url like 'https://%'),
  verification jsonb not null,
  publish_status text not null default 'draft'
);

create table if not exists scholarship_applications (
  id text primary key,
  created_at timestamptz not null default now(),
  user_id text not null references users(id) on delete cascade,
  scholarship_id text not null references scholarships(id) on delete cascade,
  status text not null,
  notes text not null default '',
  unique (user_id, scholarship_id)
);

create table if not exists jobs (
  id text primary key,
  created_at timestamptz not null default now(),
  title text not null,
  org_id text not null references organizations(id) on delete cascade,
  location text not null default '',
  arrangement text not null,
  pay_text text not null default '',
  paid boolean not null,
  category text not null default '',
  level text not null,
  min_age int,
  schedule text not null default '',
  description text not null default '',
  responsibilities jsonb not null default '[]',
  qualifications jsonb not null default '[]',
  deadline date,
  url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_demo boolean not null default false,
  posted_by_id text not null references users(id) on delete cascade
);

create table if not exists job_applications (
  id text primary key,
  created_at timestamptz not null default now(),
  user_id text not null references users(id) on delete cascade,
  job_id text not null references jobs(id) on delete cascade,
  status text not null,
  notes text not null default '',
  unique (user_id, job_id)
);

create table if not exists events (
  id text primary key,
  created_at timestamptz not null default now(),
  title text not null,
  date date not null,
  kind text not null,
  location text not null default '',
  url text,
  org_id text references organizations(id) on delete set null,
  description text not null default '',
  is_demo boolean not null default false
);

create table if not exists tasks (
  id text primary key,
  created_at timestamptz not null default now(),
  user_id text not null references users(id) on delete cascade,
  title text not null,
  date date,
  kind text not null,
  done boolean not null default false,
  href text
);

create table if not exists reports (
  id text primary key,
  created_at timestamptz not null default now(),
  reporter_id text not null references users(id) on delete cascade,
  target_type text not null,
  target_id text not null,
  reason text not null,
  status text not null default 'open'
);

create table if not exists audit_logs (
  id text primary key,
  created_at timestamptz not null default now(),
  actor_id text not null,
  action text not null,
  target text not null,
  details text
);

create table if not exists essays (
  id text primary key,
  created_at timestamptz not null default now(),
  user_id text not null references users(id) on delete cascade,
  title text not null,
  prompt text not null default '',
  target text not null default '',
  versions jsonb not null default '[]'
);

create table if not exists courses (
  id text primary key,
  created_at timestamptz not null default now(),
  user_id text not null references users(id) on delete cascade,
  name text not null,
  school_year text not null default '',
  term text not null default '',
  credit numeric not null default 1,
  level text not null,
  grade text not null default ''
);

create table if not exists user_docs (
  id text primary key,
  created_at timestamptz not null default now(),
  user_id text not null references users(id) on delete cascade,
  kind text not null,
  data jsonb not null default '{}',
  unique (user_id, kind)
);

create table if not exists ai_usage (
  id text primary key,
  created_at timestamptz not null default now(),
  user_id text not null references users(id) on delete cascade,
  day text not null,
  count int not null default 0,
  unique (user_id, day)
);

create table if not exists parent_links (
  id text primary key,
  created_at timestamptz not null default now(),
  parent_id text not null references users(id) on delete cascade,
  student_id text not null references users(id) on delete cascade,
  unique (parent_id, student_id)
);

create table if not exists site_settings (
  id text primary key,
  created_at timestamptz not null default now(),
  key text not null unique,
  value text not null default ''
);

alter table users add constraint users_org_fk foreign key (org_id) references organizations(id) on delete set null;

create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_posts_author_id on posts(author_id);
create index if not exists idx_posts_group_id on posts(group_id);
create index if not exists idx_posts_org_id on posts(org_id);
create index if not exists idx_posts_created_at on posts(created_at desc);
create index if not exists idx_comments_post_id on comments(post_id);
create index if not exists idx_reactions_post_id on reactions(post_id);
create index if not exists idx_connections_requester_id_status on connections(requester_id, status);
create index if not exists idx_connections_addressee_id_status on connections(addressee_id, status);
create index if not exists idx_group_members_user_id on group_members(user_id);
create index if not exists idx_messages_conversation_id_created_at on messages(conversation_id, created_at);
create index if not exists idx_notifications_user_id_read on notifications(user_id, read);
create index if not exists idx_college_applications_user_id on college_applications(user_id);
create index if not exists idx_colleges_state on colleges(state);
create index if not exists idx_colleges_publish_status on colleges(publish_status);
create index if not exists idx_scholarships_publish_status on scholarships(publish_status);
create index if not exists idx_jobs_status on jobs(status);
create index if not exists idx_jobs_org_id on jobs(org_id);
create index if not exists idx_tasks_user_id_date on tasks(user_id, date);
create index if not exists idx_reports_status on reports(status);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at desc);
create index if not exists idx_saved_items_user_id_kind on saved_items(user_id, kind);

alter table users enable row level security;
alter table sessions enable row level security;
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table groups enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table reactions enable row level security;
alter table saved_items enable row level security;
alter table connections enable row level security;
alter table blocks enable row level security;
alter table follows enable row level security;
alter table group_members enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table notification_prefs enable row level security;
alter table colleges enable row level security;
alter table college_applications enable row level security;
alter table fafsa_progress enable row level security;
alter table aid_offers enable row level security;
alter table scholarships enable row level security;
alter table scholarship_applications enable row level security;
alter table jobs enable row level security;
alter table job_applications enable row level security;
alter table events enable row level security;
alter table tasks enable row level security;
alter table reports enable row level security;
alter table audit_logs enable row level security;
alter table essays enable row level security;
alter table courses enable row level security;
alter table user_docs enable row level security;
alter table ai_usage enable row level security;
alter table parent_links enable row level security;
alter table site_settings enable row level security;

-- Intentionally no policies: only the server (service role) can access data.
