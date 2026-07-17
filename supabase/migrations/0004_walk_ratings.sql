-- Community walk ratings: users drop a star pin where they walked and
-- rate the experience 1-5 with an optional comment. First stateful
-- feature — everything else in the app is per-browser only.
create table if not exists walk_ratings (
  id bigint generated always as identity primary key,
  lat double precision not null,
  lon double precision not null,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists walk_ratings_created_idx
  on walk_ratings (created_at desc);

alter table walk_ratings enable row level security;

-- No accounts, so reads and inserts are public via the anon key. The
-- check constraints above (rating range, comment length) are the guard
-- rails; updates/deletes stay closed to the anon role entirely.
create policy "Public read access" on walk_ratings
  for select using (true);

create policy "Public insert access" on walk_ratings
  for insert with check (rating between 1 and 5 and char_length(comment) <= 500);
