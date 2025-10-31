// app.js
// Aktualisiert: "Torbild" sichtbar als "Goal Map"; Season Map read-only (keine Marker/Points setzen);
// Timer-Button links + heller; marker-creation only active on Goal Map (torbildPage).
// Komplette Datei zur direkten Übernahme.

document.addEventListener("DOMContentLoaded", () => {
  // --- Elements ---
  const pages = {
    selection: document.getElementById("playerSelectionPage"),
    stats: document.getElementById("statsPage"),
    torbild: document.getElementById("torbildPage"), // visible label "Goal Map"
    season: document.getElementById("seasonPage"),
    seasonMap: document.getElementById("seasonMapPage")
  };
  const playerListContainer = document.getElementById("playerList");
  const confirmSelectionBtn = document.getElementById("confirmSelection");
  const statsContainer = document.getElementById("statsContainer");
  const torbildBtn = document.getElementById("torbildBtn"); // visible "Goal Map"
  const backToStatsBtn = document.getElementById("backToStatsBtn");
  const timerBtn = document.getElementById("timerBtn");
  const selectPlayersBtn = document.getElementById("selectPlayersBtn");
  const exportBtn = document.getElementById("exportBtn");
  const resetBtn = document.getElementById("resetBtn");
  const seasonBtn = document.getElementById("seasonBtn");
  const seasonMapBtn = document.getElementById("seasonMapBtn");
  const backToStatsFromSeasonBtn = document.getElementById("backToStatsFromSeasonBtn");
  const backToStatsFromSeasonMapBtn = document.getElementById("backToStatsFromSeasonMapBtn");
  const seasonContainer = document.getElementById("seasonContainer");
  const statsScrollContainer = document.getElementById("statsScrollContainer");
  const stickyHeader = document.getElementById("stickyHeader");

  const exportSeasonFromStatsBtn = document.getElementById("exportSeasonFromStatsBtn");
  const exportSeasonMapBtn = document.getElementById("exportSeasonMapBtn");
  const exportSeasonBtn = document.getElementById("exportSeasonBtn");

  const torbildBoxesSelector = "#torbildPage .field-box, #torbildPage .goal-img-box";
  const seasonMapBoxesSelector = "#seasonMapPage .field-box, #seasonMapPage .goal-img-box";

  const torbildTimeTrackingBox = document.getElementById("timeTrackingBox");
  const seasonMapTimeTrackingBox = document.getElementById("seasonTimeTrackingBox");

  // --- Dark/Light Mode automatisch setzen ---
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  // --- Data ---
  const players = [
    { num: 4, name: "Ondrej Kastner" }, { num: 5, name: "Raphael Oehninger" },
    { num: 6, name: "Nuno Meier" }, { num: 7, name: "Silas Teuber" },
    { num: 8, name: "Diego Warth" }, { num: 9, name: "Mattia Crameri" },
    { num: 10, name: "Mael Bernath" }, { num: 11, name: "Sean Nef" },
    { num: 12, name: "Rafael Burri" }, { num: 13, name: "Lenny Schwarz" },
    { num: 14, name: "David Lienert" }, { num: 15, name: "Neven Severini" },
    { num: 16, name: "Nils Koubek" }, { num: 17, name: "Lio Kundert" },
    { num: 18, name: "Livio Berner" }, { num: 19, name: "Robin Strasser" },
    { num: 21, name: "Marlon Kreyenbühl" }, { num: 22, name: "Martin Lana" },
    { num: 23, name: "Manuel Isler" }, { num: 24, name: "Moris Hürlimann" },
    { num: "", name: "Levi Baumann" }, { num: "", name: "Corsin Blapp" },
    { num: "", name: "Lenny Zimmermann" }, { num: "", name: "Luke Böhmichen" },
    { num: "", name: "Livio Weissen" }, { num: "", name: "Raul Wütrich" },
    { num: "", name: "Marco Senn" }
  ];

  const categories = ["Shot", "Goals", "Assist", "+/-", "FaceOffs", "FaceOffs Won", "Penaltys"];

  // persistent state
  let selectedPlayers = JSON.parse(localStorage.getItem("selectedPlayers")) || [];
  let statsData = JSON.parse(localStorage.getItem("statsData")) || {};
  let playerTimes = JSON.parse(localStorage.getItem("playerTimes")) || {};
  let activeTimers = {}; // playerName -> intervalId
  let timerSeconds = Number(localStorage.getItem("timerSeconds")) || 0;
  let timerInterval = null;
  let timerRunning = false;

  // season aggregated data (persistent)
  let seasonData = JSON.parse(localStorage.getItem("seasonData")) || {}; // keyed by player name

  // --- Sticky header helper ---
  function updateStickyHeaderHeight() {
    const h = stickyHeader ? stickyHeader.offsetHeight : 56;
    document.documentElement.style.setProperty("--sticky-header-height", `${h}px`);
  }
  updateStickyHeaderHeight();
  window.addEventListener("resize", updateStickyHeaderHeight);

  // --- Render player selection ---
  function renderPlayerSelection() {
    if (!playerListContainer) {
      console.error("playerList container not found");
      return;
    }
    playerListContainer.innerHTML = "";

    players.slice()
      .sort((a,b) => {
        const na = Number(a.num) || 999;
        const nb = Number(b.num) || 999;
        return na - nb;
      })
      .forEach(p => {
        const li = document.createElement("li");
        const checked = selectedPlayers.find(sp => sp.name === p.name) ? "checked" : "";
        li.innerHTML = `
          <label class="player-line" style="display:flex;align-items:center;gap:8px;width:100%;">
            <input type="checkbox" value="${p.num}|${p.name}" ${checked} style="flex:0 0 auto">
            <div class="num" style="flex:0 0 48px;text-align:center;"><strong>${p.num || "-"}</strong></div>
            <div class="name" style="flex:1;color:#eee;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><strong>${p.name}</strong></div>
          </label>`;
        playerListContainer.appendChild(li);
      });

    // two custom lines for user-defined players
    const customSelected = selectedPlayers.filter(sp => !players.some(bp => bp.name === sp.name));
    for (let i = 0; i < 2; i++) {
      const pre = customSelected[i];
      const li = document.createElement("li");
      li.innerHTML = `
        <label class="custom-line" style="display:flex;align-items:center;gap:8px;width:100%;">
          <input type="checkbox" class="custom-checkbox" ${pre ? "checked" : ""} style="flex:0 0 auto">
          <input type="text" class="custom-num" inputmode="numeric" maxlength="3" placeholder="Nr." value="${pre?.num || ""}" style="width:56px;flex:0 0 auto;text-align:center;">
          <input type="text" class="custom-name" placeholder="Eigener Spielername" value="${pre?.name || ""}" style="flex:1;min-width:0;">
        </label>`;
      playerListContainer.appendChild(li);
    }
  }

  // --- Confirm selection handler ---
  confirmSelectionBtn.addEventListener("click", () => {
    selectedPlayers = Array.from(playerListContainer.querySelectorAll("input[type='checkbox']:not(.custom-checkbox)"))
      .filter(chk => chk.checked)
      .map(chk => {
        const [num, name] = chk.value.split("|");
        return { num, name };
      });

    // handle custom
    const allLis = Array.from(playerListContainer.querySelectorAll("li"));
    const customLis = allLis.slice(players.length);
    customLis.forEach(li => {
      const chk = li.querySelector(".custom-checkbox");
      const numInput = li.querySelector(".custom-num");
      const nameInput = li.querySelector(".custom-name");
      if (chk && chk.checked && nameInput && nameInput.value.trim() !== "") {
        selectedPlayers.push({ num: numInput.value.trim(), name: nameInput.value.trim() });
      }
    });

    localStorage.setItem("selectedPlayers", JSON.stringify(selectedPlayers));

    // ensure statsData exists for selected players
    selectedPlayers.forEach(p => {
      if (!statsData[p.name]) statsData[p.name] = {};
      categories.forEach(c => { if (statsData[p.name][c] === undefined) statsData[p.name][c] = 0; });
    });
    localStorage.setItem("statsData", JSON.stringify(statsData));

    showPage("stats");
    renderStatsTable();
  });

  // expose renderPlayerSelection
  window.__renderPlayerSelection = renderPlayerSelection;

  // --- Ice time colors ---
  function updateIceTimeColors() {
    const iceTimes = selectedPlayers.map(p => ({ name: p.name, seconds: playerTimes[p.name] || 0 }));
    const sortedDesc = iceTimes.slice().sort((a,b) => b.seconds - a.seconds);
    const top5 = new Set(sortedDesc.slice(0,5).map(x => x.name));
    const sortedAsc = iceTimes.slice().sort((a,b) => a.seconds - b.seconds);
    const bottom5 = new Set(sortedAsc.slice(0,5).map(x => x.name));

    if (!statsContainer) return;
    statsContainer.querySelectorAll(".ice-time-cell").forEach(cell => {
      const player = cell.dataset.player;
      if (top5.has(player)) cell.style.color = getComputedStyle(document.documentElement).getPropertyValue('--ice-top')?.trim() || "#00c06f";
      else if (bottom5.has(player)) cell.style.color = getComputedStyle(document.documentElement).getPropertyValue('--ice-bottom')?.trim() || "#ff4c4c";
      else cell.style.color = getComputedStyle(document.documentElement).getPropertyValue('--cell-zero-color')?.trim() || "#ffffff";
    });
  }

  // --- Render stats table (unchanged) ---
  function renderStatsTable() {
    if (!statsContainer) return;
    statsContainer.innerHTML = "";

    const table = document.createElement("table");
    table.className = "stats-table";

    // thead
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `<th>#</th><th>Spieler</th>` + categories.map(c => `<th>${c}</th>`).join("") + `<th>Time</th>`;
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // tbody
    const tbody = document.createElement("tbody");
    selectedPlayers.forEach((p, idx) => {
      const tr = document.createElement("tr");
      tr.classList.add(idx % 2 === 0 ? "even-row" : "odd-row");

      // number & name
      const numTd = document.createElement("td");
      numTd.innerHTML = `<strong>${p.num || "-"}</strong>`;
      tr.appendChild(numTd);

      const nameTd = document.createElement("td");
      nameTd.style.cssText = "text-align:left;padding-left:12px;cursor:pointer;";
      nameTd.innerHTML = `<strong>${p.name}</strong>`;
      tr.appendChild(nameTd);

      // categories
      categories.forEach(c => {
        const td = document.createElement("td");
        const val = statsData[p.name]?.[c] ?? 0;
        const posColor = getComputedStyle(document.documentElement).getPropertyValue('--cell-pos-color')?.trim() || "#00ff80";
        const negColor = getComputedStyle(document.documentElement).getPropertyValue('--cell-neg-color')?.trim() || "#ff4c4c";
        const zeroColor = getComputedStyle(document.documentElement).getPropertyValue('--cell-zero-color')?.trim() || "#ffffff";
        const color = val > 0 ? posColor : val < 0 ? negColor : zeroColor;
        td.dataset.player = p.name;
        td.dataset.cat = c;
        td.style.color = color;
        td.textContent = val;
        tr.appendChild(td);
      });

      // ice time
      const iceTd = document.createElement("td");
      iceTd.className = "ice-time-cell";
      iceTd.dataset.player = p.name;
      const seconds = playerTimes[p.name] || 0;
      const m = String(Math.floor(seconds / 60)).padStart(2,"0");
      const s = String(seconds % 60).padStart(2,"0");
      iceTd.textContent = `${m}:${s}`;
      tr.appendChild(iceTd);

      tbody.appendChild(tr);
    });

    // totals row
    const totalsRow = document.createElement("tr");
    totalsRow.id = "totalsRow";
    const tdEmpty = document.createElement("td"); tdEmpty.textContent = "";
    const tdTotalLabel = document.createElement("td"); tdTotalLabel.textContent = `Total (${selectedPlayers.length})`;
    totalsRow.appendChild(tdEmpty);
    totalsRow.appendChild(tdTotalLabel);
    categories.forEach(c => {
      const td = document.createElement("td");
      td.className = "total-cell";
      td.dataset.cat = c;
      td.textContent = "0";
      totalsRow.appendChild(td);
    });
    // add empty Time total cell
    const tdTimeTotal = document.createElement("td");
    tdTimeTotal.className = "total-cell";
    tdTimeTotal.dataset.cat = "Time";
    tdTimeTotal.textContent = "";
    totalsRow.appendChild(tdTimeTotal);

    tbody.appendChild(totalsRow);

    table.appendChild(tbody);
    statsContainer.appendChild(table);

    // attach click/dblclick to stat cells (single/double)
    statsContainer.querySelectorAll("td[data-player]").forEach(td => {
      let clickTimeout = null;
      td.addEventListener("click", (e) => {
        if (clickTimeout) clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
          changeValue(td, 1);
          clickTimeout = null;
        }, 200);
      });
      td.addEventListener("dblclick", (e) => {
        e.preventDefault();
        if (clickTimeout) { clearTimeout(clickTimeout); clickTimeout = null; }
        changeValue(td, -1);
      });
    });

    // per-player timers on name click
    statsContainer.querySelectorAll("td:nth-child(2)").forEach(td => {
      const playerName = td.textContent.trim();
      if (activeTimers[playerName]) td.style.backgroundColor = "#005c2f";
      else td.style.backgroundColor = "";

      td.addEventListener("click", () => {
        if (activeTimers[playerName]) {
          clearInterval(activeTimers[playerName]);
          delete activeTimers[playerName];
          td.style.backgroundColor = "";
        } else {
          activeTimers[playerName] = setInterval(() => {
            playerTimes[playerName] = (playerTimes[playerName] || 0) + 1;
            localStorage.setItem("playerTimes", JSON.stringify(playerTimes));
            const sec = playerTimes[playerName];
            const mm = String(Math.floor(sec / 60)).padStart(2,"0");
            const ss = String(sec % 60).padStart(2,"0");
            const cell = statsContainer.querySelector(`.ice-time-cell[data-player="${playerName}"]`);
            if (cell) cell.textContent = `${mm}:${ss}`;
            updateIceTimeColors();
          }, 1000);
          td.style.backgroundColor = "#005c2f";
        }
      });
    });

    updateIceTimeColors();
    updateTotals();
  }

  // --- changeValue ---
  function changeValue(td, delta) {
    const player = td.dataset.player;
    const cat = td.dataset.cat;
    if (!statsData[player]) statsData[player] = {};
    statsData[player][cat] = (statsData[player][cat] || 0) + delta;
    statsData[player][cat] = Math.trunc(statsData[player][cat]);
    localStorage.setItem("statsData", JSON.stringify(statsData));
    td.textContent = statsData[player][cat];

    const val = statsData[player][cat];
    const posColor = getComputedStyle(document.documentElement).getPropertyValue('--cell-pos-color')?.trim() || "#00ff80";
    const negColor = getComputedStyle(document.documentElement).getPropertyValue('--cell-neg-color')?.trim() || "#ff4c4c";
    const zeroColor = getComputedStyle(document.documentElement).getPropertyValue('--cell-zero-color')?.trim() || "#ffffff";
    td.style.color = val > 0 ? posColor : val < 0 ? negColor : zeroColor;

    updateTotals();
  }

  // --- updateTotals ---
  function updateTotals() {
    const totals = {};
    categories.forEach(c => totals[c] = 0);
    let totalSeconds = 0;
    selectedPlayers.forEach(p => {
      categories.forEach(c => { totals[c] += (Number(statsData[p.name]?.[c]) || 0); });
      totalSeconds += (playerTimes[p.name] || 0);
    });

    document.querySelectorAll(".total-cell").forEach(tc => {
      const cat = tc.dataset.cat;
      if (cat === "+/-") {
        const vals = selectedPlayers.map(p => Number(statsData[p.name]?.[cat] || 0));
        const avg = vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
        tc.textContent = `Ø ${avg}`;
        tc.style.color = "#ffffff";
      } else if (cat === "FaceOffs Won") {
        const totalFace = totals["FaceOffs"] || 0;
        const percent = totalFace ? Math.round((totals["FaceOffs Won"]/totalFace)*100) : 0;
        const percentColor = percent > 50 ? "#00ff80" : percent < 50 ? "#ff4c4c" : "#ffffff";
        tc.innerHTML = `<span style="color:white">${totals["FaceOffs Won"]}</span> (<span style="color:${percentColor}">${percent}%</span>)`;
      } else if (cat === "FaceOffs" || ["Goal","Assist","Penaltys"].includes(cat)) {
        tc.textContent = totals[cat] || 0;
        tc.style.color = "#ffffff";
      } else if (cat === "Shot") {
        if (!tc.dataset.opp) tc.dataset.opp = 0;
        const own = totals["Shot"] || 0;
        const opp = Number(tc.dataset.opp) || 0;
        let ownColor = "#ffffff", oppColor = "#ffffff";
        if (own > opp) { ownColor = "#00ff80"; oppColor = "#ff4c4c"; }
        else if (opp > own) { ownColor = "#ff4c4c"; oppColor = "#00ff80"; }
        tc.innerHTML = `<span style="color:${ownColor}">${own}</span> <span style="color:white">vs</span> <span style="color:${oppColor}">${opp}</span>`;
        tc.onclick = () => {
          tc.dataset.opp = Number(tc.dataset.opp || 0) + 1;
          updateTotals();
        };
      } else if (cat === "Time") {
        const mm = String(Math.floor(totalSeconds / 60)).padStart(2,"0");
        const ss = String(totalSeconds % 60).padStart(2,"0");
        tc.textContent = `${mm}:${ss}`;
      } else {
        tc.textContent = totals[cat] || 0;
        const posColor = getComputedStyle(document.documentElement).getPropertyValue('--cell-pos-color')?.trim() || "#00ff80";
        const negColor = getComputedStyle(document.documentElement).getPropertyValue('--cell-neg-color')?.trim() || "#ff4c4c";
        const zeroColor = getComputedStyle(document.documentElement).getPropertyValue('--cell-zero-color')?.trim() || "#ffffff";
        tc.style.color = totals[cat] > 0 ? posColor : totals[cat] < 0 ? negColor : zeroColor;
      }
    });
  }

  // --- timer functions ---
  function updateTimerDisplay(){
    const m = String(Math.floor(timerSeconds / 60)).padStart(2,"0");
    const s = String(timerSeconds % 60).padStart(2,"0");
    if (timerBtn) timerBtn.textContent = `${m}:${s}`;
    localStorage.setItem("timerSeconds", timerSeconds.toString());
  }
  function startTimer(){
    if (!timerInterval) {
      timerInterval = setInterval(() => { timerSeconds++; updateTimerDisplay(); }, 1000);
      timerRunning = true;
      if (timerBtn) { timerBtn.classList.remove("stopped","reset"); timerBtn.classList.add("running"); }
    }
  }
  function stopTimer(){
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    timerRunning = false;
    if (timerBtn) { timerBtn.classList.remove("running","reset"); timerBtn.classList.add("stopped"); }
  }
  function resetTimerOnlyClock(){
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    timerSeconds = 0; timerRunning = false;
    updateTimerDisplay();
    if (timerBtn) { timerBtn.classList.remove("running","stopped"); timerBtn.classList.add("reset"); }
  }

  let holdTimer = null, longPress = false;
  const LONG_MS = 800;
  if (timerBtn) {
    timerBtn.addEventListener("mousedown", () => { longPress=false; holdTimer = setTimeout(()=>{ resetTimerOnlyClock(); longPress=true; }, LONG_MS); });
    timerBtn.addEventListener("mouseup", () => { if (holdTimer) clearTimeout(holdTimer); });
    timerBtn.addEventListener("mouseleave", () => { if (holdTimer) clearTimeout(holdTimer); });
    timerBtn.addEventListener("touchstart", () => { longPress=false; holdTimer = setTimeout(()=>{ resetTimerOnlyClock(); longPress=true; }, LONG_MS); }, {passive:true});
    timerBtn.addEventListener("touchend", () => { if (holdTimer) clearTimeout(holdTimer); });
    timerBtn.addEventListener("touchcancel", () => { if (holdTimer) clearTimeout(holdTimer); }, {passive:true});
    timerBtn.addEventListener("click", () => { if (longPress) { longPress=false; return; } if (timerInterval) stopTimer(); else startTimer(); });
  }

  // --- CSV export (unchanged) ---
  exportBtn.addEventListener("click", () => {
    const rows = [["Spieler", ...categories, "Time"]];
    selectedPlayers.forEach(p => {
      const seconds = playerTimes[p.name] || 0;
      const m = String(Math.floor(seconds/60)).padStart(2,"0");
      const s = String(seconds%60).padStart(2,"0");
      const iceTimeStr = `${m}:${s}`;
      const row = [p.name, ...categories.map(c => statsData[p.name]?.[c] ?? 0), iceTimeStr];
      rows.push(row);
    });
    const totalsCells = document.querySelectorAll("#totalsRow .total-cell");
    const totalsRow = ["TOTAL"];
    totalsCells.forEach(cell => totalsRow.push(cell.innerText.replace(/\n/g, " ").trim()));
    rows.push(totalsRow);
    rows.push(["Timer", timerBtn ? timerBtn.textContent : "00:00"]);
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "spielerstatistik.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // --- Marker helpers ---
  function createMarkerPercent(xPct, yPct, color, container, interactive = true) {
    const dot = document.createElement("div");
    dot.className = "marker-dot";
    dot.style.backgroundColor = color;
    dot.style.left = `${xPct}%`;
    dot.style.top = `${yPct}%`;
    if (interactive) {
      dot.addEventListener("click", (ev) => { ev.stopPropagation(); dot.remove(); });
    }
    container.appendChild(dot);
  }

  // attach handlers only to Goal Map (torbild) boxes — Season Map is read-only
  function attachMarkerHandlersToBoxes(rootSelector) {
    document.querySelectorAll(rootSelector).forEach(box => {
      const img = box.querySelector("img");
      if (!img) return;
      box.style.position = "relative";

      let mouseHoldTimer = null;
      let isLong = false;
      let lastMouseUp = 0;
      let lastTouchEnd = 0;

      function getPosFromEvent(e) {
        const rect = img.getBoundingClientRect();
        const clientX = (e.clientX !== undefined) ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX);
        const clientY = (e.clientY !== undefined) ? e.clientY : (e.touches && e.touches[0] && e.touches[0].clientY);
        const xPct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * 100;
        const yPct = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)) * 100;
        return { xPct, yPct };
      }

      function createMarkerBasedOn(pos, boxEl, longPress, forceGrey=false) {
        const id = boxEl.id;
        if (id === "goalGreenBox" || id === "goalRedBox" || longPress || forceGrey) {
          createMarkerPercent(pos.xPct, pos.yPct, "#444", boxEl, true);
          return;
        }
        if (boxEl.classList.contains("field-box")) {
          const color = pos.yPct > 50 ? "#ff0000" : "#00ff66";
          createMarkerPercent(pos.xPct, pos.yPct, color, boxEl, true);
          return;
        }
        createMarkerPercent(pos.xPct, pos.yPct, "#444", boxEl, true);
      }

      // mouse
      img.addEventListener("mousedown", (ev) => {
        isLong = false;
        mouseHoldTimer = setTimeout(() => {
          isLong = true;
          const pos = getPosFromEvent(ev);
          createMarkerBasedOn(pos, box, true);
        }, 600);
      });

      img.addEventListener("mouseup", (ev) => {
        if (mouseHoldTimer) { clearTimeout(mouseHoldTimer); mouseHoldTimer = null; }
        const now = Date.now();
        const pos = getPosFromEvent(ev);

        if (now - lastMouseUp < 300) {
          createMarkerBasedOn(pos, box, true, true);
          lastMouseUp = 0;
        } else {
          if (!isLong) createMarkerBasedOn(pos, box, false);
          lastMouseUp = now;
        }
        isLong = false;
      });

      img.addEventListener("mouseleave", () => {
        if (mouseHoldTimer) { clearTimeout(mouseHoldTimer); mouseHoldTimer = null; }
        isLong = false;
      });

      // touch
      img.addEventListener("touchstart", (ev) => {
        isLong = false;
        if (mouseHoldTimer) { clearTimeout(mouseHoldTimer); mouseHoldTimer = null; }
        mouseHoldTimer = setTimeout(() => {
          isLong = true;
          const pos = getPosFromEvent(ev.touches[0]);
          createMarkerBasedOn(pos, box, true);
        }, 600);
      }, { passive: true });

      img.addEventListener("touchend", (ev) => {
        if (mouseHoldTimer) { clearTimeout(mouseHoldTimer); mouseHoldTimer = null; }
        const now = Date.now();
        const pos = getPosFromEvent(ev.changedTouches[0]);

        if (now - lastTouchEnd < 300) {
          createMarkerBasedOn(pos, box, true, true);
          lastTouchEnd = 0;
        } else {
          if (!isLong) createMarkerBasedOn(pos, box, false);
          lastTouchEnd = now;
        }
        isLong = false;
      }, { passive: true });

      img.addEventListener("touchcancel", () => {
        if (mouseHoldTimer) { clearTimeout(mouseHoldTimer); mouseHoldTimer = null; }
        isLong = false;
      }, { passive: true });
    });
  }

  // attach only to Goal Map boxes (torbild)
  attachMarkerHandlersToBoxes(torbildBoxesSelector);
  // Do NOT attach handlers to seasonMapBoxesSelector -> read-only map

  // --- Time tracking box initialization ---
  function initTimeTrackingBox(box, storageKey = "timeData", readOnly = false) {
    if (!box) return;
    let timeDataAll = JSON.parse(localStorage.getItem(storageKey)) || {};

    box.querySelectorAll(".period").forEach(period => {
      const periodNum = period.dataset.period || Math.random().toString(36).slice(2,6);
      const buttons = period.querySelectorAll(".time-btn");

      buttons.forEach((btn, idx) => {
        const hasStored = (timeDataAll[periodNum] && typeof timeDataAll[periodNum][idx] !== "undefined");
        const stored = hasStored ? Number(timeDataAll[periodNum][idx]) : Number(btn.textContent) || 0;
        btn.textContent = stored;

        if (readOnly) {
          // disable interactions on Season Map
          btn.disabled = true;
          btn.classList.add("disabled-readonly");
          return;
        }

        let lastTap = 0;
        let clickTimeout = null;
        let touchStart = 0;

        const updateValue = (delta) => {
          const current = Number(btn.textContent) || 0;
          const newVal = Math.max(0, current + delta);
          btn.textContent = newVal;
          if (!timeDataAll[periodNum]) timeDataAll[periodNum] = {};
          timeDataAll[periodNum][idx] = newVal;
          localStorage.setItem(storageKey, JSON.stringify(timeDataAll));
        };

        btn.addEventListener("click", () => {
          const now = Date.now();
          const diff = now - lastTap;
          if (diff < 300) {
            if (clickTimeout) { clearTimeout(clickTimeout); clickTimeout = null; }
            updateValue(-1);
            lastTap = 0;
          } else {
            clickTimeout = setTimeout(() => { updateValue(+1); clickTimeout = null; }, 300);
            lastTap = now;
          }
        });

        btn.addEventListener("touchstart", (e) => {
          const now = Date.now();
          const diff = now - touchStart;
          if (diff < 300) {
            e.preventDefault();
            if (clickTimeout) { clearTimeout(clickTimeout); clickTimeout = null; }
            updateValue(-1);
            touchStart = 0;
          } else {
            touchStart = now;
            setTimeout(() => {
              if (touchStart !== 0) {
                updateValue(+1);
                touchStart = 0;
              }
            }, 300);
          }
        }, { passive: true });
      });
    });
  }

  // init torbild (interactive) and seasonMap (read-only)
  initTimeTrackingBox(torbildTimeTrackingBox, "timeData", false);
  initTimeTrackingBox(seasonMapTimeTrackingBox, "seasonMapTimeData", true);

  // --- Season Map export/import ---
  function readTimeTrackingFromBox(box) {
    const result = {};
    if (!box) return result;
    box.querySelectorAll(".period").forEach((period, pIdx) => {
      const key = period.dataset.period || (`p${pIdx}`);
      result[key] = [];
      period.querySelectorAll(".time-btn").forEach(btn => {
        result[key].push(Number(btn.textContent) || 0);
      });
    });
    return result;
  }
  function writeTimeTrackingToBox(box, data) {
    if (!box || !data) return;
    const periods = Array.from(box.querySelectorAll(".period"));
    periods.forEach((period, pIdx) => {
      const key = period.dataset.period || (`p${pIdx}`);
      const arr = data[key] || data[Object.keys(data)[pIdx]] || [];
      period.querySelectorAll(".time-btn").forEach((btn, idx) => {
        btn.textContent = (typeof arr[idx] !== "undefined") ? arr[idx] : btn.textContent;
      });
    });
  }

  function exportSeasonMapFromTorbild() {
    const boxes = Array.from(document.querySelectorAll(torbildBoxesSelector));
    const allMarkers = boxes.map(box => {
      const markers = [];
      box.querySelectorAll(".marker-dot").forEach(dot => {
        const left = dot.style.left || "";
        const top = dot.style.top || "";
        const bg = dot.style.backgroundColor || "";
        const xPct = parseFloat(left.replace("%","")) || 0;
        const yPct = parseFloat(top.replace("%","")) || 0;
        markers.push({ xPct, yPct, color: bg });
      });
      return markers;
    });
    localStorage.setItem("seasonMapMarkers", JSON.stringify(allMarkers));

    const timeData = readTimeTrackingFromBox(torbildTimeTrackingBox);
    localStorage.setItem("seasonMapTimeData", JSON.stringify(timeData));

    showPage("seasonMap");
    renderSeasonMapPage();
  }

  function renderSeasonMapPage() {
    // clear existing markers in seasonMap image boxes
    const boxes = Array.from(document.querySelectorAll(seasonMapBoxesSelector));
    boxes.forEach(box => box.querySelectorAll(".marker-dot").forEach(d => d.remove()));

    const raw = localStorage.getItem("seasonMapMarkers");
    if (raw) {
      try {
        const allMarkers = JSON.parse(raw);
        allMarkers.forEach((markersForBox, idx) => {
          const box = boxes[idx];
          if (!box || !Array.isArray(markersForBox)) return;
          markersForBox.forEach(m => {
            // create read-only markers (interactive=false)
            createMarkerPercent(m.xPct, m.yPct, m.color || "#444", box, false);
          });
        });
      } catch (e) {
        console.warn("Invalid seasonMapMarkers", e);
      }
    }

    const rawTime = localStorage.getItem("seasonMapTimeData");
    if (rawTime) {
      try {
        const tdata = JSON.parse(rawTime);
        writeTimeTrackingToBox(seasonMapTimeTrackingBox, tdata);
        // ensure time buttons remain disabled/read-only
        seasonMapTimeTrackingBox.querySelectorAll(".time-btn").forEach(btn => {
          btn.disabled = true;
          btn.classList.add("disabled-readonly");
        });
      } catch (e) {
        console.warn("Invalid seasonMapTimeData", e);
      }
    }
  }

  function resetSeasonMap() {
    if (!confirm("⚠️ Season Map zurücksetzen (Marker + Timeboxen)?")) return;
    document.querySelectorAll("#seasonMapPage .marker-dot").forEach(d => d.remove());
    document.querySelectorAll("#seasonMapPage .time-btn").forEach(btn => btn.textContent = "0");
    localStorage.removeItem("seasonMapMarkers");
    localStorage.removeItem("seasonMapTimeData");
    alert("Season Map zurückgesetzt.");
  }

  if (exportSeasonMapBtn) {
    exportSeasonMapBtn.addEventListener("click", () => {
      exportSeasonMapFromTorbild();
      alert("Season Map exportiert und geöffnet.");
    });
  }
  if (seasonMapBtn) {
    seasonMapBtn.addEventListener("click", () => {
      showPage("seasonMap");
      renderSeasonMapPage();
    });
  }
  if (backToStatsFromSeasonMapBtn) backToStatsFromSeasonMapBtn.addEventListener("click", () => showPage("stats"));
  if (document.getElementById("resetSeasonMapBtn")) document.getElementById("resetSeasonMapBtn").addEventListener("click", resetSeasonMap);

  // --- Season export (unchanged) ---
  const exportSeasonHandler = () => {
    if (!selectedPlayers || selectedPlayers.length === 0) {
      alert("Keine Spieler ausgewählt, nichts zu exportieren.");
      return;
    }
    const doExport = confirm("Exportiere die aktuellen Spieldaten in die Season-Tabelle als 1 Spiel (Game)?\n\n(Ja = exportieren)");
    if (!doExport) return;

    selectedPlayers.forEach(p => {
      const name = p.name;
      const stats = statsData[name] || {};
      const timeSeconds = Number(playerTimes[name] || 0);

      if (!seasonData[name]) {
        seasonData[name] = {
          num: p.num || "",
          name: name,
          games: 0,
          goals: 0,
          assists: 0,
          plusMinus: 0,
          shots: 0,
          penaltys: 0,
          faceOffs: 0,
          faceOffsWon: 0,
          timeSeconds: 0
        };
      }

      seasonData[name].games = Number(seasonData[name].games || 0) + 1;
      seasonData[name].goals = Number(seasonData[name].goals || 0) + Number(stats.Goals || 0);
      seasonData[name].assists = Number(seasonData[name].assists || 0) + Number(stats.Assist || 0);
      seasonData[name].plusMinus = Number(seasonData[name].plusMinus || 0) + Number(stats["+/-"] || 0);
      seasonData[name].shots = Number(seasonData[name].shots || 0) + Number(stats.Shot || 0);
      seasonData[name].penaltys = Number(seasonData[name].penaltys || 0) + Number(stats.Penaltys || 0);
      seasonData[name].faceOffs = Number(seasonData[name].faceOffs || 0) + Number(stats.FaceOffs || 0);
      seasonData[name].faceOffsWon = Number(seasonData[name].faceOffsWon || 0) + Number(stats["FaceOffs Won"] || 0);
      seasonData[name].timeSeconds = Number(seasonData[name].timeSeconds || 0) + Number(timeSeconds || 0);
      seasonData[name].num = p.num || seasonData[name].num || "";
      seasonData[name].name = name;
    });

    localStorage.setItem("seasonData", JSON.stringify(seasonData));

    const clearAfterExport = confirm("Spiel wurde exportiert. Soll das aktuelle Spiel (Stats + Time) für die exportierten Spieler zurückgesetzt werden? (OK = zurücksetzen, Abbrechen = beibehalten)");
    if (clearAfterExport) {
      selectedPlayers.forEach(p => {
        const name = p.name;
        if (!statsData[name]) statsData[name] = {};
        categories.forEach(c => { statsData[name][c] = 0; });
        playerTimes[name] = 0;
      });
      localStorage.setItem("statsData", JSON.stringify(statsData));
      localStorage.setItem("playerTimes", JSON.stringify(playerTimes));
      renderStatsTable();
    }

    showPage("season");
    renderSeasonTable();

    alert("Daten wurden als Spiel in die Season-Tabelle übernommen.");
  };

  if (exportSeasonFromStatsBtn) {
    exportSeasonFromStatsBtn.addEventListener("click", exportSeasonHandler);
  }

  // --- Season table renderer (full) ---
  // (same implementation as previous version, kept here for completeness)
  function formatTimeMMSS(sec) {
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }
  function parseForSort(val) {
    if (val === null || val === undefined) return "";
    const v = String(val).trim();
    if (v === "") return "";
    if (/^\d{1,2}:\d{2}$/.test(v)) {
      const [mm, ss] = v.split(":").map(Number);
      return mm*60 + ss;
    }
    if (/%$/.test(v)) {
      return Number(v.replace("%","")) || 0;
    }
    const n = Number(v.toString().replace(/[^\d.-]/g,""));
    if (!isNaN(n) && v.match(/[0-9]/)) return n;
    return v.toLowerCase();
  }

  let seasonSort = { index: null, asc: true };

  function renderSeasonTable() {
    const container = document.getElementById("seasonContainer");
    if (!container) return;
    container.innerHTML = "";

    const headerCols = [
      "MVP Points", "MVP", "Nr", "Spieler", "Games",
      "Goals", "Assists", "Points", "+/-", "Ø +/-",
      "Shots", "Shots/Game", "Goals/Game", "Points/Game",
      "Penalty", "Goal Value", "FaceOffs", "FaceOffs Won", "FaceOffs %", "Time"
    ];

    const table = document.createElement("table");
    table.className = "stats-table";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerCols.forEach((h, idx) => {
      const th = document.createElement("th");
      th.textContent = h;
      th.dataset.colIndex = idx;
      th.className = "sortable";
      const arrow = document.createElement("span");
      arrow.className = "sort-arrow";
      arrow.style.marginLeft = "6px";
      th.appendChild(arrow);
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    const rows = Object.keys(seasonData).map(name => {
      const d = seasonData[name];
      const games = Number(d.games || 0);
      const goals = Number(d.goals || 0);
      const assists = Number(d.assists || 0);
      const points = goals + assists;
      const plusMinus = Number(d.plusMinus || 0);
      const shots = Number(d.shots || 0);
      const penalty = Number(d.penaltys || 0);
      const faceOffs = Number(d.faceOffs || 0);
      const faceOffsWon = Number(d.faceOffsWon || 0);
      const faceOffPercent = faceOffs ? Math.round((faceOffsWon / faceOffs) * 100) : 0;
      const timeSeconds = Number(d.timeSeconds || 0);

      const avgPlusMinus = games ? (plusMinus / games) : 0;
      const shotsPerGame = games ? (shots / games) : 0;
      const goalsPerGame = games ? (goals / games) : 0;
      const pointsPerGame = games ? (points / games) : 0;

      const mvpPoints = "";
      const mvp = "";
      const goalValue = "";

      const cells = [
        mvpPoints,
        mvp,
        d.num || "",
        d.name,
        games,
        goals,
        assists,
        points,
        plusMinus,
        Number(avgPlusMinus.toFixed(1)),
        shots,
        Number(shotsPerGame.toFixed(1)),
        Number(goalsPerGame.toFixed(1)),
        Number(pointsPerGame.toFixed(1)),
        penalty,
        goalValue,
        faceOffs,
        faceOffsWon,
        `${faceOffPercent}%`,
        formatTimeMMSS(timeSeconds)
      ];

      return { name: d.name, num: d.num || "", cells, raw: { games, goals, assists, points, plusMinus, shots, penalty, faceOffs, faceOffsWon, faceOffPercent, timeSeconds } };
    });

    let displayRows = rows.slice();
    if (seasonSort.index === null) {
      displayRows.sort((a,b) => (b.raw.points || 0) - (a.raw.points || 0));
    } else {
      const idx = seasonSort.index;
      displayRows.sort((a,b) => {
        const va = parseForSort(a.cells[idx]);
        const vb = parseForSort(b.cells[idx]);
        if (typeof va === "number" && typeof vb === "number") return seasonSort.asc ? va - vb : vb - va;
        if (va < vb) return seasonSort.asc ? -1 : 1;
        if (va > vb) return seasonSort.asc ? 1 : -1;
        return 0;
      });
    }

    displayRows.forEach(r => {
      const tr = document.createElement("tr");
      r.cells.forEach(c => {
        const td = document.createElement("td");
        td.textContent = c;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    // Total row (same logic as before)
    const count = rows.length || 0;
    const sampleTh = headerRow.querySelector("th");
    const headerBg = sampleTh ? getComputedStyle(sampleTh).backgroundColor : "#1f1f1f";
    const headerColor = sampleTh ? getComputedStyle(sampleTh).color : getComputedStyle(document.documentElement).getPropertyValue('--text-color') || "#fff";

    if (count > 0) {
      const sums = {
        games: 0, goals: 0, assists: 0, points: 0, plusMinus: 0,
        shots: 0, penalty: 0, faceOffs: 0, faceOffsWon: 0, timeSeconds: 0
      };
      rows.forEach(r => {
        const rs = r.raw;
        sums.games += rs.games;
        sums.goals += rs.goals;
        sums.assists += rs.assists;
        sums.points += rs.points;
        sums.plusMinus += rs.plusMinus;
        sums.shots += rs.shots;
        sums.penalty += rs.penalty;
        sums.faceOffs += rs.faceOffs;
        sums.faceOffsWon += rs.faceOffsWon;
        sums.timeSeconds += rs.timeSeconds;
      });

      const avgGames = sums.games / count;
      const avgGoals = sums.goals / count;
      const avgAssists = sums.assists / count;
      const avgPoints = sums.points / count;
      const avgPlusMinus = sums.plusMinus / count;
      const avgShots = sums.shots / count;
      const avgPenalty = sums.penalty / count;
      const avgFaceOffs = sums.faceOffs / count;
      const avgFaceOffsWon = sums.faceOffsWon / count;
      const avgFaceOffPercent = avgFaceOffs ? Math.round((avgFaceOffsWon / avgFaceOffs) * 100) : 0;
      const avgTimeSeconds = Math.round(sums.timeSeconds / count);

      const perPlayerShotsPerGame = rows.map(r => { const g=r.raw.games||0; return g ? (r.raw.shots/g):0; });
      const perPlayerGoalsPerGame = rows.map(r => { const g=r.raw.games||0; return g ? (r.raw.goals/g):0; });
      const perPlayerPointsPerGame = rows.map(r => { const g=r.raw.games||0; return g ? (r.raw.points/g):0; });
      const perPlayerAvgPlusMinus = rows.map(r => { const g=r.raw.games||0; return g ? (r.raw.plusMinus/g):0; });

      const avgShotsPerGame = perPlayerShotsPerGame.reduce((a,b)=>a+b,0)/count;
      const avgGoalsPerGame = perPlayerGoalsPerGame.reduce((a,b)=>a+b,0)/count;
      const avgPointsPerGame = perPlayerPointsPerGame.reduce((a,b)=>a+b,0)/count;
      const avgAvgPlusMinus = perPlayerAvgPlusMinus.reduce((a,b)=>a+b,0)/count;

      const totalCells = [
        "", "", "", "Total Ø",
        Number((avgGames).toFixed(1)),
        Number((avgGoals).toFixed(1)),
        Number((avgAssists).toFixed(1)),
        Number((avgPoints).toFixed(1)),
        Number((avgPlusMinus).toFixed(1)),
        Number((avgAvgPlusMinus).toFixed(1)),
        Number((avgShots).toFixed(1)),
        Number((avgShotsPerGame).toFixed(1)),
        Number((avgGoalsPerGame).toFixed(1)),
        Number((avgPointsPerGame).toFixed(1)),
        Number((avgPenalty).toFixed(1)),
        "",
        Number((avgFaceOffs).toFixed(1)),
        Number((avgFaceOffsWon).toFixed(1)),
        `${avgFaceOffPercent}%`,
        formatTimeMMSS(avgTimeSeconds)
      ];

      const trTotal = document.createElement("tr");
      trTotal.className = "total-row";
      totalCells.forEach(c => {
        const td = document.createElement("td");
        td.textContent = c;
        td.style.background = headerBg;
        td.style.color = headerColor;
        td.style.fontWeight = "700";
        trTotal.appendChild(td);
      });
      tbody.appendChild(trTotal);
    } else {
      const trTotal = document.createElement("tr");
      trTotal.className = "total-row";
      const emptyCells = new Array(headerCols.length).fill("");
      emptyCells[3] = "Total Ø";
      emptyCells.forEach(c => {
        const td = document.createElement("td");
        td.textContent = c;
        td.style.background = headerBg;
        td.style.color = headerColor;
        td.style.fontWeight = "700";
        trTotal.appendChild(td);
      });
      tbody.appendChild(trTotal);
    }

    table.appendChild(tbody);
    container.appendChild(table);

    function updateSortUI() {
      const ths = table.querySelectorAll("th.sortable");
      ths.forEach(th => {
        const arrow = th.querySelector(".sort-arrow");
        if (!arrow) return;
        const idx = Number(th.dataset.colIndex);
        if (seasonSort.index === idx) {
          arrow.textContent = seasonSort.asc ? "▲" : "▼";
        } else {
          arrow.textContent = "";
        }
      });
    }
    updateSortUI();

    table.querySelectorAll("th.sortable").forEach(th => {
      th.style.cursor = "pointer";
      th.addEventListener("click", () => {
        const idx = Number(th.dataset.colIndex);
        if (seasonSort.index === idx) seasonSort.asc = !seasonSort.asc;
        else { seasonSort.index = idx; seasonSort.asc = true; }
        seasonSort.index = idx;
        renderSeasonTable();
      });
    });
  }

  // --- Reset functions ---
  function resetStatsPage() {
    const sicher = confirm("⚠️ Spieldaten zurücksetzen?");
    if (!sicher) return;
    localStorage.removeItem("statsData");
    localStorage.removeItem("playerTimes");
    statsData = {};
    playerTimes = {};
    renderStatsTable();
    alert("Spieldaten zurückgesetzt.");
  }
  function resetTorbildPage() {
    const sicher = confirm("⚠️ Goal Map (Marker & Timeboxen) zurücksetzen?");
    if (!sicher) return;
    document.querySelectorAll("#torbildPage .marker-dot").forEach(d => d.remove());
    document.querySelectorAll("#torbildPage .time-btn").forEach(btn => btn.textContent = "0");
    localStorage.removeItem("timeData");
    alert("Goal Map zurückgesetzt.");
  }
  function resetSeasonPage() {
    const sicher = confirm("⚠️ Season-Daten löschen?");
    if (!sicher) return;
    seasonData = {};
    localStorage.removeItem("seasonData");
    renderSeasonTable();
    alert("Season-Daten gelöscht.");
  }

  document.getElementById("resetBtn")?.addEventListener("click", resetStatsPage);
  document.getElementById("resetTorbildBtn")?.addEventListener("click", resetTorbildPage);
  document.getElementById("resetSeasonBtn")?.addEventListener("click", resetSeasonPage);

  // bind reset season map (if present)
  document.getElementById("resetSeasonMapBtn")?.addEventListener("click", resetSeasonMap);

  // --- Navigation bindings ---
  selectPlayersBtn.addEventListener("click", () => showPage("selection"));
  torbildBtn.addEventListener("click", () => showPage("torbild")); // visible label "Goal Map"
  backToStatsBtn.addEventListener("click", () => showPage("stats"));
  backToStatsFromSeasonBtn?.addEventListener("click", () => showPage("stats"));
  seasonBtn?.addEventListener("click", () => { showPage("season"); renderSeasonTable(); });

  // Season CSV export in header
  document.getElementById("exportSeasonBtn")?.addEventListener("click", () => {
    const rows = [["Nr","Spieler","Games","Goals","Assists","Points","+/-","Ø +/-","Shots","Shots/Game","Goals/Game","Points/Game","Penalty","Goal Value","FaceOffs","FaceOffs Won","FaceOffs %","Time"]];
    Object.keys(seasonData).forEach(name => {
      const d = seasonData[name];
      const games = Number(d.games || 0);
      const goals = Number(d.goals || 0);
      const assists = Number(d.assists || 0);
      const points = goals + assists;
      const plusMinus = Number(d.plusMinus || 0);
      const shots = Number(d.shots || 0);
      const penalty = Number(d.penaltys || 0);
      const faceOffs = Number(d.faceOffs || 0);
      const faceOffsWon = Number(d.faceOffsWon || 0);
      const faceOffPercent = faceOffs ? Math.round((faceOffsWon/faceOffs)*100) : 0;
      const timeStr = formatTimeMMSS(Number(d.timeSeconds||0));
      const shotsGame = games ? (shots/games).toFixed(1) : "0.0";
      const goalsGame = games ? (goals/games).toFixed(1) : "0.0";
      const pointsGame = games ? ((points)/games).toFixed(1) : "0.0";
      const avgPlus = games ? (plusMinus/games).toFixed(1) : "0.0";
      rows.push([d.num || "", d.name, games, goals, assists, points, plusMinus, avgPlus, shots, shotsGame, goalsGame, pointsGame, penalty, "", faceOffs, faceOffsWon, `${faceOffPercent}%`, timeStr]);
    });
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "season.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // --- Final init and restore state on load ---
  seasonData = JSON.parse(localStorage.getItem("seasonData")) || seasonData || {};

  renderPlayerSelection();

  const lastPage = localStorage.getItem("currentPage") || (selectedPlayers.length ? "stats" : "selection");
  if (lastPage === "stats") {
    showPage("stats");
    renderStatsTable();
    updateIceTimeColors();
  } else if (lastPage === "season") {
    showPage("season");
    renderSeasonTable();
  } else if (lastPage === "seasonMap") {
    showPage("seasonMap");
    renderSeasonMapPage();
  } else {
    showPage("selection");
  }

  // initial timer display
  updateTimerDisplay();

  // Save to localStorage on unload
  window.addEventListener("beforeunload", () => {
    try {
      localStorage.setItem("statsData", JSON.stringify(statsData));
      localStorage.setItem("selectedPlayers", JSON.stringify(selectedPlayers));
      localStorage.setItem("playerTimes", JSON.stringify(playerTimes));
      localStorage.setItem("timerSeconds", String(timerSeconds));
      localStorage.setItem("seasonData", JSON.stringify(seasonData));
    } catch (e) {
      // ignore
    }
  });
});
