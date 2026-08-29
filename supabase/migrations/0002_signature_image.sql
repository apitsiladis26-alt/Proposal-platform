-- Adds the drawn signature image (base64 PNG data URL) alongside the typed
-- name already captured. Stored inline as text — a signature-pad PNG at
-- these dimensions is a few KB, well within a Postgres text column, and
-- this avoids needing a public/anon Storage write policy for signers who
-- aren't authenticated.
alter table signatures add column if not exists signature_image text;
