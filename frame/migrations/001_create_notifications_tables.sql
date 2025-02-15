-- Create notification_tokens table
create table if not exists public.notification_tokens (
  id serial not null,
  fid integer not null,
  token text not null,
  url text not null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  is_valid boolean null default true,
  last_used timestamp with time zone null,
  constraint notification_tokens_pkey primary key (id),
  constraint notification_tokens_fid_token_key unique (fid, token)
);

-- Create index for valid tokens by FID
create index if not exists idx_notification_tokens_fid_valid 
on public.notification_tokens using btree (fid) 
where (is_valid = true);

-- Create notifications table
create table if not exists public.notifications (
  id serial not null,
  fid integer not null,
  notification_id text not null,
  title character varying(32) not null,
  body character varying(128) not null,
  target_url text not null,
  status text null default 'pending'::text,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  delivered_at timestamp with time zone null,
  constraint notifications_pkey primary key (id),
  constraint notifications_notification_id_key unique (notification_id)
);

-- Add RLS policies
alter table public.notification_tokens enable row level security;
alter table public.notifications enable row level security;

-- Create policies for notification_tokens
create policy "Enable read access for all users" on public.notification_tokens
  for select using (true);

create policy "Enable insert for authenticated users only" on public.notification_tokens
  for insert with check (true);

create policy "Enable update for authenticated users only" on public.notification_tokens
  for update using (true);

-- Create policies for notifications
create policy "Enable read access for all users" on public.notifications
  for select using (true);

create policy "Enable insert for authenticated users only" on public.notifications
  for insert with check (true);

create policy "Enable update for authenticated users only" on public.notifications
  for update using (true);

-- Grant access to authenticated users
grant all on public.notification_tokens to authenticated;
grant all on public.notifications to authenticated;
grant usage, select on sequence public.notification_tokens_id_seq to authenticated;
grant usage, select on sequence public.notifications_id_seq to authenticated; 