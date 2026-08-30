-- Proposal generation now runs in a background function (Claude can take
-- 30-90+ seconds with adaptive thinking, well past Netlify's ~30s
-- synchronous function limit). These columns let the create/regenerate
-- routes return immediately and the frontend poll for completion.
alter table proposals
  add column if not exists generation_status text not null default 'ready'
    check (generation_status in ('pending', 'ready', 'failed'));

alter table proposals
  add column if not exists generation_error text;
