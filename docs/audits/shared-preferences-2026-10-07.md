# Shared preference build acceptance — 7 October 2026

This record covers the reviewed builds of thirteen VINASIG websites. It records project-authored automated checks and opened screenshot inspection. It is not an independent security review, participant study, physical-device test or a certification of deployment. Production delivery requires a separate check of the actual domains.

## Scope and decision

The owner requested shared language and appearance across the ecosystem. All thirteen consumers adopt the same dependency-free local runtime, with normalized-LF SHA-256 `af933a05e658b258e858ab6df46478bcabe5907aaa0d40bb8ae29a20dbddc729`. The source is [src/scripts/shared-preferences.js](../../src/scripts/shared-preferences.js), with [the resolution and privacy contract](../LOCALIZATION.md) and [the source record](../SHARED_PREFERENCES.json).

The sites are `vinasig.io.vn`, `design.vinasig.io.vn`, `password.vinasig.io.vn`, `totp.vinasig.io.vn`, `qr.vinasig.io.vn`, `scan.vinasig.io.vn`, `metadata.vinasig.io.vn`, `clean.vinasig.io.vn`, `edit.vinasig.io.vn`, `favicon.vinasig.io.vn`, `bmi.vinasig.io.vn`, `nvqs-bmi.vinasig.io.vn` and `unphar.vinasig.io.vn`.

Follow native operating-system appearance and supported browser languages before a manual choice. Detected defaults write no preference. Deliberate choices use two finite Secure parent-domain cookies. Manual choices override detected defaults. Local development, offline files and denied cookies retain bounded local or volatile fallback.

Appearance changes preserve the current page and its inputs. Language changes elsewhere may navigate an untouched page. Trusted form, file, result, paste or drop interaction defers automatic language navigation until the next load. Explicit language links still navigate immediately. This avoids persisting or transferring product state to simulate a seamless language change.

## Verified build evidence

| Acceptance                                      | Result | Scope                                                                                                                                        |
| ----------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Source checks, unit tests and production builds | PASS   | All thirteen consumers, using each repository's existing checks                                                                              |
| Shared preference browser regressions           | PASS   | Each consumer's actual built server; Chromium, Firefox and WebKit                                                                            |
| Mixed-consumer interoperability                 | PASS   | All thirteen different builds under isolated controlled HTTPS origins, in all three engines                                                  |
| Active work retention                           | PASS   | Current generated password survives appearance changes; four loaded file tools defer language navigation and retain their file state         |
| Defaults and storage boundaries                 | PASS   | No automatic preference writes; two finite cookies after deliberate changes; no origin-local preference copies in the mixed-consumer fixture |
| Appearance and locale screenshots               | PASS   | 208 captures: thirteen sites, two locales, two themes, two widths, header and footer views                                                   |
| Opened visual inspection                        | PASS   | Eight assembled header/footer views and representative full screenshots; original logos and Sun/Moon action preserved                        |
| PHP implementation archive fixtures             | PASS   | Six fixtures read by PHP 8.4; preference changes do not replace archive validation                                                           |

The shared fixture also checks native locale links without script, first supported browser-language precedence, explicit locale routes, late-opened pages, two-way manual propagation, system changes, protected active input, legacy migration, denied storage, malformed/duplicate preferences and lookalike hosts. The mixed-consumer fixture verifies zero runtime exceptions and uses synthetic files and generated test secrets without logging their values.

Execution logs, raw measurements, receipts and images are retained under the workspace's ignored `output/preferences-2026-10-07/` directory. Per-consumer regression sources remain public in their respective repositories. The installed WEB-011 fixture comes from signed `agent-standards` revision `1c0eedf84313b1a06e73e7d0be6249e3a039f7cc`, bundle SHA-256 `7927fbaa1c3b9dbd7a2ac3ee611fe8e33476d26c0c9c4f94ef61d1fcb0a2ba0b`. Its source checks and browser fixtures passed on Linux and Windows.

## Fixture corrections and limits

The controlled HTTPS fixture sends the preview server's own Host while fetching the reviewed local bytes. It retains the application's response headers. Checking a visible-page synchronization activates that page first, matching the runtime's suspension of hidden-page polling.

A separately implemented native media-query probe observed a Windows Firefox automation reset when COOP changed the browsing context. After the initial committed navigation, the fixture configures the intended media preference and independently checks the native query before checking application appearance. Application, system-change and manual-override assertions remain intact. This does not certify that platform's first paint under an initial dark emulation. COOP and other security headers were retained.

Lighthouse browser fixtures now declare and independently probe the language under measurement. A previously labelled Vietnamese-root run used an English browser and therefore measured the intentional language redirect instead of the intended locale. The correction preserves the existing sample counts and budgets; it is not evidence of a product speed optimization.

Builds and browser runs that read those builds are sequential. A local run initially overlapped artifact replacement and observed missing assets; its failed log is retained, and the final run used completed immutable builds. Quality gates, assertions, timeouts, supported engines, content and security headers were not weakened.

Preference sharing applies within one browser profile on the canonical HTTPS domain family. It does not synchronize devices, profiles or contexts that deny shared cookies. Browser-engine emulation and opened screenshots do not establish physical-device, screen-reader or real-user performance evidence. Tabs that loaded an older runtime need one reload to receive the new code.
