# Human Browser

Open-source monorepo for **Human Browser**: a [Turborepo](https://turbo.build/) workspace with a [Next.js](https://nextjs.org/) app that can receive inbound email via [Resend](https://resend.com/) webhooks.

## Repository

**GitHub:** [github.com/syd-shields/human-browser](https://github.com/syd-shields/human-browser)

## What’s in the repo

| Path                         | Description                                                                                                                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`                   | Next.js 15 app (App Router, TypeScript, Tailwind). Includes `POST /api/webhooks/resend` for verified [`email.received`](https://resend.com/docs/webhooks/emails/received) events, scoped to `upload@humanbrowser.com`. |
| `packages/ui`                | Shared React component library (`@repo/ui`).                                                                                                                                                                           |
| `packages/eslint-config`     | Shared ESLint config (`@repo/eslint-config`).                                                                                                                                                                          |
| `packages/typescript-config` | Shared TypeScript bases (`@repo/typescript-config`).                                                                                                                                                                   |

Inbound email flow is described in [Receiving emails](https://resend.com/docs/dashboard/receiving/introduction). Webhook payloads are metadata-only; use the [Received Email API](https://resend.com/api-reference/emails/retrieve-received-email) to load bodies and attachments.

## Requirements

- [Node.js](https://nodejs.org/) 18+ (CI uses 22)
- [pnpm](https://pnpm.io/) 9 (`packageManager` is pinned in root `package.json`)

## Local development

```bash
pnpm install
pnpm dev
```

Run only the web app:

```bash
pnpm exec turbo run dev --filter=web
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts (root)

| Script              | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `pnpm dev`          | Dev servers for workspace apps           |
| `pnpm build`        | Production build via Turbo               |
| `pnpm lint`         | ESLint across packages                   |
| `pnpm format`       | Prettier write (`*.ts`, `*.tsx`, `*.md`) |
| `pnpm format:check` | Prettier check (used in CI)              |
| `pnpm check-types`  | TypeScript `tsc --noEmit` via Turbo      |

## Environment variables

Copy `apps/web/.env.example` to `apps/web/.env.local` for local development.

| Variable                | Required for webhook | Description                                                                                                                                                              |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `RESEND_WEBHOOK_SECRET` | Yes                  | Signing secret from [Resend → Webhooks](https://resend.com/webhooks) (verify requests per [Verify webhooks](https://resend.com/docs/webhooks/verify-webhooks-requests)). |
| `RESEND_UPLOAD_INBOX`   | No                   | Address matched against `data.to` (defaults to `upload@humanbrowser.com`).                                                                                               |

Set the same variable in [Vercel Project → Settings → Environment Variables](https://vercel.com/docs/projects/environment-variables) for **Production** and **Preview** so preview deployments can verify webhooks if you test against them.

Do not commit `.env` or `.env.local`; they are gitignored.

## CI (GitHub Actions)

Workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

On every push and pull request to `main`, **Quality** runs:

1. `pnpm install --frozen-lockfile`
2. `pnpm format:check`
3. `pnpm lint`
4. `pnpm check-types`
5. `pnpm build`

[Dependabot](https://docs.github.com/en/code-security/dependabot) is configured in [`.github/dependabot.yml`](.github/dependabot.yml) for npm and GitHub Actions.

## Vercel (production + previews)

The project is set up so **Vercel** can build the Next app from the monorepo root using Turbo.

### One-time Vercel project setup

1. In [Vercel](https://vercel.com/dashboard), open the **human-browser** project.
2. **Settings → Git** → connect **github.com/syd-shields/human-browser** (install the Vercel GitHub app if prompted).
3. **Settings → General → Root Directory** → set to **`apps/web`**.  
   This makes Vercel treat the Next.js app as the app root while [`apps/web/vercel.json`](apps/web/vercel.json) runs install/build from the repo root (`pnpm install` + `turbo run build --filter=web`).
4. **Production Branch** → **`main`** (default). Pushes to `main` deploy to **Production**.
5. **Settings → Domains** → add **`dev.humanbrowser.com`** and assign it to **Production** (follow DNS instructions Vercel shows for your DNS provider).
6. **Settings → Environment Variables** → add `RESEND_WEBHOOK_SECRET` for Production (and Preview if needed).

### Preview deployments

With the GitHub integration enabled, **every pull request** gets a **Preview** deployment automatically. No extra workflow is required for preview URLs.

Optional hardening:

- **Settings → Deployment Protection** → enable protection for **Preview** (e.g. Vercel Authentication or password) if you want previews not to be public.
- **Settings → Git** → enable **“Ignored Build Step”** or [Turborepo remote caching](https://vercel.com/docs/monorepos/turborepo) if the repo grows and you want faster builds.

### Resend webhook URL in production

Point your Resend webhook at:

`https://dev.humanbrowser.com/api/webhooks/resend`

Subscribe to **`email.received`**. Use the signing secret as `RESEND_WEBHOOK_SECRET` in Vercel.

For local testing, use a tunnel (e.g. [ngrok](https://ngrok.com/)) as in [Receiving emails](https://resend.com/docs/dashboard/receiving/introduction).

## GitHub: branch protections (recommended)

After at least one successful **CI** run on `main` (so the check name appears in the UI):

1. Repo → **Settings** → **Rules** → **Rulesets** (or **Branches** → **Branch protection rules**).
2. Protect **`main`** with:
   - **Require a pull request before merging** (optional but typical for OSS).
   - **Require status checks to pass** → add **Quality** (or **CI / Quality**, depending on how GitHub lists it).
   - Optionally **Require branches to be up to date before merging**.

If you use **Rulesets**, add a rule targeting `main` and under **Require status checks** select the check that matches the **Quality** job from this repo’s CI workflow.

## Creating the GitHub repo (already done)

The remote **human-browser** already exists:

`https://github.com/syd-shields/human-browser.git`

To push your current branch:

```bash
git push -u origin main
```

To create a _new_ empty repo under another org or name in the future:

```bash
gh repo create <owner>/<name> --public --source=. --remote=origin --push
```

## License

[MIT](LICENSE).
