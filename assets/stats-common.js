/**
 * Shared helpers for index.html and unified.html.
 */
export function createFormatters() {
  return {
    fmt: new Intl.NumberFormat("de-CH"),
    pctFmt: new Intl.NumberFormat("de-CH", {
      style: "percent",
      maximumFractionDigits: 1,
    }),
    decFmt: new Intl.NumberFormat("de-CH", { maximumFractionDigits: 1 }),
  };
}

export function chartColors() {
  const css = getComputedStyle(document.documentElement);
  return {
    accent: css.getPropertyValue("--color-accent").trim(),
    eu: css.getPropertyValue("--color-eu").trim(),
    ww: css.getPropertyValue("--color-ww").trim(),
    bgSoft: css.getPropertyValue("--color-bg-soft").trim(),
  };
}

export function fillTable(tbody, rows, activeYear) {
  tbody.innerHTML = "";
  rows.forEach((r) => {
    const tr = document.createElement("tr");
    if (r.year != null && r.year === activeYear) tr.className = "is-highlight";
    r.cols.forEach((text, i) => {
      const td = document.createElement("td");
      td.textContent = text;
      if (i > 0) td.className = "num";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

export function renderKpiCards(container, cards) {
  container.innerHTML = "";
  cards.forEach((c, i) => {
    const card = document.createElement("div");
    card.className = "stat-card flip";
    card.style.animationDelay = i * 60 + "ms";
    const vEl = document.createElement("div");
    vEl.className = "v";
    vEl.textContent = c.v;
    const kEl = document.createElement("div");
    kEl.className = "k";
    kEl.textContent = c.k;
    card.appendChild(vEl);
    card.appendChild(kEl);
    container.appendChild(card);
  });
}

export function renderDescList(dl, items) {
  dl.innerHTML = "";
  items.forEach(([label, val]) => {
    const wrap = document.createElement("div");
    wrap.className = "desc-item";
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = val;
    wrap.appendChild(dt);
    wrap.appendChild(dd);
    dl.appendChild(wrap);
  });
}

export function renderDatasetInfo(data, rootId = "datasetInfo") {
  const root = document.getElementById(rootId);
  if (!root || !data?.dataset) return;

  const d = data.dataset;
  root.innerHTML = "";

  const intro = document.createElement("p");
  intro.className = "panel-intro dataset-intro";
  intro.textContent = d.summary || "";
  root.appendChild(intro);

  const meta = document.createElement("dl");
  meta.className = "dataset-meta";
  [
    ["Quelldatei", d.source_file],
    ["Offizieller Titel", d.official_title],
    ["Zeitraum", d.period],
    ["Zeilen / Zellen", d.size_label],
    ["Format", d.format],
    d.link ? ["STAT-TAB", null] : null,
  ]
    .filter(Boolean)
    .forEach(([label, val]) => {
      const item = document.createElement("div");
      item.className = "dataset-meta-item";
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      if (label === "STAT-TAB" && d.link) {
        const a = document.createElement("a");
        a.href = d.link;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = d.link;
        dd.appendChild(a);
      } else {
        dd.textContent = val || "—";
      }
      item.appendChild(dt);
      item.appendChild(dd);
      meta.appendChild(item);
    });
  root.appendChild(meta);

  if (d.notes?.length) {
    const notes = document.createElement("ul");
    notes.className = "dataset-notes";
    d.notes.forEach((n) => {
      const li = document.createElement("li");
      li.textContent = n;
      notes.appendChild(li);
    });
    root.appendChild(notes);
  }

  if (d.variables?.length) {
    const h = document.createElement("h3");
    h.className = "dataset-vars-title";
    h.textContent = "Variablen und Codes";
    root.appendChild(h);

    const wrap = document.createElement("div");
    wrap.className = "data-table-wrap";
    const table = document.createElement("table");
    table.className = "data-table dataset-vars-table";
    table.innerHTML =
      "<thead><tr><th scope='col'>Variable</th><th scope='col'>Bedeutung</th><th scope='col'>Werte</th></tr></thead>";
    const tbody = document.createElement("tbody");
    d.variables.forEach((v) => {
      const tr = document.createElement("tr");
      [v.name, v.description, v.values_label || v.values?.join(", ") || "—"].forEach(
        (text, i) => {
          const td = document.createElement("td");
          td.textContent = text;
          if (i === 2) td.className = "values-cell";
          tr.appendChild(td);
        }
      );
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    root.appendChild(wrap);
  }

  if (d.dimensions?.length) {
    const h = document.createElement("h3");
    h.className = "dataset-vars-title";
    h.textContent = "Dimensionen (PX-Tabelle)";
    root.appendChild(h);
    const list = document.createElement("ul");
    list.className = "dataset-dim-list";
    d.dimensions.forEach((dim) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${dim.name}</strong> (${dim.count} Stufen): ${dim.sample}`;
      list.appendChild(li);
    });
    root.appendChild(list);
  }
}

