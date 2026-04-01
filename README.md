# Human Browser

Open-source monorepo for **Human Browser**: a [Next.js](https://nextjs.org/) app with inbound email handling via [Resend](https://resend.com/) webhooks.

## What’s in the repo

| Path                         | Purpose                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| `apps/web`                   | Next.js 15 app (App Router, TypeScript, Tailwind). Production deploy target for Vercel. |
| `packages/ui`                | Shared React component library (`@repo/ui`).                                            |
| `packages/eslint-config`     | Shared ESLint flat config (`@repo/eslint-config`).                                      |
| `packages/typescript-config` | Shared TypeScript bases (`@repo/typescript-config`).                                    |

The web app exposes `POST /api/webhooks/resend`, which verifies [Svix-signed](https://docs.svix.com/receiving/verifying-payloads/how) Resend webhooks and processes inbound mail addressed to **`upload@humanbrowser.com`**. Payloads are metadata-only; fetch full content with the [Received Email API](https://resend.com/docs/api-reference/emails/retrieve-received-email) when you need bodies or attachments.

## Requirements

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 9 (`packageManager` is pinned in `package.json`)

## Development

```bash
pnpm install
pnpm dev
```

Run only the web app:

```bash
pnpm --filter web dev
```

Other root scripts:

| Script              | Description                                         |
| ------------------- | --------------------------------------------------- |
| `pnpm build`        | Turborepo build (all packages that define `build`). |
| `pnpm lint`         | ESLint across the workspace.                        |
| `pnpm check-types`  | TypeScript `tsc --noEmit` via Turborepo.            |
| `pnpm format`       | Prettier write (`*.ts`, `*.tsx`, `*.md`).           |
| `pnpm format:check` | Prettier check (used in CI).                        |

## Environment variables

Copy `apps/web/.env.example` to `apps/web/.env.local` for local development.

| Variable                | Used for                                                                    |
| ----------------------- | --------------------------------------------------------------------------- |
| `RESEND_WEBHOOK_SECRET` | Verifying inbound webhook signatures from Resend.                           |
| `RESEND_UPLOAD_INBOX`   | Optional. Address matched against `to` (default `upload@humanbrowser.com`). |

Configure the webhook URL and signing secret in the [Resend Webhooks dashboard](https://resend.com/webhooks). Subscribe to **`email.received`**. See [Receiving emails](https://resend.com/docs/dashboard/receiving/introduction) and [Verify webhooks](https://resend.com/docs/webhooks/verify-webhooks-requests).

## Deployment (Vercel)

Production for this project is intended at **`dev.humanbrowser.com`**, deployed from the **`main`** branch.

1. In [Vercel](https://vercel.com/), open the **human-browser** project (or import this Git repository if it is not linked yet).
2. **Root Directory**: `apps/web`
3. **Install Command**: `cd ../.. && pnpm install --frozen-lockfile`
4. **Build Command**: leave default (`next build`) or `pnpm exec next build --turbopack` if you prefer explicit parity with local builds.
5. **Framework Preset**: Next.js (auto-detected from `apps/web`).
6. Under **Settings → Domains**, add **`dev.humanbrowser.com`** and assign it to **Production** (so it tracks `main`).

Pull requests against the linked GitHub repository automatically get **Vercel Preview Deployments** once the integration is enabled (default for Git-connected projects). You can tighten preview access under **Project → Settings → Deployment Protection** (e.g. Vercel Authentication or password protection for previews).

Set `RESEND_WEBHOOK_SECRET` in **Project → Settings → Environment Variables** for Production (and Preview if you test webhooks against preview URLs via a tunnel or Resend’s replay tools).

## CI and repository protections

[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs on every push and pull request to **`main`**. It runs **Prettier** (`format:check`), **ESLint**, **TypeScript**, and a **production build** with a frozen lockfile.

**Recommended GitHub settings**

1. **Rulesets** (Settings → Rules → Rulesets): add a branch ruleset for `main` that **requires status checks** and select **`CI / Quality`**. Optionally require a pull request before merging.
2. **Dependabot** is enabled via [`.github/dependabot.yml`](./.github/dependabot.yml) for npm and GitHub Actions.

**Vercel**

Connect this repository to your **human-browser** Vercel project so **Preview** deployments run on pull requests and **Production** (`main`) serves **`dev.humanbrowser.com`**. Use **Deployment Protection** under the Vercel project if you want previews gated behind login or password.

## Contributing

Issues and pull requests are welcome. Please run `pnpm format`, `pnpm lint`, and `pnpm check-types` before opening a PR.

## License

MIT — see [LICENSE](./LICENSE).
