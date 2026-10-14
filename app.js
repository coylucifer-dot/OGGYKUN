(() => {
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "sabdaplays_rebuild_projects_v1";
  let projects = [];
  let activeId = null;
  let timer = null;
  let nextAt = 0;

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(saved)) projects = saved;
  } catch (_) { projects = []; }

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[ch]);

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    renderList();
  }
  function activeProject() { return projects.find(p => p.id === activeId); }
  function addLog(message, type = "") {
    const body = $("log-body");
    const empty = body.querySelector(".empty-log");
    if (empty) empty.remove();
    const line = document.createElement("div");
    line.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString("id-ID", {hour:"2-digit", minute:"2-digit", second:"2-digit"});
    const timeSpan = document.createElement("span");
    timeSpan.className = "time";
    timeSpan.textContent = `[${time}]`;
    line.append(timeSpan, document.createTextNode(message));
    body.prepend(line);
  }
  function renderList() {
    $("project-count").textContent = projects.length;
    const list = $("project-list");
    list.replaceChildren();
    projects.forEach(p => {
      const button = document.createElement("button");
      button.className = "project-item" + (p.id === activeId ? " active" : "");
      button.innerHTML = `<span class="project-icon">▤</span><span><strong>${escapeHtml(p.name || "Project tanpa nama")}</strong><small>${p.running ? "● Simulasi aktif" : "○ Berhenti"}</small></span>`;
      button.addEventListener("click", () => selectProject(p.id));
      list.append(button);
    });
  }
  function selectProject(id) {
    stopSimulation(false);
    activeId = id;
    const p = activeProject();
    if (!p) return showWelcome();
    $("welcome").classList.add("hidden");
    $("editor").classList.remove("hidden");
    $("project-name").value = p.name || "";
    $("channel-id").value = p.channelId || "";
    $("message").value = p.message || "";
    $("delay").value = p.delay || 5;
    $("editor-title").textContent = p.name || "Project tanpa nama";
    $("stat-sent").textContent = p.sent || 0;
    $("stat-failed").textContent = p.failed || 0;
    $("stat-countdown").textContent = p.running ? "AKTIF" : "--:--";
    $("log-body").replaceChildren();
    if (p.logs && p.logs.length) {
      p.logs.forEach(entry => {
        const line = document.createElement("div");
        line.className = "log-entry " + (entry.type || "");
        const ts = document.createElement("span");
        ts.className = "time";
        ts.textContent = `[${entry.time}]`;
        line.append(ts, document.createTextNode(entry.message));
        $("log-body").append(line);
      });
    } else {
      const empty = document.createElement("p");
      empty.className = "empty-log";
      empty.textContent = "Belum ada aktivitas.";
      $("log-body").append(empty);
    }
    updateStatus();
    renderList();
  }
  function showWelcome() {
    $("editor").classList.add("hidden");
    $("welcome").classList.remove("hidden");
    renderList();
  }
  function makeProject() {
    const p = {id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())), name:"Project baru", channelId:"", message:"", delay:5, running:false, sent:0, failed:0, logs:[]};
    projects.unshift(p);
    persist();
    selectProject(p.id);
    $("project-name").focus();
    logForProject("Project dibuat.", "ok");
  }
  function updateStatus() {
    const p = activeProject();
    if (!p) return;
    $("editor-title").textContent = p.name || "Project tanpa nama";
    $("status-text").textContent = p.running ? "Simulasi berjalan" : "Berhenti";
    $("status-dot").classList.toggle("running", !!p.running);
    $("start-stop").textContent = p.running ? "■ Hentikan Simulasi" : "▶ Mulai Simulasi";
    $("start-stop").style.background = p.running ? "linear-gradient(120deg,#bd4c68,#e16b7e)" : "";
  }
  function logForProject(message, type = "") {
    const p = activeProject();
    if (!p) return;
    const time = new Date().toLocaleTimeString("id-ID", {hour:"2-digit", minute:"2-digit", second:"2-digit"});
    p.logs = p.logs || [];
    p.logs.unshift({time, message, type});
    p.logs = p.logs.slice(0, 60);
    addLog(message, type);
    persist();
  }
  function saveConfig() {
    const p = activeProject();
    if (!p) return;
    p.name = $("project-name").value.trim() || "Project tanpa nama";
    p.channelId = $("channel-id").value.trim();
    p.message = $("message").value;
    p.delay = Math.max(1, Math.min(10080, Number($("delay").value) || 5));
    $("delay").value = p.delay;
    persist();
    updateStatus();
    logForProject("Konfigurasi disimpan di browser.", "ok");
  }
  function stopSimulation(writeLog = true) {
    const p = activeProject();
    if (timer) clearInterval(timer);
    timer = null;
    if (p && p.running) {
      p.running = false;
      if (writeLog) logForProject("Simulasi dihentikan.", "warn");
    }
    $("stat-countdown").textContent = "--:--";
    updateStatus();
    persist();
  }
  function startSimulation() {
    const p = activeProject();
    if (!p) return;
    saveConfig();
    if (!p.message.trim()) {
      logForProject("Isi teks pesan terlebih dahulu.", "warn");
      return;
    }
    p.running = true;
    nextAt = Date.now() + p.delay * 60000;
    updateStatus();
    logForProject("Simulasi jadwal dimulai. Tidak ada pesan yang dikirim ke Discord.", "ok");
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      const current = activeProject();
      if (!current || !current.running) { clearInterval(timer); timer = null; return; }
      const remaining = Math.max(0, Math.floor((nextAt - Date.now()) / 1000));
      const min = String(Math.floor(remaining / 60)).padStart(2, "0");
      const sec = String(remaining % 60).padStart(2, "0");
      $("stat-countdown").textContent = `${min}:${sec}`;
      if (remaining <= 0) {
        current.sent = (current.sent || 0) + 1;
        $("stat-sent").textContent = current.sent;
        logForProject("Jadwal demo terpicu (simulasi lokal; tidak mengirim pesan).", "ok");
        nextAt = Date.now() + current.delay * 60000;
      }
    }, 1000);
    persist();
  }

  $("add-project").addEventListener("click", makeProject);
  $("welcome-add").addEventListener("click", makeProject);
  $("save-config").addEventListener("click", saveConfig);
  $("start-stop").addEventListener("click", () => activeProject()?.running ? stopSimulation() : startSimulation());
  $("delete-project").addEventListener("click", () => {
    const p = activeProject();
    if (!p || !confirm(`Hapus project "${p.name}"?`)) return;
    stopSimulation(false);
    projects = projects.filter(item => item.id !== activeId);
    activeId = null;
    persist();
    showWelcome();
  });
  $("clear-log").addEventListener("click", () => {
    const p = activeProject();
    if (!p) return;
    p.logs = [];
    $("log-body").innerHTML = '<p class="empty-log">Belum ada aktivitas.</p>';
    persist();
  });
  $("emoji-bar").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const field = $("message");
    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? start;
    field.setRangeText(button.textContent, start, end, "end");
    field.focus();
  });
  $("project-name").addEventListener("input", () => {
    const p = activeProject();
    if (p) { p.name = $("project-name").value; $("editor-title").textContent = p.name || "Project tanpa nama"; renderList(); }
  });
  window.addEventListener("beforeunload", () => { if (timer) clearInterval(timer); });
  if (projects.length) selectProject(projects[0].id); else showWelcome();
})();
