# VINASIG palette reference

Generated from [the pinned palette](../../src/data/palette.json). Names, Hex values and CSS tokens are shared with the Web Design System. RGB is derived from Hex.

## Base colors

| Name           | Group    | Hex       | RGB           | CSS token                   |
| -------------- | -------- | --------- | ------------- | --------------------------- |
| Scout Blue     | identity | `#21497B` | 33, 73, 123   | `--color-scout-blue`        |
| Thinker Orange | identity | `#EB7114` | 235, 113, 20  | `--color-thinker-orange`    |
| Builder Green  | identity | `#47A036` | 71, 160, 54   | `--color-builder-green`     |
| Auditor Red    | identity | `#971607` | 151, 22, 7    | `--color-auditor-red`       |
| Core Graphite  | identity | `#443A3B` | 68, 58, 59    | `--color-core-graphite`     |
| Clay           | support  | `#B4684D` | 180, 104, 77  | `--color-palette-clay`      |
| Saffron        | support  | `#DEB12D` | 222, 177, 45  | `--color-palette-saffron`   |
| Lagoon         | support  | `#2CBAA8` | 44, 186, 168  | `--color-palette-lagoon`    |
| Violet         | support  | `#9A5CC6` | 154, 92, 198  | `--color-palette-violet`    |
| Sky            | support  | `#8BB3FF` | 139, 179, 255 | `--color-palette-sky`       |
| Porcelain      | neutral  | `#E3D4D1` | 227, 212, 209 | `--color-palette-porcelain` |
| Fog            | neutral  | `#CECACA` | 206, 202, 202 | `--color-palette-fog`       |
| Stone          | neutral  | `#AAAAAA` | 170, 170, 170 | `--color-palette-stone`     |
| Slate          | neutral  | `#555555` | 85, 85, 85    | `--color-palette-slate`     |
| Ink            | neutral  | `#000000` | 0, 0, 0       | `--color-palette-ink`       |
| Paper          | neutral  | `#FFFFFF` | 255, 255, 255 | `--color-palette-paper`     |

## Deep tones

| Name                | Hex       | RGB        | CSS token                          |
| ------------------- | --------- | ---------- | ---------------------------------- |
| Scout Blue Deep     | `#08121E` | 8, 18, 30  | `--color-scout-blue-deep`          |
| Thinker Orange Deep | `#3B1D05` | 59, 29, 5  | `--color-thinker-orange-deep`      |
| Builder Green Deep  | `#04280D` | 4, 40, 13  | `--color-builder-green-deep`       |
| Auditor Red Deep    | `#250501` | 37, 5, 1   | `--color-auditor-red-deep`         |
| Core Graphite Deep  | `#110E0E` | 17, 14, 14 | `--color-core-graphite-deep`       |
| Clay Deep           | `#2D1A13` | 45, 26, 19 | `--color-palette-clay-deep`        |
| Saffron Deep        | `#372C0B` | 55, 44, 11 | `--color-palette-saffron-deep`     |
| Lagoon Deep         | `#0B2E2A` | 11, 46, 42 | `--color-palette-lagoon-deep`      |
| Violet Deep         | `#261731` | 38, 23, 49 | `--color-palette-violet-deep`      |
| Sky Deep            | `#232D40` | 35, 45, 64 | `--color-palette-sky-deep`         |
| Porcelain Deep      | `#383534` | 56, 53, 52 | `--color-palette-porcelain-deep`   |
| Fog Deep            | `#333232` | 51, 50, 50 | `--color-palette-fog-deep`         |
| Stone Deep          | `#2A2A2A` | 42, 42, 42 | `--color-palette-stone-deep`       |
| Slate Deep          | `#151515` | 21, 21, 21 | `--color-palette-slate-deep`       |
| Ink Deep            | `#000000` | 0, 0, 0    | `--color-palette-ink-deep`         |
| Paper Deep          | `#3F3F3F` | 63, 63, 63 | `--color-palette-paper-deep`       |
| Indigo Deep         | `#00002A` | 0, 0, 42   | `--color-palette-indigo-deep`      |
| Forest Deep         | `#002A00` | 0, 42, 0   | `--color-palette-forest-deep`      |
| Ocean Deep          | `#002A2A` | 0, 42, 42  | `--color-palette-ocean-deep`       |
| Burgundy Deep       | `#2A0000` | 42, 0, 0   | `--color-palette-burgundy-deep`    |
| Plum Deep           | `#2A002A` | 42, 0, 42  | `--color-palette-plum-deep`        |
| Amber Olive Deep    | `#2A2A00` | 42, 42, 0  | `--color-palette-amber-olive-deep` |
| Amber Umber Deep    | `#402A00` | 64, 42, 0  | `--color-palette-amber-umber-deep` |
| Cobalt Deep         | `#15153F` | 21, 21, 63 | `--color-palette-cobalt-deep`      |
| Meadow Deep         | `#153F15` | 21, 63, 21 | `--color-palette-meadow-deep`      |
| Glacier Deep        | `#153F3F` | 21, 63, 63 | `--color-palette-glacier-deep`     |
| Rose Deep           | `#3F1515` | 63, 21, 21 | `--color-palette-rose-deep`        |
| Orchid Deep         | `#3F153F` | 63, 21, 63 | `--color-palette-orchid-deep`      |
| Sunlight Deep       | `#3F3F15` | 63, 63, 21 | `--color-palette-sunlight-deep`    |
| Citron Deep         | `#373501` | 55, 53, 1  | `--color-palette-citron-deep`      |

## Base and deep contrast

These measurements describe actual sRGB pairs. They do not recommend using every base color as text on its corresponding deep tone. Normal text needs at least 4.5 to 1. Decisions use the unrounded ratio.

| Name           | Base      | Deep      | Contrast | AA normal text |
| -------------- | --------- | --------- | -------- | -------------- |
| Scout Blue     | `#21497B` | `#08121E` | 2.06     | FAIL           |
| Thinker Orange | `#EB7114` | `#3B1D05` | 5.06     | PASS           |
| Builder Green  | `#47A036` | `#04280D` | 4.83     | PASS           |
| Auditor Red    | `#971607` | `#250501` | 2.21     | FAIL           |
| Core Graphite  | `#443A3B` | `#110E0E` | 1.75     | FAIL           |
| Clay           | `#B4684D` | `#2D1A13` | 3.96     | FAIL           |
| Saffron        | `#DEB12D` | `#372C0B` | 6.82     | PASS           |
| Lagoon         | `#2CBAA8` | `#0B2E2A` | 6.04     | PASS           |
| Violet         | `#9A5CC6` | `#261731` | 3.77     | FAIL           |
| Sky            | `#8BB3FF` | `#232D40` | 6.56     | PASS           |
| Porcelain      | `#E3D4D1` | `#383534` | 8.45     | PASS           |
| Fog            | `#CECACA` | `#333232` | 7.86     | PASS           |
| Stone          | `#AAAAAA` | `#2A2A2A` | 6.17     | PASS           |
| Slate          | `#555555` | `#151515` | 2.44     | FAIL           |
| Ink            | `#000000` | `#000000` | 1.00     | FAIL           |
| Paper          | `#FFFFFF` | `#3F3F3F` | 10.53    | PASS           |

Palette inspired by Minecraft.
