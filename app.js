// app.js
// Ergänzt: Season Map Seite + Buttons (Season Map, Export Season Map).
// Funktionalität: Navigation, Export der Torbild-Marker ins SeasonMap-Format, Import auf SeasonMap-Seite,
// Reset-Button für SeasonMap. (Rest der App unverändert, hier komplette Datei mit Ergänzungen.)

document.addEventListener("DOMContentLoaded", () => {
  // --- Elements ---
  const pages = {
    selection: document.getElementById("playerSelectionPage"),
    stats: document.getElementById("statsPage"),
    torbild: document.getElementById("torbildPage"),
    season: document.getElementById("seasonPage"),
    seasonMap: document.getElementById("seasonMapPage")
  };
  const playerListContainer = document.getElementById("playerList");
  const confirmSelectionBtn = document.getElementById("confirmSelection");
  const statsContainer = document.getElementById("statsContainer");
  const torbildBtn = document.getElementById("torbildBtn");
  const backToStatsBtn = document.getElementById("backToStatsBtn");
  const timerBtn = document.getElementById("timerBtn");
  const selectPlayersBtn = document.getElementById("selectPlayersBtn");
  const exportBtn = document.getElementById("exportBtn");
  const resetBtn = document.getElementById("resetBtn");
  const seasonBtn = document.getElementById("seasonBtn");
  const seasonMapBtn = document.getElementById("seasonMapBtn");
  const backToStatsFromSeasonBtn = document.getElementById("backToStatsFromSeasonBtn");
  const seasonContainer = document.getElementById("seasonContainer");
  const imageBoxes = document.querySelectorAll(".field-box, .goal-img-box");
  const statsScrollContainer = document.getElementById("statsScrollContainer");
  const stickyHeader = document.getElementById("stickyHeader");

  // New refs for season map and torbild export
  const exportSeasonMapBtn = document.getElementById("exportSeasonMapBtn");
  const exportSeasonMapFromMapBtn = document.getElementById("exportSeasonMapFromMapBtn");
  const backToStatsFromSeasonMapBtn = document.getElementById("backToStatsFromSeasonMapBtn");
  const resetSeasonMapBtn = document.getElementById("resetSeasonMapBtn");
  const seasonMapFieldBox = document.getElementById("seasonMapFieldBox");
  const seasonMapGoalGreenBox = document.getElementById("seasonMapGoalGreenBox");
  const seasonMapGoalRedBox = document.getElementById("seasonMapGoalRedBox");
  const seasonMapTimeTrackingBox = document.getElementById("seasonMapTimeTrackingBox");

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

  // seasonMap storage for markers/timeboxes
  // format: { markers: [{boxId, xPct, yPct, color}], timeData: {periodId: {idx: value}} }
  let seasonMapData = JSON.parse(localStorage.getItem("seasonMapData")) || {};

  // --- Sticky header helper ---
  function updateStickyHeaderHeight() {
    const h = stickyHeader ? stickyHeader.offsetHeight : 56;
    document.documentElement.style.setProperty("--sticky-header-height", `${h}px`);
  }
  updateStickyHeaderHeight();
  window.addEventListener("resize", updateStickyHeaderHeight);

  // --- Render player selection (unchanged) ---
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

  // --- Confirm selection handler (unchanged) ---
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

  window.__renderPlayerSelection = renderPlayerSelection;

  // --- other helpers (updateIceTimeColors, renderStatsTable, changeValue, updateTotals, timers, export CSV) ---
  // For brevity these are kept the same as your current implementation.
  // I'll re-use functions from previous versions (
