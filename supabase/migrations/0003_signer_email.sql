-- Client re-enters their email as a confirmation step during signing.
alter table signatures add column if not exists signer_email text;
