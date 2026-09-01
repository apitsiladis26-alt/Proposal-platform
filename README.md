# Proposal Generation Platform

Next.js app: create a proposal from a short brief, Claude drafts it into the
standard template, you review and publish, the client signs and pays on a
public link with no login. See `/Users/antony/.claude/plans/my-goal-today-is-glistening-jellyfish.md`
for the full implementation plan.

## Remaining setup before this runs end-to-end

1. **Run the DB migration** — open the Supabase dashboard → SQL Editor,
   paste the contents of `supabase/migrations/0001_init.sql`, and run it.
2. **Create your login user** — Supabase dashboard → Authentication → Users
   → Add user (email + password). This is the only account the app supports.
3. **Fill in the remaining `.env.local` values** (Supabase + Stripe test
   keys are already in there):
   - `ANTHROPIC_API_KEY` — from console.anthropic.com
   - `RESEND_API_KEY` and `RESEND_FROM_EMAIL` — from resend.com, once you've
     verified a sending domain
4. **Stripe webhook, local dev** — install the [Stripe CLI](https://stripe.com/docs/stripe-cli),
   then run `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   in a separate terminal while developing. It prints a signing secret —
   put that in `STRIPE_WEBHOOK_SECRET` in `.env.local` (this is different
   from the production webhook secret you'll register later).

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated visits
redirect to `/login`.

## Deployment (Netlify)

- Connect this repo to Netlify — `netlify.toml` already points to
  `@netlify/plugin-nextjs`.
- Set every variable from `.env.local` in Netlify's environment settings,
  swapping `NEXT_PUBLIC_SITE_URL` for the real production URL and using
  **live** Stripe keys instead of test ones when you're ready to charge
  real cards.
- After the first deploy, register a webhook endpoint in the Stripe
  dashboard pointing at `https://<your-domain>/api/stripe/webhook`, and use
  *that* endpoint's signing secret for `STRIPE_WEBHOOK_SECRET` in
  production (not the Stripe CLI one from local dev).
- Domain: this app can live on its own Netlify subdomain, or on a
  `proposals.humantelemetrics.com`-style subdomain via a CNAME record added
  in Cloudflare DNS pointing at the Netlify site — no need to move the app
  itself onto Cloudflare.
