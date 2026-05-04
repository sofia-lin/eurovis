# Eurovision Voting Visualizations

An interactive data visualization project exploring **jury vs. public voting divergence** in the Eurovision Song Contest (2000–2023), built with D3.js.

---

## Live Visualizations

| File | Years | Description |
|------|-------|-------------|
| `eurovision_parallel_2016_2023.html` | 2016–2023 | Parallel coordinates — jury pts vs public pts |
| `eurovision_parallel_2000_2015.html` | 2000–2015 | Parallel coordinates — jury pts vs raw public votes |
| `eurovision_map.html` | 2000–2015 | Choropleth map with inbound/outbound vote sidebar |

---

## What the Visualization Shows

Each year's Grand Final is shown as a **parallel coordinates chart** with three columns:

- **Left axis** — Jury points received (sum of 0–12 scores from each voting country's national jury)
- **Centre** — Country name nodes, ordered by **final ranking** (1st at top)
- **Right axis** — Public points received (televote aggregate from all participating countries)

The angle and crossing of each country's connecting lines reveals how much the jury and public disagreed. A near-horizontal line means agreement; a steep crossing means the jury and public had very different opinions.

### Colour encoding
| Colour | Meaning |
|--------|---------|
| 🔵 Blue | Jury gave relatively more points than the public |
| 🟢 Green | Public gave relatively more points than the jury |
| 🟡 Gold | Jury and public largely agreed (within 12%) |

Lines are thicker and more opaque for the top 25% of finishers.

---

## Interactivity

- **Year dropdown** — switch between Grand Finals
- **Hover** a line or country label — highlights that country, fades all others
- **Click** a country — locks the selection and opens a detail panel showing:
  - Final place, performer, song, YouTube link
  - Jury pts vs public pts score cards
  - Bias bar (jury − public, centred at zero)
  - Jury rank vs public rank with Δ difference
  - For 2000–2015: full breakdown of jury points by each voting country
- **Click again** or click the background to deselect

---

## Data Sources

| Dataset | Source | Coverage |
|---------|--------|----------|
| `votes2.csv` | Eurovision data | 2000–2015 per-country jury & televote |
| `contestants2.csv` | Eurovision data | 2000–2023 contestant metadata |
| `eurovision_scores_wide_2016_2023.csv` | Custom export | 2016–2023 jury, tele, total, bias per country |

### Data fields
```json
{
  "country": "Sweden",
  "performer": "Loreen",
  "song": "Tattoo",
  "place": 1,
  "jury": 340,
  "tele": 243,
  "total": 583,
  "bias": 97,
  "yt": "https://youtube.com/watch?v=..."
}
```

For 2000–2015, each entry also includes:
```json
{
  "jury_by": [
    { "from": "lv", "name": "Latvia", "pts": 12 },
    { "from": "de", "name": "Germany", "pts": 10 }
  ]
}
```

---

## Observable Notebooks

The visualizations are also available as Observable notebooks for interactive exploration:

- `eurovision_2016_2023_observable.md` — cells for the 2016–2023 chart
- `eurovision_2000_2015_observable.md` — cells for the 2000–2015 chart

To use in Observable:
1. Upload the relevant JSON file (`esc_2016_2023.json` or `esc_2000_2015.json`) to a GitHub Gist
2. Create a new notebook at [observablehq.com](https://observablehq.com)
3. Paste each code block from the `.md` file as a separate cell in order
4. Replace `YOUR_GIST_RAW_URL_HERE` in the `allData` cell with your Gist raw URL

---

## Tech Stack

- **[D3.js v7](https://d3js.org)** — scales, axes, path generation, SVG manipulation
- **[TopoJSON](https://github.com/topojson/topojson)** — map rendering (map visualization only)
- **[Observable](https://observablehq.com)** — reactive notebook version
- **Vanilla HTML/CSS/JS** — no build step, open any `.html` file directly in a browser

---

## Key Findings

A few notable jury/public splits visible in the data:

| Year | Country | Jury rank | Public rank | Δ |
|------|---------|-----------|-------------|---|
| 2019 | Norway (KEiiNO) | #18 | #1 | 17 |
| 2022 | Moldova | #20 | #2 | 18 |
| 2023 | Finland (Käärijä) | #4 | #1 | 3 |
| 2018 | Sweden | #2 | #23 | 21 |
| 2017 | Australia | #4 | #25 | 21 |

---

## Running Locally

No server needed — just open any `.html` file directly in your browser:

```bash
open eurovision_parallel_2016_2023.html
```

Or serve with any static server:

```bash
npx serve .
# → http://localhost:3000
```

---

## Hosting on GitHub Pages

1. Push all files to a public GitHub repository
2. Go to **Settings → Pages → Source → Deploy from branch → main / root**
3. Your site will be live at `https://YOUR_USERNAME.github.io/REPO_NAME`
