# Repository checks

Use the Node version in `.node-version` and install the locked dependencies with `npm ci`.

## Source and content

Run `npm run check` to validate the element catalog, rendered specimen coverage, icon registry, required local assets, Node script syntax and Astro TypeScript diagnostics. The content check uses the existing source files as its input.

## Responsive regression

```sh
npx playwright install chromium
npm run build
npm test
```

The test starts an Astro production preview on a free local port and stops that process when it finishes. It leaves existing development servers running. To test a server you already started, set `RESPONSIVE_URL` to its URL.

Each run checks all eight current static routes at 360 x 800, 390 x 844, 768 x 1024, 1024 x 768 and 1440 x 900. It also checks that an unknown URL returns HTTP 404 and the custom error page. It records page overflow, headings, image loading and runtime errors, then exercises the repaired states on `/elements/`. These include the Inbox, calendar, Save Browser, long recipients, color panels, breadcrumbs, Columns view, navigation drawer and modal close controls. The test cancels the Trash alert.

Screenshots, the preview log and assertion results are saved under `output/responsive/runs/<timestamp>/`. A run name can be supplied with `npm run test:responsive -- <name>`. Use a fresh name to retain evidence from previous runs.

The default run uses managed Chromium with reduced motion. Optional environment variables are:

| Variable | Purpose |
| --- | --- |
| `RESPONSIVE_URL` | Use an existing local server instead of starting a production preview. |
| `RESPONSIVE_WIDTHS` | Supply comma-separated widths, such as `320,359,360,391,767,769,1023,1025`. The five standard widths use their standard heights. Other widths use a height of 900. |
| `RESPONSIVE_BROWSER` | Use a Playwright browser channel installed on the machine, such as `chrome`. |
| `RESPONSIVE_MOTION` | Set to `normal` to check transitions with motion enabled. |
| `RESPONSIVE_TOUCH` | Set to `true` to use touch input and mobile emulation below 600 px. |

GitHub Actions installs Chromium, runs the same source checks, builds the site and runs both the default regression and touch with normal motion at 320, 360 and 390 px. It keeps generated browser artifacts for 14 days. Visual inspection remains necessary when changing UI. Passing assertions does not prove that every visual state or browser is correct.
