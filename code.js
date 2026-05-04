const YEARS = [2016, 2017, 2018, 2019, 2021, 2022, 2023];
const regionsOrder = [
  "Northern Europe",
  "Western Europe",
  "Southern Europe",
  "Central Europe",
  "Eastern Europe",
  "Southeastern Europe",
  "Other",
];
const regionColors = [
  "#aec7e8",
  "#ffbb78",
  "#ff9896",
  "#9edae5",
  "#98df8a",
  "#f7e6a1",
  "#c5b0d5",
];
const europeNames = new Set([
  "Albania",
  "Armenia",
  "Andorra",
  "Austria",
  "Azerbaijan",
  "Belarus",
  "Belgium",
  "Bosnia and Herzegovina",
  "Bulgaria",
  "Croatia",
  "Czech Republic",
  "Czechia",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Georgia",
  "Greece",
  "Hungary",
  "Iceland",
  "Ireland",
  "Israel",
  "Italy",
  "Latvia",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Moldova",
  "Monaco",
  "Montenegro",
  "Morocco",
  "Netherlands",
  "North Macedonia",
  "Norway",
  "Poland",
  "Portugal",
  "Romania",
  "Russia",
  "San Marino",
  "Serbia",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden",
  "Switzerland",
  "Turkey",
  "Ukraine",
  "United Kingdom",
  "Vatican",
  "Vatican City",
  "Kosovo",
]);
let selectedYear = 2016;
let selectedCountry = null;
let appData = null;

Promise.all([
  d3.json("countries@16.geo.json"),
  d3.csv("contestants.csv", d3.autoType),
  d3.csv("eurovision_artists_songs_2016_2023.csv", d3.autoType),
  d3.csv("eurovision_flow_with_regions_2016_2023.csv", d3.autoType),
  d3.csv("eurovision_scores_wide_2016_2023.csv", d3.autoType),
]).then(([worldData, contestants, artistsSongs, flowData, scoresWide]) => {
  appData = {
    worldData,
    contestants,
    artistsSongs,
    flowData,
    scoresWide,
  };
  setupControls();

  requestAnimationFrame(() => {
    updateAll(true);
  });
});

function setupControls() {
  const yearSel = d3.select("#year-sel");
  yearSel
    .selectAll("option")
    .data(YEARS)
    .join("option")
    .attr("value", (d) => d)
    .text((d) => d);
  yearSel.property("value", selectedYear);
  yearSel.on("change", function () {
    selectedYear = +this.value;
    selectedCountry = null;
    updateAll(true);
  });
  d3.select("#how-btn").on("click", () =>
    d3.select("#overlay").classed("show", true),
  );
  d3.select("#enter-btn").on("click", () =>
    d3.select("#overlay").classed("show", false),
  );
  d3.select("#overlay").on("click", (event) => {
    if (event.target.id === "overlay")
      d3.select("#overlay").classed("show", false);
  });
}

const ro = new ResizeObserver(() => {
  if (appData) updateAll(false);
});

ro.observe(document.getElementById("map-svg-wrap"));

function updateAll(reset = false) {
  renderMap(
    appData.worldData,
    appData.contestants,
    appData.artistsSongs,
    reset,
  );
  renderChord(appData.flowData);
  renderParallel(appData.scoresWide, appData.contestants);
}

function selectCountry(country) {
  selectedCountry = selectedCountry === country ? null : country;
  updateAll(false);
}

function countryKey(name) {
  const map = new Map([
    ["Czech Republic", "Czechia"],
    ["Bosnia and Herzegovina", "Bosnia & Herzegovina"],
    ["Macedonia", "North Macedonia"],
  ]);
  return map.get(name) || name;
}
function youtubeEmbed(url) {
  if (!url) return null;
  const s = String(url);
  const m = s.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}
