# EuroVis - Eurovision Voting Visualizations (2016–2023)

An interactive data visualization exploring how **jury votes and public televotes differ across countries** in the Eurovision Song Contest.

---

## What the Visualization Shows

EuroVis combines three coordinated views to analyze voting behavior:

- **Map (Finalist Countries)**
  - Displays countries that reached the Grand Final
  - Gold is winner & Blue is finalists
  - Click a country to explore details

- **Chord Diagram (Jury Voting Flows)**
  - Visualizes how countries award jury points to each other
  - Thickness shows the number of points exchanged
  - Countries grouped by European regions

- **Parallel Coordinates (Jury vs Public)**
  - Compares jury points and televote points
  - Each line represents a country
  - Reveals agreement vs disagreement patterns

- **Performance Panel**
  - Shows artist, song, final placement, and YouTube performance

---

## Interactivity

- **Year dropdown** — switch between Grand Finals (2016–2019, 2021–2023)
- **Hover** a country or line
  - Shows country, singer, song, and final place
- **Click a country**
  - Locks selection across:
    - Map
    - Chord diagram
    - Parallel coordinates
  - Opens detail panel with:
    - Performer
    - Song
    - Final placement
    - YouTube video
- **Click again or click background**
  - Clears selection

---

## Data Sources

| Dataset | Description | Coverage |
|--------|------------|----------|
| `contestants.csv` | Contest results, placements, YouTube links | 2000–2023 |
| `countries@16.geo.json` | Geographic boundaries for map | Global |
| `eurovision_artists_songs_2016_2023.csv` | Artist and song metadata | 2016–2023 |
| `eurovision_flow_with_regions_2016_2023.csv` | Jury voting flows between countries | 2016–2023 |
| `eurovision_scores_wide_2016_2023.csv` | Jury, televote, total, bias per country | 2016–2023 |

---

## Data Schema

Example country entry:

```json
{
  "country": "Sweden",
  "performer": "Loreen",
  "song": "Tattoo",
  "place": 1,
  "jury": 340,
  "tele": 243,
  "total": 583,
  "yt": "https://youtube.com/watch?v=..."
}
```

Example voting flow:

```json
{
  "year": 2023,
  "from_country": "Germany",
  "to_country": "Sweden",
  "points": 12,
  "from_region": "Western Europe",
  "to_region": "Northern Europe"
}
```

---

## Tech Stack

- **D3.js v7**
  - Scales, projections, layouts (chord, paths)
  - SVG rendering and interaction

- **TopoJSON / GeoJSON**
  - Map rendering

- **Vanilla HTML, CSS, JavaScript**
  - No frameworks
  - No build step required

---

## Running Locally

```bash
git clone https://github.com/sofia-lin/eurovis.git
cd eurovis
python3 -m http.server 8000
```

Open in your browser:

```
http://localhost:8000/index.html
```

---

## Key Insights

This visualization helps uncover:

- Differences between **jury (experts)** and **televote (public)** preferences  
- Regional voting patterns across Europe  
- Countries consistently favored by specific voting groups  
- Bias and disagreement in voting outcomes  

---

## Notes

- **2020 is excluded** (contest canceled due to COVID-19)  
- Only **Grand Final countries** are included in the visualizations  
- Country names are normalized (e.g., Czech Republic → Czechia)  

---

## Authors

EuroVis Team  
COMP 4462 Data Visualization Project
