# Site

Forked from [Fabian Schultz](https://github.com/fabe/site)

## Dependency security update — October 2026

- Next.js is `16.4.2`. Sanity is `6.19.0`. These were the latest stable npm releases when checked.
- `@next/bundle-analyzer` and `eslint-config-next` track the Next.js release.
- `@vercel/og` is `1.0.3`. Sharp is `0.35.5`. Nanoid stays on its patched 5.x release.
- No direct dependencies were added. The Pages Router and site components are unchanged.
- Keep PostHog's `https://p.hem.so` host and the `/aly` rewrites.

Use npm `10.9.3`. Run `npm ci`, `npm run build`, `npm run lint`, and `npx tsc --noEmit`.
Run `npm audit` separately. It still exits with an error because of the findings below.

### Transitive overrides

The latest parent packages still pin vulnerable versions in these paths:

- `@vercel/frameworks`: use patched `js-yaml` 3.x and `smol-toml` 1.x.
  Keep YAML on 3.x because the parent calls `safeLoad`, which YAML 4 removed.
- `@tailwindcss/typography`: use `postcss-selector-parser` 7.1.6 or later.
  The latest typography release still pins parser 6.0.10.
- `satori`: use `fflate` 0.7.5 or later.
  The latest renderer still pins a vulnerable 0.7.x version.

### Remaining findings

The starting GitHub snapshot had 69 alerts: 3 critical, 30 high, 32 moderate, and 4 low.
The new lockfile fixes 66 of them. Alert #175 (`uuid`) was already patched in the starting lockfile.
Two alerts remain:

- [#278: braces](https://github.com/hemaaanth/site/security/dependabot/278), high.
  No patched release exists. Sanity code generation, Next.js lint tooling, and next-sitemap still require it.
- [#276: sprintf-js](https://github.com/hemaaanth/site/security/dependabot/276), moderate.
  No patched release exists. Sanity's framework detection needs it through YAML 3 and argparse.

The full npm audit fell from 37 affected packages to 18.
Critical findings fell from 1 to 0. High findings fell from 23 to 14.
Moderate findings fell from 13 to 4. There are no low findings.
The 18 include affected parent packages. They trace to the two unpatched advisories above.
No advisories were dismissed or hidden.

### Runtime checks and limits

The production build, lint, and TypeScript check pass.
Lint reports one `<img>` warning in `components/PortableText/index.tsx`.
Local browser checks cover the home page, a blog post, mobile post dates, the custom 404, and Open Graph images.
The obsolete source-text mobile-date test was removed. The rendered date was checked in the browser instead.
Sanity renders its connection screen on an origin that is not allowed by project CORS.
Authenticated editing needs an allowed origin and a Sanity session.

The `@vercel/og` 0.x-to-1.x upgrade is the main compatibility risk.
It keeps the existing `ImageResponse` API. Both title and default image responses were checked.
Sanity requires Node 22.12 or later. The local build used Node 26.3.
The existing Edge Runtime is deprecated by Next.js. It remains unchanged.
Local builds report Hardcover HTTP 401 and a revoked Spotify refresh token.
The build completes with the site's existing empty reading and listening states.