function showYoutube(entry, artistSong) {
  const wrap = d3.select("#yt-wrap");
  const content = d3.select("#yt-content");
  const embed = youtubeEmbed(entry?.youtube_url);
  d3.select("#yt-placeholder").style("display", embed ? "none" : "block");
  content.style("display", embed ? "block" : "none");
  if (!embed) return;
  content.html(
    `<div id="yt-iframe-wrap"><iframe src="${embed}" allowfullscreen></iframe></div><div id="yt-info"><strong>${entry.country}</strong><span>${artistSong?.artist || "N/A"} - ${artistSong?.song || "N/A"}</span><br><span>Final place: ${entry.place_final}</span></div>`,
  );
}

function renderMap(worldData, contestants, artistsSongs, resetSelection) {
  if (resetSelection) selectedCountry = null;
  const wrap = document.getElementById("map-svg-wrap");
  const width = wrap.clientWidth;
  const height = wrap.clientHeight;

  if (!width || !height) return;
  d3.select("#map-svg").selectAll("*").remove();
  d3.select("body").selectAll(".tooltip").remove();
  const svg = d3.select("#map-svg").attr("viewBox", [0, 0, width, height]);
  const tooltip = d3.create("div").attr("class", "tooltip");
  document.body.appendChild(tooltip.node());

  const getName = (d) =>
    d.properties.name ||
    d.properties.ADMIN ||
    d.properties.admin ||
    d.properties.NAME ||
    "";
  const features = worldData.features;
  const mapFeatures = features.filter((d) => europeNames.has(getName(d)));
  const mapData = { type: "FeatureCollection", features: mapFeatures };
  const australiaData = {
    type: "FeatureCollection",
    features: features.filter((d) => getName(d) === "Australia"),
  };
  const maltaFeature = mapFeatures.find((d) => getName(d) === "Malta");
  const maltaData = maltaFeature
    ? { type: "FeatureCollection", features: [maltaFeature] }
    : null;

  const finalistsRaw = contestants.filter(
    (d) =>
      +d.year >= 2016 &&
      +d.year <= 2023 &&
      d.place_final != null &&
      d.place_final !== "" &&
      !isNaN(+d.place_final),
  );
  const finalists = Array.from(
    d3.rollup(
      finalistsRaw,
      (v) => v[0],
      (d) => +d.year,
      (d) => d.to_country,
    ),
    ([year, countryMap]) =>
      Array.from(countryMap, ([country, row]) => ({
        year,
        country,
        country_id: row.to_country_id,
        youtube_url: row.youtube_url,
        place_final: +row.place_final,
      })),
  ).flat();
  const finalistsByYear = d3.rollup(
    finalists,
    (v) => new Map(v.map((d) => [d.country, d])),
    (d) => d.year,
  );
  const artistSongByYearCountry = d3.rollup(
    artistsSongs,
    (v) => v[0],
    (d) => +d.year,
    (d) => d.country,
  );
  const yearMap = finalistsByYear.get(selectedYear) || new Map();
  const projection = d3.geoMercator().fitExtent(
    [
      [20, 20],
      [width - 20, height - 20],
    ],
    mapData,
  );
  const path = d3.geoPath(projection);

  const mapGroup = svg.append("g");
  const australiaInsetGroup = svg
    .append("g")
    .attr("transform", `translate(${width * 0.27}, ${height * 0.09})`);
  const maltaInsetGroup = svg
    .append("g")
    .attr("transform", `translate(${width * 0.5}, ${height * 0.88})`);
  const ausW = 135,
    ausH = 90,
    malW = 55,
    malH = 35;
  const australiaProjection = d3.geoMercator().fitExtent(
    [
      [9, 9],
      [ausW - 9, ausH - 9],
    ],
    australiaData,
  );
  const australiaPath = d3.geoPath(australiaProjection);
  const maltaProjection = d3.geoMercator();
  let maltaPath = null;
  if (maltaData) {
    maltaProjection.fitExtent(
      [
        [5, 5],
        [malW - 5, malH - 5],
      ],
      maltaData,
    );
    maltaPath = d3.geoPath(maltaProjection);
  }

  function getEntry(feature) {
    return yearMap.get(countryKey(getName(feature)));
  }
  function getArtistSong(country) {
    return (artistSongByYearCountry.get(selectedYear) || new Map()).get(
      country,
    );
  }
  function countryFill(entry, name) {
    if (!entry) return "#d9d9d9";

    const key = countryKey(name);

    if (key === selectedCountry && entry.place_final === 1) return "#8c6d1f";
    if (key === selectedCountry) return "#1f4e79";
    if (entry.place_final === 1) return "#d4af37";

    return "#9ecae1";
  }

  function apply(selection) {
    selection
      .attr("fill", (d) => countryFill(getEntry(d), getName(d)))
      .attr("stroke", (d) =>
        countryKey(getName(d)) === selectedCountry ? "#08306b" : "#fff",
      )
      .attr("stroke-width", (d) =>
        countryKey(getName(d)) === selectedCountry ? 2.5 : 0.8,
      )
      .style("cursor", (d) => (getEntry(d) ? "pointer" : "default"))
      .on("mouseover", function (event, d) {
        const entry = getEntry(d);
        if (!entry) return;

        const as = getArtistSong(entry.country);

        d3.select(this).attr("stroke", "#222").attr("stroke-width", 2);

        tooltip
          .style("visibility", "visible")
          .html(
            `<strong>${entry.country}</strong><br>Singer: ${as?.artist || "N/A"}<br>Song: ${as?.song || "N/A"}<br>Final place: ${entry.place_final}`,
          );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", `${event.pageY + 12}px`)
          .style("left", `${event.pageX + 12}px`);
      })
      .on("mouseout", function (event, d) {
        const entry = getEntry(d);
        const name = getName(d);
        const key = countryKey(name);

        d3.select(this)
          .attr("fill", countryFill(entry, name))
          .attr("stroke", key === selectedCountry ? "#000000" : "#fff")
          .attr("stroke-width", key === selectedCountry ? 2.5 : 0.8);

        tooltip.style("visibility", "hidden");
      })
      .on("click", function (event, d) {
        const entry = getEntry(d);
        if (!entry) return;

        showYoutube(entry, getArtistSong(entry.country));
        selectCountry(entry.country);
      });
  }

  const mapCountries = mapGroup
    .selectAll("path.country")
    .data(mapData.features)
    .join("path")
    .attr("class", "country")
    .attr("d", path);
  apply(mapCountries);
  if (maltaFeature) {
    const c = path.centroid(maltaFeature);
    svg
      .append("line")
      .attr("x1", c[0])
      .attr("y1", c[1])
      .attr("x2", width * 0.5 + 27.5)
      .attr("y2", height * 0.88)
      .attr("stroke", "#555")
      .attr("stroke-width", 1.4)
      .attr("stroke-dasharray", "4,3");
    svg
      .append("circle")
      .attr("cx", c[0])
      .attr("cy", c[1])
      .attr("r", 4)
      .attr("fill", "white")
      .attr("stroke", "#555")
      .attr("stroke-width", 1.2);
  }
  australiaInsetGroup
    .append("rect")
    .attr("width", ausW)
    .attr("height", ausH)
    .attr("fill", "none")
    .attr("stroke", "#8f8f8f")
    .attr("stroke-width", 1.2);
  const ausCountries = australiaInsetGroup
    .selectAll("path.country")
    .data(australiaData.features)
    .join("path")
    .attr("class", "country")
    .attr("d", australiaPath)
    .attr("stroke", "#8f8f8f");
  apply(ausCountries);
  if (maltaData) {
    maltaInsetGroup
      .append("rect")
      .attr("width", malW)
      .attr("height", malH)
      .attr("fill", "none")
      .attr("stroke", "#777")
      .attr("stroke-width", 1.2)
      .attr("stroke-dasharray", "4,3");
    const maltaCountries = maltaInsetGroup
      .selectAll("path.country")
      .data(maltaData.features)
      .join("path")
      .attr("class", "country")
      .attr("d", maltaPath);
    apply(maltaCountries);
  }
}

function renderChord(data) {
  const wrap = document.getElementById("chord-wrap");
  d3.select(wrap).selectAll("*").remove();

  const filteredData = data.filter(
    (d) => +d.year === selectedYear && +d.points > 0,
  );

  const countryRegion = new Map();
  for (const d of data) {
    if (d.to_country && d.to_region)
      countryRegion.set(d.to_country, d.to_region);
    if (d.from_country && d.from_region)
      countryRegion.set(d.from_country, d.from_region);
  }

  const countries = Array.from(
    new Set(filteredData.flatMap((d) => [d.from_country, d.to_country])),
  ).sort((a, b) => {
    const ra = countryRegion.get(a) ?? "Other";
    const rb = countryRegion.get(b) ?? "Other";
    return (
      regionsOrder.indexOf(ra) - regionsOrder.indexOf(rb) || d3.ascending(a, b)
    );
  });

  const index = new Map(countries.map((d, i) => [d, i]));
  const matrix = Array.from({ length: countries.length }, () =>
    Array(countries.length).fill(0),
  );

  for (const d of filteredData) {
    const i = index.get(d.from_country);
    const j = index.get(d.to_country);
    if (i !== undefined && j !== undefined) matrix[i][j] += +d.points;
  }

  const width = 720;
  const height = 720;
  const outerRadius = Math.min(width, height) * 0.5 - 88;
  const innerRadius = outerRadius - 18;

  const svg = d3
    .create("svg")
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("width", width)
    .attr("height", height)
    .style("font", "9px sans-serif")
    .on("click", () => {
      selectedCountry = null;
      updateAll(false);
    });

  const color = d3.scaleOrdinal().domain(regionsOrder).range(regionColors);

  const chord = d3
    .chord()
    .padAngle(0.035)
    .sortSubgroups(d3.descending)
    .sortChords(d3.descending)(matrix);

  const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
  const ribbon = d3.ribbon().radius(innerRadius);
  const nodeRegion = (name) => countryRegion.get(name) ?? "Other";

  svg
    .append("text")
    .attr("x", 0)
    .attr("y", -height / 2 + 24)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold");

  const ribbons = svg
    .append("g")
    .selectAll("path")
    .data(chord)
    .join("path")
    .attr("d", ribbon)
    .attr("fill", (d) => color(nodeRegion(countries[d.source.index])))
    .attr("stroke", (d) =>
      d3.rgb(color(nodeRegion(countries[d.source.index]))).darker(),
    )
    .attr("fill-opacity", (d) => {
      if (!selectedCountry) return 0.45;
      return countries[d.source.index] === selectedCountry ||
        countries[d.target.index] === selectedCountry
        ? 0.85
        : 0.05;
    })
    .attr("stroke-opacity", (d) => {
      if (!selectedCountry) return 0.7;
      return countries[d.source.index] === selectedCountry ||
        countries[d.target.index] === selectedCountry
        ? 0.9
        : 0.04;
    })
    .style("cursor", "pointer")
    .on("click", function (event, d) {
      event.stopPropagation();
      selectCountry(countries[d.source.index]);
    });

  ribbons.append("title").text(
    (d) => `${countries[d.source.index]} → ${countries[d.target.index]}
Points: ${d.source.value}

${countries[d.target.index]} → ${countries[d.source.index]}
Points: ${d.target.value}`,
  );

  const group = svg
    .append("g")
    .selectAll("g")
    .data(chord.groups)
    .join("g")
    .style("cursor", "pointer")
    .on("click", function (event, d) {
      event.stopPropagation();
      selectCountry(countries[d.index]);
    });

  group
    .append("path")
    .attr("fill", (d) => color(nodeRegion(countries[d.index])))
    .attr("stroke", (d) =>
      selectedCountry === countries[d.index]
        ? "#111827"
        : d3.rgb(color(nodeRegion(countries[d.index]))).darker(),
    )
    .attr("stroke-width", (d) =>
      selectedCountry === countries[d.index] ? 2.5 : 1,
    )
    .attr("opacity", (d) =>
      !selectedCountry || selectedCountry === countries[d.index] ? 1 : 0.25,
    )
    .attr("d", arc)
    .append("title")
    .text(
      (d) => `${countries[d.index]}
Region: ${nodeRegion(countries[d.index])}`,
    );

  group
    .append("text")
    .each((d) => (d.angle = (d.startAngle + d.endAngle) / 2))
    .attr("dy", ".35em")
    .attr(
      "transform",
      (d) =>
        `rotate(${(d.angle * 180) / Math.PI - 90}) translate(${outerRadius + 6}) ${d.angle > Math.PI ? "rotate(180)" : ""}`,
    )
    .attr("text-anchor", (d) => (d.angle > Math.PI ? "end" : "start"))
    .attr("fill", (d) =>
      selectedCountry === countries[d.index] ? "#111827" : "#374151",
    )
    .attr("font-weight", (d) =>
      selectedCountry === countries[d.index] ? 700 : 400,
    )
    .attr("opacity", (d) =>
      !selectedCountry || selectedCountry === countries[d.index] ? 1 : 0.3,
    )
    .text((d) => countries[d.index]);

  const legend = svg
    .append("g")
    .attr("transform", `translate(${-width / 2 + 22},${-height / 2 + 15})`);

  legend
    .selectAll("rect")
    .data(regionsOrder)
    .join("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 18)
    .attr("width", 12)
    .attr("height", 12)
    .attr("fill", (d) => color(d));

  legend
    .selectAll("text")
    .data(regionsOrder)
    .join("text")
    .attr("x", 18)
    .attr("y", (d, i) => i * 18 + 10)
    .style("font-size", "11px")
    .text((d) => d);

  wrap.appendChild(svg.node());
}

function renderParallel(scoresWide, contestants) {
  const wrap = document.getElementById("par-wrap");
  d3.select("#par-svg").selectAll("*").remove();

  const width = wrap.clientWidth;
  const height = wrap.clientHeight;
  if (!width || !height) return;

  const MAX_PTS = 460;
  const LINE_COLOR = "#9ecae1";
  const DOT_COLOR = "#9ecae1";

  const flagMap = {
    Albania: "al",
    Armenia: "am",
    Australia: "au",
    Austria: "at",
    Azerbaijan: "az",
    Belgium: "be",
    Bulgaria: "bg",
    Croatia: "hr",
    Cyprus: "cy",
    Czechia: "cz",
    Denmark: "dk",
    Estonia: "ee",
    Finland: "fi",
    France: "fr",
    Georgia: "ge",
    Germany: "de",
    Greece: "gr",
    Iceland: "is",
    Ireland: "ie",
    Israel: "il",
    Italy: "it",
    Latvia: "lv",
    Lithuania: "lt",
    Malta: "mt",
    Moldova: "md",
    Netherlands: "nl",
    Norway: "no",
    Poland: "pl",
    Portugal: "pt",
    Romania: "ro",
    Russia: "ru",
    "San Marino": "sm",
    Serbia: "rs",
    Slovenia: "si",
    Spain: "es",
    Sweden: "se",
    Switzerland: "ch",
    Ukraine: "ua",
    "United Kingdom": "gb",
    Belarus: "by",
    Hungary: "hu",
    "North Macedonia": "mk",
  };

  const flagURL = (country) =>
    flagMap[country] ? `https://flagcdn.com/w20/${flagMap[country]}.png` : "";

  const placeByYearCountry = d3.rollup(
    contestants.filter((d) => d.place_final != null && !isNaN(+d.place_final)),
    (v) => +v[0].place_final,
    (d) => +d.year,
    (d) => d.to_country,
  );

  const rows = scoresWide
    .filter((d) => +d.year === selectedYear)
    .map((d) => ({
      ...d,
      place: (placeByYearCountry.get(+d.year) || new Map()).get(d.country),
    }));

  if (!rows.length) return;

  const M = { top: 45, right: 70, bottom: 24, left: 70 };
  const iW = width - M.left - M.right;
  const iH = height - M.top - M.bottom;
  const xJ = M.left;
  const xM = M.left + iW / 2;
  const xT = M.left + iW;

  const yScale = d3
    .scaleLinear()
    .domain([0, MAX_PTS])
    .range([M.top + iH, M.top]);

  const curve = d3.line().curve(d3.curveBasis);

  const sorted = [...rows].sort((a, b) => (a.place || 99) - (b.place || 99));
  const midY = new Map(
    sorted.map((d, i) => [
      d.country,
      M.top + (rows.length === 1 ? iH / 2 : (i * iH) / (rows.length - 1)),
    ]),
  );

  const svg = d3
    .select("#par-svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("font-family", "Inter, sans-serif")
    .style("background", "#0f2f5")
    .style("border-radius", "8px");

  for (const v of [0, 50, 100, 150, 200, 250, 300, 350, 400, 450]) {
    const y = yScale(v);
    svg
      .append("line")
      .attr("x1", xJ)
      .attr("x2", xT)
      .attr("y1", y)
      .attr("y2", y)
      .attr("stroke", "#dbeafe");

    svg
      .append("text")
      .attr("x", xJ - 8)
      .attr("y", y + 3.5)
      .attr("text-anchor", "end")
      .attr("fill", "#9ca3af")
      .attr("font-size", 8)
      .text(v);

    svg
      .append("text")
      .attr("x", xT + 8)
      .attr("y", y + 3.5)
      .attr("fill", "#9ca3af")
      .attr("font-size", 8)
      .text(v);
  }

  for (const x of [xJ, xT]) {
    svg
      .append("line")
      .attr("x1", x)
      .attr("x2", x)
      .attr("y1", M.top)
      .attr("y2", M.top + iH)
      .attr("stroke", "#c8d4e4")
      .attr("stroke-width", 1.5);
  }

  for (const [x, label, fill, italic] of [
    [xJ, "JURY POINTS", "#6b7280", false],
    [xM, "COUNTRIES", "#6b7280", true],
    [xT, "PUBLIC POINTS", "#6b7280", false],
  ]) {
    svg
      .append("text")
      .attr("x", x)
      .attr("y", M.top - 22)
      .attr("text-anchor", "middle")
      .attr("fill", fill)
      .attr("font-size", 10)
      .attr("font-weight", 700)
      .attr("letter-spacing", ".09em")
      .attr("font-style", italic ? "italic" : "normal")
      .text(label);
  }

  const g = svg.append("g");
  const refs = new Map();

  function applySelection(sel) {
    for (const [country, r] of refs) {
      const isSelected = sel === country;
      const isFaded = sel !== null && !isSelected;

      r.pathL
        .attr("stroke", LINE_COLOR)
        .attr("stroke-width", isSelected ? 3 : r.sw)
        .attr("opacity", isFaded ? 0.07 : isSelected ? 1 : r.op);
      r.pathR
        .attr("stroke", LINE_COLOR)
        .attr("stroke-width", isSelected ? 3 : r.sw)
        .attr("opacity", isFaded ? 0.07 : isSelected ? 1 : r.op);

      r.dJ
        .attr("fill", DOT_COLOR)
        .attr("r", isSelected ? 5 : 3.5)
        .attr("opacity", isFaded ? 0.1 : isSelected ? 1 : 0.55);
      r.dT
        .attr("fill", DOT_COLOR)
        .attr("r", isSelected ? 5 : 3.5)
        .attr("opacity", isFaded ? 0.1 : isSelected ? 1 : 0.55);

      r.flag
        .attr("width", isSelected ? 16 : 12)
        .attr("height", isSelected ? 16 : 12)
        .attr("x", xM - (isSelected ? 8 : 6))
        .attr("y", r.my - (isSelected ? 8 : 6))
        .attr("opacity", isFaded ? 0.18 : 1);

      r.lbl
        .attr("fill", isFaded ? "#c8d0dc" : "#374151")
        .attr("font-weight", isSelected ? 700 : null);
    }
  }

  svg.on("click", () => {
    selectedCountry = null;
    applySelection(null);
  });

  for (const d of rows) {
    const jy = yScale(d.jury);
    const ty = yScale(d.tele);
    const my = midY.get(d.country);
    const isExtreme = Math.abs(d.bias) > 100;
    const sw = 1.5;
    const op = 0.5;

    const ptsL = [
      [xJ, jy],
      [xJ + (xM - xJ) * 0.38, jy],
      [xJ + (xM - xJ) * 0.62, my],
      [xM, my],
    ];
    const ptsR = [
      [xM, my],
      [xM + (xT - xM) * 0.38, my],
      [xM + (xT - xM) * 0.62, ty],
      [xT, ty],
    ];

    const pathL = g
      .append("path")
      .datum(ptsL)
      .attr("d", curve)
      .attr("fill", "none")
      .attr("stroke", LINE_COLOR)
      .attr("stroke-width", sw)
      .attr("opacity", op);

    const pathR = g
      .append("path")
      .datum(ptsR)
      .attr("d", curve)
      .attr("fill", "none")
      .attr("stroke", LINE_COLOR)
      .attr("stroke-width", sw)
      .attr("opacity", op);

    const dJ = g
      .append("circle")
      .attr("cx", xJ)
      .attr("cy", jy)
      .attr("r", 3.5)
      .attr("fill", DOT_COLOR)
      .attr("opacity", 0.55);

    const dT = g
      .append("circle")
      .attr("cx", xT)
      .attr("cy", ty)
      .attr("r", 3.5)
      .attr("fill", DOT_COLOR)
      .attr("opacity", 0.55);

    const flag = g
      .append("image")
      .attr("x", xM - 6)
      .attr("y", my - 6)
      .attr("width", 12)
      .attr("height", 12)
      .attr("href", flagURL(d.country))
      .style("cursor", "pointer");

    const lbl = g
      .append("text")
      .attr("x", xM + 10)
      .attr("y", my + 3.5)
      .attr("fill", "#374151")
      .attr("font-size", rows.length > 25 ? 8 : 9)
      .text(d.country)
      .style("cursor", "pointer");

    refs.set(d.country, { pathL, pathR, dJ, dT, flag, lbl, sw, op, my });

    function selectThis(event) {
      event.stopPropagation();
      selectCountry(d.country);
    }

    for (const pts of [ptsL, ptsR]) {
      g.append("path")
        .datum(pts)
        .attr("d", curve)
        .attr("fill", "none")
        .attr("stroke", "transparent")
        .attr("stroke-width", 14)
        .style("cursor", "pointer")
        .on("click", selectThis)
        .on("mouseenter", () => applySelection(d.country))
        .on("mouseleave", () => applySelection(selectedCountry));
    }

    flag
      .on("click", selectThis)
      .on("mouseenter", () => applySelection(d.country))
      .on("mouseleave", () => applySelection(selectedCountry));

    lbl
      .on("click", selectThis)
      .on("mouseenter", () => applySelection(d.country))
      .on("mouseleave", () => applySelection(selectedCountry));
  }

  applySelection(selectedCountry);
}

window.addEventListener("resize", () => {
  if (appData) updateAll(false);
});
