const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;
const dialog = window.__TAURI__.dialog;

const $ = (id) => document.getElementById(id);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// ================= ícones =================
const ICONS = {
  home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  server: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M17 6l3 3M14.5 8.5l2 2"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v4"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  userMinus: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 11h6"/>',
  xCircle: '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M12 21 8 9l4-6 4 6z"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
  at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
  headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/>',
  reply: '<path d="M9 17 4 12l5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  skip: '<path d="M5 5v14l9-7z"/><path d="M18 5v14"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  arrow: '<path d="m9 6 6 6-6 6"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.9 1.2-1.8-.5-1-.1-2.2 1.1-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
};
$$("i[data-i]").forEach((el) => {
  el.outerHTML = `<svg viewBox="0 0 24 24">${ICONS[el.dataset.i] || ""}</svg>`;
});

const state = {
  tokenType: "user",
  user: null,
  token: null, // só é preenchido depois que o Discord aceitou o token
  whitelist: [],
  queue: [],
  current: null,
  base: { scanned: 0, deleted: 0, skipped: 0 },
  running: false,
  confirmTimer: null,
  pendingStart: null,
};

const PAGES = {
  home:      { title: "Início", sub: "Escolha o que fazer — tudo separado por assunto." },
  dm:        { title: "Privados", sub: "Apague suas mensagens em PVs, DMs e grupos." },
  servers:   { title: "Servidores", sub: "Um canal, ou o servidor todo com as menções." },
  keyword:   { title: "Palavra-chave", sub: "Apague só as mensagens que tiverem uma palavra." },
  media:     { title: "Mídias e arquivos", sub: "Fotos, vídeos, áudios e anexos que você mandou." },
  package:   { title: "Pacote de dados", sub: "Use o package.zip do Discord pra achar tudo." },
  friends:   { title: "Amigos e PVs", sub: "Desfaça amizades e feche conversas em massa." },
  leave:     { title: "Sair de servidores", sub: "Sai de todos de uma vez." },
  hypesquad: { title: "HypeSquad", sub: "Troque a casa que aparece no seu perfil." },
  idle:      { title: "Modo ausente", sub: "O app cuida da conta enquanto você está fora." },
  settings:  { title: "Conta e token", sub: "Conecte a conta que será usada." },
  prefs:     { title: "Preferências", sub: "Whitelist, velocidade e período — valem pra tudo." },
  look:      { title: "Aparência", sub: "Tema e fundo do app." },
};

// ================= navegação =================
function go(page, focus) {
  $$(".navItem").forEach((b) => b.classList.toggle("active", b.dataset.page === page));
  $$(".page").forEach((p) => p.classList.toggle("active", p.dataset.page === page));
  $("pageTitle").textContent = PAGES[page].title;
  $("tbPage").textContent = PAGES[page].title;
  $("pageSub").textContent = PAGES[page].sub;
  $("pageIcon").innerHTML = document.querySelector(`.navItem[data-page="${page}"] svg`).outerHTML;
  document.querySelector(".content").scrollTop = 0;
  const el = focus && $(focus);
  if (el) {
    setTimeout(() => {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.classList.remove("flash");
      void el.offsetWidth;
      el.classList.add("flash");
    }, 60);
  }
}
$$(".navItem").forEach((b) => b.addEventListener("click", () => go(b.dataset.page)));

// menu recolhido (só ícones): o nome aparece num balãozinho ao lado; a escolha fica salva
const navTip = document.createElement("div");
navTip.className = "navTip";
document.body.appendChild(navTip);
$$(".navItem").forEach((b) => {
  b.addEventListener("mouseenter", () => {
    if (!$("sidebar").classList.contains("mini")) return;
    const r = b.getBoundingClientRect();
    navTip.textContent = b.textContent.trim();
    navTip.style.left = `${r.right + 14}px`;
    navTip.style.top = `${r.top + r.height / 2}px`;
    navTip.classList.add("show");
  });
  b.addEventListener("mouseleave", () => navTip.classList.remove("show"));
  b.addEventListener("click", () => navTip.classList.remove("show"));
});
function setMini(on) {
  $("sidebar").classList.toggle("mini", on);
  $("sideToggle").title = on ? "Abrir menu" : "Recolher menu";
  try { localStorage.setItem("menuMini", on ? "1" : ""); } catch {}
}
$("sideToggle").addEventListener("click", () => setMini(!$("sidebar").classList.contains("mini")));
try { setMini(localStorage.getItem("menuMini") === "1"); } catch {}
$$("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go, b.dataset.focus)));

// ================= log / progresso =================
function log(message, level = "info") {
  const li = document.createElement("li");
  li.className = level;
  li.title = message;
  const dot = document.createElement("i");
  const msg = document.createElement("span");
  msg.textContent = message;
  const t = document.createElement("time");
  t.textContent = new Date().toLocaleTimeString().slice(0, 5);
  li.append(dot, msg, t);
  const box = $("log");
  box.append(li);
  while (box.children.length > 600) box.firstChild.remove();
  box.scrollTop = box.scrollHeight;
}

function showProgress(p) {
  $("sScanned").textContent = state.base.scanned + p.scanned;
  $("sDeleted").textContent = state.base.deleted + p.deleted;
  $("sSkipped").textContent = state.base.skipped + p.skipped;
  $("lDeleted").textContent = p.dryRun ? "encontradas" : "feitas";
  state.lastP = p;
  showEta();
  const bar = $("bar").parentElement;
  if (p.total) {
    bar.classList.remove("indeterminate");
    const pc = Math.min(100, ((p.deleted + p.skipped) / p.total) * 100);
    $("bar").style.width = pc + "%";
    $("pct").textContent = `${Math.floor(pc)}%`;
  } else {
    bar.classList.toggle("indeterminate", state.running);
    $("pct").textContent = "";
  }
}

// ================= tempo estimado =================
// Usa a velocidade real do processo (itens feitos ÷ tempo passado). Antes de ter
// dados suficientes, chuta pelo delay configurado (+ ~350 ms de rede por item).
function fmtDur(ms) {
  const s = Math.max(1, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min`;
}
function showEta() {
  const p = state.lastP;
  if (!state.running || !p || !state.taskStart) { $("eta").textContent = ""; $("rate").textContent = ""; return; }
  const el = Date.now() - state.taskStart;
  const done = p.deleted + p.skipped;
  const perMin = el > 5000 && done ? (done / el) * 60000 : 0;
  $("rate").textContent = perMin ? `${perMin >= 10 ? Math.round(perMin) : perMin.toFixed(1)} por min` : "";
  if (!p.total) {
    $("eta").textContent = `rodando há ${fmtDur(el)}`;
    return;
  }
  const left = Math.max(0, p.total - done);
  if (!left) { $("eta").textContent = "terminando…"; return; }
  const msEach = done >= 3 && el > 5000 ? el / done : state.taskDelay + 350;
  $("eta").textContent = `falta ~${fmtDur(left * msEach)}`;
}
setInterval(showEta, 1000);

const ACTION_BTNS = ["dmGo", "chBtn", "serverBtn", "kwBtn", "mdBtn", "pkgBtn", "unfriendBtn", "closeBtn", "leaveBtn"];

function setRunning(on) {
  state.running = on;
  $("statusDot").classList.toggle("on", on);
  $("statusPill").classList.toggle("on", on);
  document.querySelector(".activity").classList.toggle("running", on);
  if (!on) $("pct").textContent = "";
  $("statusText").textContent = on ? "Executando…" : "Parado";
  $("stopBtn").disabled = !on;
  ACTION_BTNS.forEach((id) => ($(id).disabled = on));
  $("bar").parentElement.classList.toggle("indeterminate", on);
  if (!on) $("taskLabel").textContent = "Nenhum processo";
  updateStartButton();
}

// ================= config =================
function dateToMs(value, endOfDay = false) {
  if (!value) return null;
  const d = new Date(value + (endOfDay ? "T23:59:59" : "T00:00:00"));
  return isNaN(d) ? null : d.getTime();
}

const isBot = () => state.tokenType === "bot";
const val = (id) => $(id).value.trim();
const isId = (s) => /^\d{15,21}$/.test(s);
// confere um campo de ID: vazio passa (se opcional), formato errado avisa e foca
function checkId(id, optional = false) {
  const v = val(id);
  if (!v && optional) return true;
  if (isId(v)) return true;
  $(id).focus();
  $(id).classList.add("bad");
  setTimeout(() => $(id).classList.remove("bad"), 1200);
  toast(v ? "Esse ID não parece certo — tem que ser só números." : "Preencha o ID.");
  return false;
}

function baseConfig() {
  const useDates = $("useDates").checked;
  return {
    token: state.token,
    isBot: isBot(),
    mode: null,
    guildId: null,
    channelId: null,
    authorId: null,
    content: null,
    afterMs: useDates ? dateToMs($("after").value) : null,
    beforeMs: useDates ? dateToMs($("before").value, true) : null,
    delayMs: $("useDelay").checked ? parseInt($("delay").value, 10) : 1200,
    dryRun: false,
    onlyAttachments: false,
    whitelist: $("useWhitelist").checked ? state.whitelist : [],
    leaveGroups: false,
    packagePath: null,
    packageScope: null,
  };
}

function hasToken() {
  if (state.token) return true;
  log("Conecte um token primeiro.", "error");
  lockApp();
  return false;
}
function needUser() {
  if (!isBot()) return false;
  log("Essa função só funciona com token de usuário.", "error");
  return true;
}

// ================= fila de processos =================
function startQueue(tasks) {
  if (state.running || !tasks.length || !hasToken()) return;
  state.queue = tasks;
  state.base = { scanned: 0, deleted: 0, skipped: 0 };
  $("bar").style.width = "0";
  showProgress({ scanned: 0, deleted: 0, skipped: 0, dryRun: false });
  setRunning(true);
  runNext();
}

async function runNext() {
  const task = state.queue.shift();
  if (!task) {
    state.current = null;
    setRunning(false);
    return;
  }
  state.current = task;
  state.taskStart = Date.now();
  state.taskDelay = task.config.delayMs || 1200;
  state.lastP = null;
  $("taskLabel").textContent = task.label;
  $("bar").style.width = "0";
  log(`▶ ${task.label}`, "ok");
  try {
    await invoke("start_deletion", { config: task.config });
  } catch (e) {
    log(String(e), "error");
    runNext();
  }
}

const run = (label, extra) => startQueue([{ label, config: { ...baseConfig(), ...extra } }]);

// Tudo é de verdade: exige sempre um segundo clique pra confirmar
function guarded(button, confirmHtml, fn) {
  if (state.pendingStart === fn.name) {
    clearTimeout(state.confirmTimer);
    if (state.pendingStart) {
      button.classList.remove("confirm");
      button.innerHTML = button.dataset.html;
    }
    state.pendingStart = null;
    fn();
    updateStartButton();
    return;
  }
  state.pendingStart = fn.name;
  button.dataset.html = button.innerHTML;
  button.innerHTML = confirmHtml;
  button.classList.add("confirm");
  state.confirmTimer = setTimeout(() => {
    state.pendingStart = null;
    button.classList.remove("confirm");
    button.innerHTML = button.dataset.html;
    updateStartButton();
  }, 4000);
}
const CONFIRM = "Clique de novo para confirmar";

// ================= componentes =================
$$(".segmented").forEach((seg) => {
  seg.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => {
      seg.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      seg.dispatchEvent(new Event("change"));
    })
  );
});
const segVal = (id) => $(id).querySelector("button.on").dataset.v;

$$(".expandable").forEach((opt) => {
  const toggle = opt.querySelector(".toggle input");
  opt.addEventListener("click", (e) => {
    if (e.target.closest(".expand") || e.target.closest(".toggle")) return;
    opt.classList.toggle("open");
  });
  toggle.addEventListener("change", () => toggle.checked && opt.classList.add("open"));
});
$$(".option:not(.expandable)").forEach((opt) => {
  const t = opt.querySelector(".toggle input");
  if (t) opt.addEventListener("click", (e) => { if (!e.target.closest(".toggle")) t.click(); });
});

// ================= privados =================
function selectedTasks() {
  return $$(".task:checked").map((c) => c.value);
}
function updateStartButton() {
  const n = selectedTasks().length;
  const btn = $("startBtn");
  if (!btn.classList.contains("confirm")) btn.textContent = `Iniciar (${n}/2)`;
  btn.disabled = n === 0 || state.running;
}
$$(".task").forEach((c) => c.addEventListener("change", updateStartButton));

$("startBtn").addEventListener("click", () => {
  if (needUser()) return;
  guarded($("startBtn"), CONFIRM, function dmTasks() {
    const labels = { friends: "PVs com todos os amigos", dms: "PVs e DMs abertas" };
    startQueue(selectedTasks().map((mode) => ({ label: labels[mode], config: { ...baseConfig(), mode } })));
  });
});

$("dmGo").addEventListener("click", () => {
  const id = val("dmId");
  if (!checkId("dmId")) return;
  guarded($("dmGo"), "<b>OK?</b>", function singleDm() {
    run(`PV ${id}`, { mode: "channel", channelId: id });
  });
});

// ================= servidores =================
$("chBtn").addEventListener("click", () => {
  const ch = val("chId");
  if (!checkId("chId") || !checkId("chGuild", true) || !checkId("authorId", true)) return;
  const guild = val("chGuild") || null;
  const mode = !isBot() && guild ? "search" : "channel";
  guarded($("chBtn"), CONFIRM, function channelTask() {
    run(`Canal ${ch}`, { mode, channelId: ch, guildId: mode === "search" ? guild : null, authorId: val("authorId") || null });
  });
});

$("serverBtn").addEventListener("click", () => {
  const g = val("guildId");
  if (!checkId("guildId")) return;
  if (needUser()) return;
  const mentions = $("alsoMentions").checked;
  guarded($("serverBtn"), CONFIRM, function guildTask() {
    run(mentions ? `Servidor ${g} + menções` : `Servidor ${g}`, { mode: mentions ? "guildmentions" : "search", guildId: g });
  });
});

// ================= alvo (palavra-chave / mídias) =================
function wireTarget(segId, inputId) {
  const upd = () => {
    const v = segVal(segId);
    $(inputId).style.display = v === "dms" ? "none" : "";
    $(inputId).placeholder = v === "guild" ? "ID do servidor" : "ID do PV, grupo ou canal";
  };
  $(segId).addEventListener("change", upd);
  upd();
}
wireTarget("kwWhere", "kwId");
wireTarget("mdWhere", "mdId");

function targetConfig(segId, inputId) {
  const where = segVal(segId);
  const id = val(inputId);
  if (where === "dms") return needUser() ? null : { mode: "dms" };
  if (!checkId(inputId)) return null;
  if (where === "guild") return needUser() ? null : { mode: "search", guildId: id };
  return { mode: "channel", channelId: id };
}

$("kwBtn").addEventListener("click", () => {
  const word = val("kwText");
  if (!word) return $("kwText").focus();
  const t = targetConfig("kwWhere", "kwId");
  if (!t) return;
  guarded($("kwBtn"), CONFIRM, function keywordTask() {
    run(`Palavra “${word}”`, { ...t, content: word });
  });
});

$("mdBtn").addEventListener("click", () => {
  const t = targetConfig("mdWhere", "mdId");
  if (!t) return;
  guarded($("mdBtn"), CONFIRM, function mediaTask() {
    run("Mídias e arquivos", { ...t, onlyAttachments: true });
  });
});

// ================= pacote =================
async function pick(directory) {
  if (!dialog) return log("Seletor de arquivos indisponível — cole o caminho.", "error");
  const p = await dialog.open({
    multiple: false,
    directory,
    filters: directory ? undefined : [{ name: "Pacote do Discord", extensions: ["zip"] }],
  });
  if (p) $("pkgPath").value = p;
}
$("pkgZip").addEventListener("click", () => pick(false));
$("pkgDir").addEventListener("click", () => pick(true));

$("pkgBtn").addEventListener("click", () => {
  const path = val("pkgPath");
  if (!path) return $("pkgPath").focus();
  if (needUser()) return;
  guarded($("pkgBtn"), CONFIRM, function packageTask() {
    run("Pacote de dados", { mode: "package", packagePath: path, packageScope: segVal("pkgScope") });
  });
});

// ================= amigos / PVs / servidores =================
$("unfriendBtn").addEventListener("click", () => {
  if (needUser()) return;
  guarded($("unfriendBtn"), CONFIRM, function unfriendTask() {
    run("Remover todos os amigos", { mode: "removefriends" });
  });
});
$("closeBtn").addEventListener("click", () => {
  if (needUser()) return;
  const groups = $("leaveGroups").checked;
  guarded($("closeBtn"), CONFIRM, function closeTask() {
    run(groups ? "Fechar PVs e sair dos grupos" : "Fechar todos os PVs", { mode: "closedms", leaveGroups: groups });
  });
});
$("leaveBtn").addEventListener("click", () => {
  guarded($("leaveBtn"), CONFIRM, function leaveTask() {
    run("Sair de todos os servidores", { mode: "leaveguilds" });
  });
});

// ================= API avulsa =================
async function api(method, path, body = null, token = state.token, bot = isBot()) {
  const [status, text] = await invoke("api_call", { token, isBot: bot, method, path, body });
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  return { status, ok: status >= 200 && status < 300, data };
}

// ================= hypesquad =================
const HOUSES = { 1: "Bravery", 2: "Brilliance", 3: "Balance" };
async function setHouse(n) {
  if (!hasToken() || needUser()) return;
  try {
    const r = n ? await api("POST", "/hypesquad/online", { house_id: n }) : await api("DELETE", "/hypesquad/online");
    if (!r.ok) throw r.data?.message || `HTTP ${r.status}`;
    $$(".house").forEach((h) => h.classList.toggle("on", +h.dataset.house === n));
    const msg = n ? `Agora você é da casa ${HOUSES[n]}.` : "Você saiu da HypeSquad.";
    $("houseMsg").textContent = msg;
    log(msg, "ok");
  } catch (e) {
    $("houseMsg").textContent = `Erro: ${e}`;
    log(`HypeSquad: ${e}`, "error");
  }
}
$$(".house").forEach((h) => h.addEventListener("click", () => setHouse(+h.dataset.house)));
$("houseRemove").addEventListener("click", () => setHouse(0));

// ================= conta =================
// Entrada obrigatória: a tela de entrada cobre o app até um token ser aceito pelo
// Discord. Nela ficam as contas salvas (um clique) e o campo pra colar um token novo.
// Contas salvas: o token fica no Cofre do Windows (save_account); aqui só nome/foto/@.
let contas = [];
try { contas = JSON.parse(localStorage.getItem("contas") || "[]").filter((c) => c && isId(c.id)); } catch {}
const saveContas = () => { try { localStorage.setItem("contas", JSON.stringify(contas)); } catch {} };
function fillAvatar(av, u) {
  const name = u.global_name || u.name || u.username || "?";
  av.textContent = "";
  // só monta a URL da foto se id e hash tiverem o formato esperado
  if (u.avatar && isId(u.id) && /^(a_)?[0-9a-f]{32}$/.test(u.avatar)) {
    const img = new Image();
    img.alt = "";
    img.src = `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128`;
    img.onerror = () => (av.textContent = name[0].toUpperCase());
    av.append(img);
  } else {
    av.textContent = name[0].toUpperCase();
  }
}
function upsertConta(u) {
  const c = { id: u.id, name: u.global_name || u.username, username: u.username, avatar: u.avatar || null, bot: !!u.bot };
  contas = [c, ...contas.filter((x) => x.id !== u.id)].slice(0, 12);
  saveContas();
}
async function removeConta(id) {
  await invoke("forget_account", { id }).catch(() => {});
  contas = contas.filter((x) => x.id !== id);
  saveContas();
  renderContas();
}
function renderContas() {
  const box = $("gateAccs");
  box.innerHTML = "";
  $("gateSaved").hidden = !contas.length;
  for (const c of contas) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "gateAcc";
    const av = document.createElement("span");
    av.className = "avatar";
    fillAvatar(av, c);
    const t = document.createElement("span");
    t.className = "meText";
    const n = document.createElement("b");
    n.textContent = c.name;
    const s = document.createElement("small");
    s.textContent = `${c.username}${c.bot ? " (bot)" : ""} · ${c.id}`;
    t.append(n, s);
    const x = document.createElement("span");
    x.className = "gateAccX";
    x.title = "Tirar esta conta do PC";
    x.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>`;
    x.addEventListener("click", (e) => { e.stopPropagation(); removeConta(c.id); });
    b.append(av, t, x);
    b.addEventListener("click", () => enterSaved(c, b));
    box.append(b);
  }
}
function lockApp() {
  $("gate").classList.remove("out");
  document.body.classList.add("locked");
  document.querySelector(".app").inert = true;
  $("gateErr").textContent = "";
  renderContas();
  setTimeout(() => $("gateToken").focus(), 50);
}
function unlockApp() {
  if (!document.body.classList.contains("locked")) return;
  $("gate").classList.add("out");
  document.body.classList.remove("locked");
  document.querySelector(".app").inert = false;
  go("home");
}
lockApp();

// Entra com um token: confere no Discord, libera o app e (se pedido) guarda a conta.
async function login(tk, bot, remember) {
  const u = await invoke("check_token", { token: tk, isBot: bot });
  state.user = u;
  state.token = tk;
  state.tokenType = bot ? "bot" : "user";
  state.prev = null;
  $("token").value = tk;
  $$("#tokenType button").forEach((b) => b.classList.toggle("on", b.dataset.v === state.tokenType));
  unlockApp();
  showUser(u);
  log(`Conectado como ${u.global_name || u.username}`, "ok");
  if (remember) {
    try {
      await invoke("save_account", { id: u.id, token: tk, isBot: bot });
      upsertConta(u);
    } catch (e) { log(`Não deu pra salvar a conta: ${e}`, "warn"); }
  } else if (contas.some((c) => c.id === u.id)) {
    upsertConta(u); // já estava salva: só atualiza nome e foto
  }
  $("remember").checked = contas.some((c) => c.id === u.id);
  return u;
}
async function enterSaved(c, btn) {
  $("gateErr").textContent = "";
  $$(".gateAcc").forEach((b) => (b.disabled = true));
  try {
    const saved = await invoke("load_account", { id: c.id });
    if (!saved) {
      $("gateErr").textContent = "O token dessa conta não está mais salvo neste PC.";
      await removeConta(c.id);
      return;
    }
    const [tk, bot] = saved;
    await login(tk, bot, true);
  } catch (e) {
    $("gateErr").textContent = `${c.name}: ${e}`;
  } finally {
    $$(".gateAcc").forEach((b) => (b.disabled = false));
  }
}
async function gateEnter() {
  const tk = $("gateToken").value.trim();
  if (!tk) { $("gateErr").textContent = "Cole o token primeiro."; return; }
  const btn = $("gateEnter");
  btn.disabled = true;
  $("gateErr").textContent = "";
  try {
    await login(tk, false, $("gateRemember").checked); // só conta de usuário (login por bot saiu na 0.1.14)
    $("gateToken").value = "";
    $("gateToken").type = "password";
  } catch (e) {
    $("gateErr").textContent = `${e}`;
  } finally {
    btn.disabled = false;
  }
}
$("gateEnter").addEventListener("click", gateEnter);
$("gateToken").addEventListener("keydown", (e) => e.key === "Enter" && !$("gateEnter").disabled && gateEnter());
$("gateEye").addEventListener("click", () => {
  const t = $("gateToken");
  t.type = t.type === "password" ? "text" : "password";
});
$("token").addEventListener("keydown", (e) => e.key === "Enter" && !$("checkBtn").disabled && connect(true));

$("eyeBtn").addEventListener("click", () => {
  const t = $("token");
  t.type = t.type === "password" ? "text" : "password";
});

$("checkBtn").addEventListener("click", async () => {
  await connect(true);
});

function showUser(u) {
  const name = u.global_name || u.username;
  $("account").textContent = `Conectado como ${name}.`;
  $("helloName").textContent = name;
  $("helloSub").textContent = u.bot ? "Conta de bot" : "Conta de usuário";
  $("userName").textContent = name;
  $("userTag").textContent = u.username;
  fillAvatar($("avatar"), u);
  $("switchBtn").hidden = false;
}

// ================= trocar de conta =================
// Volta pra tela de entrada com o campo limpo. A conta anterior fica guardada
// só na memória, pra dar pra voltar nela se clicou sem querer.
function switchAccount() {
  if (state.running) return toast("Pare o processo antes de trocar de conta.");
  if (idle.on) { idleStop(); log("Modo ausente desligado pra trocar de conta.", "warn"); }
  if (state.user) state.prev = { user: state.user, token: state.token, type: state.tokenType };
  state.user = null;
  state.token = null;
  $("token").value = "";
  $("token").type = "password";
  $("account").textContent = "";
  $("userName").textContent = "Desconectado";
  $("userTag").textContent = "clique pra conectar";
  $("avatar").textContent = "?";
  $("helloName").textContent = "visitante";
  $("switchBtn").hidden = true;
  const p = state.prev;
  $("gateBack").hidden = !p;
  if (p) $("gateBackName").textContent = p.user.global_name || p.user.username;
  $("gateSub").textContent = p ? "Escolha outra conta ou cole um token novo." : "Cole seu token pra entrar no painel.";
  lockApp();
}
function backToPrev() {
  const p = state.prev;
  if (!p) return;
  state.user = p.user;
  state.token = p.token;
  state.tokenType = p.type;
  $$("#tokenType button").forEach((b) => b.classList.toggle("on", b.dataset.v === p.type));
  $("token").value = p.token;
  state.prev = null;
  unlockApp();
  showUser(p.user);
  log(`De volta pra ${p.user.global_name || p.user.username}`, "ok");
}
$("swapBtn").addEventListener("click", switchAccount);
$("switchBtn").addEventListener("click", switchAccount);
$("gateBack").addEventListener("click", backToPrev);

async function connect(fromButton) {
  const btn = $("checkBtn");
  btn.disabled = true;
  $("account").textContent = "Conectando…";
  try {
    const tk = $("token").value.trim();
    if (!tk) throw "cole o token primeiro.";
    const remember = $("remember").checked;
    const u = await login(tk, isBot(), fromButton && remember);
    if (fromButton && remember) toast("Conta guardada no Cofre do Windows.");
    if (fromButton && !remember && contas.some((c) => c.id === u.id)) await removeConta(u.id);
  } catch (e) {
    $("account").textContent = `Erro: ${e}`;
  } finally {
    btn.disabled = false;
  }
}

$("remember").addEventListener("change", async () => {
  if (!state.user) return;
  if ($("remember").checked) {
    try {
      await invoke("save_account", { id: state.user.id, token: state.token, isBot: isBot() });
      upsertConta(state.user);
      toast("Conta guardada no Cofre do Windows.");
    } catch (e) { toast(`Não deu pra salvar: ${e}`); $("remember").checked = false; }
  } else {
    await removeConta(state.user.id);
    toast("Conta apagada deste PC.");
  }
});

// Versões até a 0.1.10 guardavam um token só: vira uma conta salva da tela de entrada.
(async () => {
  try {
    const old = await invoke("load_token");
    if (!old) return;
    const [tk, bot] = old;
    const u = await invoke("check_token", { token: tk, isBot: bot });
    await invoke("save_account", { id: u.id, token: tk, isBot: bot });
    upsertConta(u);
    await invoke("forget_token");
    if (document.body.classList.contains("locked")) renderContas();
  } catch {}
})();

// ================= whitelist =================
function renderWhitelist() {
  const ul = $("wlList");
  ul.innerHTML = "";
  state.whitelist.forEach((id, i) => {
    const li = document.createElement("li");
    const rm = document.createElement("button");
    rm.textContent = "×";
    rm.onclick = () => { state.whitelist.splice(i, 1); saveWhitelist(); renderWhitelist(); };
    li.append(document.createTextNode(id), rm);
    ul.append(li);
  });
}
function saveWhitelist() {
  try { localStorage.setItem("whitelist", JSON.stringify(state.whitelist)); } catch {}
}
function addWhitelist() {
  const id = val("wlInput");
  if (!/^\d{15,22}$/.test(id)) return log("ID inválido para a whitelist.", "error");
  if (!state.whitelist.includes(id)) state.whitelist.push(id);
  $("wlInput").value = "";
  saveWhitelist();
  renderWhitelist();
}
$("wlAdd").addEventListener("click", addWhitelist);
$("wlInput").addEventListener("keydown", (e) => e.key === "Enter" && addWhitelist());
try { state.whitelist = JSON.parse(localStorage.getItem("whitelist") || "[]"); } catch {}
renderWhitelist();
const protectedId = (...ids) => $("useWhitelist").checked && ids.some((id) => id && state.whitelist.includes(id));

// ================= opções =================
$("useDelay").addEventListener("change", () => $("delayBox").classList.toggle("show", $("useDelay").checked));
// atalhos (whitelist / delay) nas páginas de limpeza: espelho das chaves de Preferências
function syncChips() {
  $$("[data-sync]").forEach((c) => (c.checked = $(c.dataset.sync).checked));
}
$$("[data-sync]").forEach((c) => c.addEventListener("change", () => {
  const orig = $(c.dataset.sync);
  orig.checked = c.checked;
  orig.dispatchEvent(new Event("change"));
}));
["useWhitelist", "useDelay"].forEach((id) => $(id).addEventListener("change", syncChips));
setTimeout(syncChips);
$("useDates").addEventListener("change", () => $("dateBox").classList.toggle("show", $("useDates").checked));
$("delay").addEventListener("input", () => ($("delayVal").textContent = `${$("delay").value} ms`));

// ================= aparência =================
// desenhos de fundo dos temas (formas simples, geradas aqui)
const svgUrl = (w, h, body) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${body}</svg>`)}")`;
const heart = (x, y, s, o, r = 0) =>
  `<path transform='translate(${x} ${y}) rotate(${r}) scale(${s})' d='M0 6C-5-2-15 1-12 10-10 15 0 22 0 22 0 22 10 15 12 10 15 1 5-2 0 6z' fill='white' fill-opacity='${o}'/>`;
const sparkle = (x, y, s, o) =>
  `<path transform='translate(${x} ${y}) scale(${s})' d='M0-10C1-2 2-1 10 0 2 1 1 2 0 10-1 2-2 1-10 0-2-1-1-2 0-10z' fill='white' fill-opacity='${o}'/>`;
const flower = (x, y, s, o, r = 0) => {
  let p = "";
  for (let k = 0; k < 5; k++) p += `<path transform='rotate(${k * 72})' d='M0 0C-7-5-7-14-2-18L0-15 2-18C7-14 7-5 0 0z'/>`;
  return `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})' fill='white' fill-opacity='${o}'>${p}<circle r='2.5' fill-opacity='${o * 1.5}'/></g>`;
};
const petal = (x, y, s, o, r) =>
  `<path transform='translate(${x} ${y}) rotate(${r}) scale(${s})' d='M0 0C-7-5-7-14-2-18L0-15 2-18C7-14 7-5 0 0z' fill='white' fill-opacity='${o}'/>`;
function spiral(x, y, s, o) {
  let d = "M0 0";
  for (let t = 0.2; t < Math.PI * 6; t += 0.2) d += `L${(Math.cos(t) * t * 1.6).toFixed(1)} ${(Math.sin(t) * t * 1.6).toFixed(1)}`;
  return `<path transform='translate(${x} ${y}) scale(${s})' d='${d}' fill='none' stroke='white' stroke-opacity='${o}' stroke-width='2.2' stroke-linecap='round'/>`;
}
function web() {
  const cx = 900, angs = [], out = [];
  for (let a = 90; a <= 180.1; a += 11.25) angs.push((a * Math.PI) / 180);
  for (const t of angs) out.push(`<line x1='${cx}' y1='0' x2='${(cx + Math.cos(t) * 1300).toFixed(0)}' y2='${(Math.sin(t) * 1300).toFixed(0)}'/>`);
  for (let r = 60; r < 1300; r += r * 0.3 + 24) {
    const pts = angs.map((t) => `${(cx + Math.cos(t) * r).toFixed(1)},${(Math.sin(t) * r).toFixed(1)}`).join(" ");
    out.push(`<polyline points='${pts}' fill='none'/>`);
  }
  return svgUrl(900, 900, `<g stroke='white' stroke-opacity='.10' stroke-width='1.4'>${out.join("")}</g>`);
}
const ring = (x, y, r, o) => `<circle cx='${x}' cy='${y}' r='${r}' fill='none' stroke='white' stroke-opacity='${o}' stroke-width='2'/>`;
const dot = (x, y, r, o) => `<circle cx='${x}' cy='${y}' r='${r}' fill='white' fill-opacity='${o}'/>`;
const cloud = (x, y, s, o) =>
  `<path transform='translate(${x} ${y}) scale(${s})' d='M-22 8a10 10 0 0 1 2-18 13 13 0 0 1 24-5 11 11 0 0 1 18 9 9 9 0 0 1-1 14z' fill='white' fill-opacity='${o}'/>`;
// One Piece: caveirinha com ossos, chapéu de palha e ondinhas
const skull = (x, y, s, o) =>
  `<g transform='translate(${x} ${y}) scale(${s})' fill='white' fill-opacity='${o}'>` +
  `<path d='M-16-12 16 12M16-12-16 12' stroke='white' stroke-opacity='${o}' stroke-width='4' stroke-linecap='round'/>` +
  `<path d='M-9 4a10 10 0 1 1 18 0v5h-18z'/></g>`;
const hat = (x, y, s, o, r = 0) =>
  `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})' fill='white' fill-opacity='${o}'>` +
  `<ellipse cx='0' cy='4' rx='20' ry='4'/><path d='M-11 3a11 10 0 0 1 22 0z'/></g>`;
const wave = (x, y, s, o) =>
  `<path transform='translate(${x} ${y}) scale(${s})' d='M-24 0q6-7 12 0t12 0 12 0 12 0' fill='none' stroke='white' stroke-opacity='${o}' stroke-width='2.4' stroke-linecap='round'/>`;
// Dexter: lâmina, seringa, gotas e respingos de sangue
const blade = (x, y, s, o, r) =>
  `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})'>` +
  `<path d='M-30 0 6-6h8v12H6z' fill='white' fill-opacity='${o}'/>` +
  `<rect x='14' y='-4' width='22' height='8' rx='3' fill='white' fill-opacity='${o * 1.6}'/>` +
  `<path d='M-24 2 4 1' stroke='white' stroke-opacity='${o * 1.8}' stroke-width='1'/></g>`;
const syringe = (x, y, s, o, r) =>
  `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})' stroke='white' stroke-opacity='${o * 1.4}' stroke-width='2' fill='none' stroke-linecap='round'>` +
  `<rect x='-14' y='-5' width='28' height='10' rx='2'/><rect x='-14' y='-5' width='14' height='10' fill='#d3121f' fill-opacity='.18' stroke='none'/>` +
  `<path d='M14 0h16M-14 0h-8M-22-6v12M-8-5v4M-2-5v4M4-5v4'/></g>`;
const drop = (x, y, s, o) =>
  `<path transform='translate(${x} ${y}) scale(${s})' d='M0-12C4-5 8-1 8 4a8 8 0 0 1-16 0c0-5 4-9 8-16z' fill='#ff2a36' fill-opacity='${o}'/>`;
const splat = (x, y, s, o) =>
  `<g transform='translate(${x} ${y}) scale(${s})' fill='#ff2a36' fill-opacity='${o}'>` +
  `<circle r='9'/><circle cx='12' cy='-5' r='4'/><circle cx='-11' cy='7' r='3.5'/><circle cx='4' cy='13' r='2.5'/>` +
  `<circle cx='-16' cy='-8' r='2'/><circle cx='20' cy='6' r='1.8'/><circle cx='-3' cy='-17' r='1.6'/><circle cx='25' cy='-12' r='1.2'/></g>`;
// Rick and Morty: espaço — saturno, planetas com cratera, portal verde, disco voador e estrelas
const saturn = (x, y, s, o, r = -18) =>
  `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})' fill='none' stroke='white' stroke-width='2.4' stroke-linecap='round'>` +
  `<path d='M-30 0A30 8 0 0 1 30 0' stroke-opacity='${o * 0.8}'/>` +
  `<circle r='15' fill='white' fill-opacity='${o}' stroke='none'/>` +
  `<path d='M-11-6h22M-14 1h28' stroke-opacity='${o * 0.7}' stroke-width='1.4'/>` +
  `<path d='M30 0A30 8 0 0 1-30 0' stroke-opacity='${o * 1.6}'/></g>`;
const planet = (x, y, s, o) =>
  `<g transform='translate(${x} ${y}) scale(${s})'><circle r='12' fill='white' fill-opacity='${o}'/>` +
  `<circle cx='-4' cy='-3' r='3' fill='black' fill-opacity='.25'/><circle cx='5' cy='4' r='2' fill='black' fill-opacity='.22'/><circle cx='3' cy='-7' r='1.3' fill='black' fill-opacity='.2'/></g>`;
function portal(x, y, s, o) {
  let d = "";
  for (let k = 0; k <= 48; k++) {
    const t = (k / 48) * Math.PI * 2, r = 22 + Math.sin(t * 5) * 2.2 + Math.cos(t * 3) * 1.6;
    d += `${k ? "L" : "M"}${(Math.cos(t) * r).toFixed(1)} ${(Math.sin(t) * r * 1.12).toFixed(1)}`;
  }
  return `<g transform='translate(${x} ${y}) scale(${s})'>` +
    `<path d='${d}z' fill='#8fe04a' fill-opacity='${o}'/>` +
    `<path d='M-12-6Q0-18 12-6T0 10Q-8 8-6 0' fill='none' stroke='#e8ffc4' stroke-opacity='${o * 1.6}' stroke-width='2.2' stroke-linecap='round'/>` +
    `<circle r='5' fill='#e8ffc4' fill-opacity='${o * 1.4}'/></g>`;
}
const saucer = (x, y, s, o, r = 0) =>
  `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})' fill='white'>` +
  `<path d='M-9-3a9 8 0 0 1 18 0z' fill-opacity='${o * 0.8}'/><ellipse rx='22' ry='5.5' fill-opacity='${o * 1.2}'/>` +
  `<circle cx='-11' cy='0' r='1.4' fill='#b6f0ff' fill-opacity='.5'/><circle cx='0' cy='1' r='1.4' fill='#b6f0ff' fill-opacity='.5'/><circle cx='11' cy='0' r='1.4' fill='#b6f0ff' fill-opacity='.5'/></g>`;
function stars(w, h, n, seed) {
  let s = seed, out = "";
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let k = 0; k < n; k++) out += dot((rnd() * w).toFixed(0), (rnd() * h).toFixed(0), (0.6 + rnd() * 1.1).toFixed(1), (0.12 + rnd() * 0.3).toFixed(2));
  return out;
}
// One Piece: leme, âncora, bússola, gaivotas, X do tesouro e chapéu de palha dourado
function helm(x, y, s, o) {
  let k = "";
  for (let i = 0; i < 8; i++) {
    const t = (i * Math.PI) / 4, c = Math.cos(t), n = Math.sin(t);
    k += `<path d='M${(c * 5).toFixed(1)} ${(n * 5).toFixed(1)}L${(c * 20).toFixed(1)} ${(n * 20).toFixed(1)}'/>` +
      `<circle cx='${(c * 22).toFixed(1)}' cy='${(n * 22).toFixed(1)}' r='2.8' fill='white' stroke='none'/>`;
  }
  return `<g transform='translate(${x} ${y}) scale(${s})' fill='none' stroke='white' stroke-opacity='${o}' fill-opacity='${o}' stroke-width='2.4'>` +
    `<circle r='14'/><circle r='4.5'/>${k}</g>`;
}
const anchor = (x, y, s, o, r = 0) =>
  `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})' fill='none' stroke='white' stroke-opacity='${o}' stroke-width='2.6' stroke-linecap='round'>` +
  `<circle cy='-18' r='4'/><path d='M0-14V18M-9-8H9M-16 6Q-14 18 0 18Q14 18 16 6M-16 6l-4 4M-16 6l4 3M16 6l4 4M16 6l-4 3'/></g>`;
const compass = (x, y, s, o) =>
  `<g transform='translate(${x} ${y}) scale(${s})'>` +
  `<circle r='17' fill='none' stroke='white' stroke-opacity='${o}' stroke-width='1.6' stroke-dasharray='2 3'/>` +
  `<path d='M0-22 4-4 22 0 4 4 0 22-4 4-22 0-4-4z' fill='white' fill-opacity='${o}'/>` +
  `<path d='M0-22 4-4 0 0-4-4z' fill='#e0322f' fill-opacity='${Math.min(1, o * 2.4)}'/></g>`;
const gull = (x, y, s, o) =>
  `<path transform='translate(${x} ${y}) scale(${s})' d='M-10 0Q-5-7 0 0Q5-7 10 0' fill='none' stroke='white' stroke-opacity='${o}' stroke-width='1.8' stroke-linecap='round'/>`;
const strawHat = (x, y, s, o, r = 0) =>
  `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})'>` +
  `<ellipse cy='4' rx='23' ry='4.6' fill='#f5b922' fill-opacity='${o}'/>` +
  `<path d='M-12 3a12 11 0 0 1 24 0z' fill='#f5b922' fill-opacity='${o}'/>` +
  `<rect x='-10.6' y='-3.2' width='21.2' height='3.8' fill='#e0322f' fill-opacity='${Math.min(1, o * 1.5)}'/></g>`;
const treasureX = (x, y, s, o) =>
  `<g transform='translate(${x} ${y}) scale(${s})' fill='none' stroke-linecap='round'>` +
  `<path d='M-40 14q14-16 26-6t22-4' stroke='white' stroke-opacity='${o * 0.8}' stroke-width='1.6' stroke-dasharray='3 4'/>` +
  `<path d='M2-6 14 6M14-6 2 6' stroke='#e0322f' stroke-opacity='${Math.min(1, o * 2)}' stroke-width='3'/></g>`;
// Hora de Aventura: arco-íris, espada, balinha, estrelas coloridas e nuvens
function rainbow(x, y, s, o) {
  const cs = ["#ff5a5a", "#ffa23a", "#ffe14d", "#7cd957", "#4cc3ff", "#a77bff"];
  return `<g transform='translate(${x} ${y}) scale(${s})' fill='none' stroke-width='3.4' stroke-linecap='round'>` +
    cs.map((c, i) => { const r = 32 - i * 3.4; return `<path d='M${-r} 0A${r} ${r} 0 0 1 ${r} 0' stroke='${c}' stroke-opacity='${o}'/>`; }).join("") + `</g>`;
}
const sword = (x, y, s, o, r = 0) =>
  `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})'>` +
  `<path d='M-3.2-30 0-37 3.2-30V6H-3.2z' fill='white' fill-opacity='${o}'/>` +
  `<rect x='-11' y='6' width='22' height='4.4' rx='2.2' fill='#ffcf3a' fill-opacity='${Math.min(1, o * 1.6)}'/>` +
  `<rect x='-2.3' y='10.4' width='4.6' height='12' rx='1.6' fill='#b0703c' fill-opacity='${Math.min(1, o * 1.8)}'/>` +
  `<circle cy='24.5' r='3.2' fill='#ffcf3a' fill-opacity='${Math.min(1, o * 1.6)}'/></g>`;
const candy = (x, y, s, o, r = 0) =>
  `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})'>` +
  `<path d='M-6 0-16-7-13 0-16 7zM6 0 16-7 13 0 16 7z' fill='#ff7eb6' fill-opacity='${o}'/>` +
  `<circle r='7.5' fill='#ff7eb6' fill-opacity='${o}'/>` +
  `<path d='M-5-4 3 6M-1-7 6 2' stroke='white' stroke-opacity='${o}' stroke-width='1.6' stroke-linecap='round'/></g>`;
function star5(x, y, s, o, c = "#ffe14d") {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 4.4 : 10, t = -Math.PI / 2 + (i * Math.PI) / 5;
    d += `${i ? "L" : "M"}${(Math.cos(t) * r).toFixed(1)} ${(Math.sin(t) * r).toFixed(1)}`;
  }
  return `<path transform='translate(${x} ${y}) scale(${s})' d='${d}z' fill='${c}' fill-opacity='${o}' stroke='${c}' stroke-opacity='${o}' stroke-width='2' stroke-linejoin='round'/>`;
}
// Tokyo Ghoul: lírio-aranha vermelho, olho vermelho no preto, centopeia, tentáculos e café
function lily(x, y, s, o, r = 0, c = "#e3192b", c2 = "#ff4a55") {
  let p = "";
  for (let k = 0; k < 6; k++) {
    p += `<g transform='rotate(${k * 60})'>` +
      `<path d='M0 0C2-5 7-10 5-19C4-23 0-22 1.5-19C3-11-1-5 0 0z' fill='${c}' fill-opacity='${o}'/>` +
      `<path d='M0 0C-1-10 3-21 10-29' fill='none' stroke='${c2}' stroke-opacity='${o}' stroke-width='0.9'/>` +
      `<circle cx='10' cy='-29' r='1.4' fill='${c2}' fill-opacity='${o}'/></g>`;
  }
  return `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})'>${p}</g>`;
}
const redEye = (x, y, s, o) =>
  `<g transform='translate(${x} ${y}) scale(${s})'>` +
  `<path d='M-21 0Q0-15 21 0Q0 15-21 0z' fill='black' fill-opacity='.85' stroke='white' stroke-opacity='${o}' stroke-width='1.4'/>` +
  `<path d='M-15-2-9-1M-16 3-10 1.5M15-2 9-1M16 3 10 1.5' stroke='#e3192b' stroke-opacity='${Math.min(1, o * 2.5)}' stroke-width='0.9'/>` +
  `<circle r='7.5' fill='#e3192b' fill-opacity='${Math.min(1, o * 3)}'/><circle r='2.6' fill='black'/></g>`;
function centipede(x, y, s, o, r = 0) {
  let b = "";
  for (let i = 0; i < 12; i++) {
    const cx = i * 7, cy = (Math.sin(i * 0.7) * 5).toFixed(1);
    b += `<path d='M${cx} ${cy}l-2-7M${cx} ${cy}l-2 7' stroke='white' stroke-opacity='${o}' stroke-width='1'/>` +
      `<ellipse cx='${cx}' cy='${cy}' rx='4.2' ry='3' fill='white' fill-opacity='${o}'/>`;
  }
  return `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})'>${b}` +
    `<path d='M-3-1-10-6M-3 1-10 6' stroke='white' stroke-opacity='${o}' stroke-width='1'/></g>`;
}
const tendril = (x, y, s, o, r = 0) =>
  `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})'>` +
  `<path d='M0 0C18-6 30-24 60-31C42-18 31-3 6 9z' fill='#e3192b' fill-opacity='${o}'/>` +
  `<path d='M4 3C20-4 34-18 53-27' fill='none' stroke='#ff7a82' stroke-opacity='${Math.min(1, o * 1.4)}' stroke-width='1'/></g>`;
const coffee = (x, y, s, o) =>
  `<g transform='translate(${x} ${y}) scale(${s})' fill='none' stroke='white' stroke-opacity='${o}' stroke-width='1.8' stroke-linecap='round'>` +
  `<path d='M-10-4h20v6a10 9 0 0 1-20 0z' fill='white' fill-opacity='${o * 0.5}'/>` +
  `<path d='M10-1a4 4 0 0 1 0 7M-15 11h30M-4-8q-3-4 0-7t0-7M3-8q-3-4 0-7'/></g>`;

// Hello Kitty: laço vermelho, maçã, corações, florzinhas e estrelas
const bow = (x, y, s, o, r = 0, c = "#ff3b6b") =>
  `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})' fill='${c}' fill-opacity='${o}'>` +
  `<path d='M0 0C-5-9-19-12-19 0S-5 9 0 0zM0 0C5-9 19-12 19 0S5 9 0 0z'/>` +
  `<path d='M-3 2-8 13-3 11zM3 2 8 13 3 11z'/><circle r='4.2' fill-opacity='${Math.min(1, o * 1.3)}'/>` +
  `<path d='M-14-2C-11-5-7-5-5-2M14-2C11-5 7-5 5-2' fill='none' stroke='white' stroke-opacity='${o * 0.8}' stroke-width='1.2' stroke-linecap='round'/></g>`;
const apple = (x, y, s, o, r = 0) =>
  `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})'>` +
  `<path d='M0-6C-6-11-15-8-15 2-15 12-7 18 0 15 7 18 15 12 15 2 15-8 6-11 0-6z' fill='#ff3b55' fill-opacity='${o}'/>` +
  `<path d='M0-6Q1-12 4-15' fill='none' stroke='#8a4a2a' stroke-opacity='${Math.min(1, o * 1.6)}' stroke-width='1.6' stroke-linecap='round'/>` +
  `<path d='M2-11Q9-17 13-11Q7-8 2-11z' fill='#6fd36b' fill-opacity='${Math.min(1, o * 1.4)}'/>` +
  `<path d='M-9-1Q-9-5-6-6' fill='none' stroke='white' stroke-opacity='${o}' stroke-width='1.6' stroke-linecap='round'/></g>`;
const pinkHeart = (x, y, s, o, r = 0, c = "#ff8fbf") =>
  `<path transform='translate(${x} ${y}) rotate(${r}) scale(${s})' d='M0 6C-5-2-15 1-12 10-10 15 0 22 0 22 0 22 10 15 12 10 15 1 5-2 0 6z' fill='${c}' fill-opacity='${o}'/>`;
// Naruto: shuriken, kunai, tigela de lámen, folhas e pergaminho
const shuriken = (x, y, s, o, r = 0) =>
  `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})'>` +
  `<path d='M0-18 4-4 18 0 4 4 0 18-4 4-18 0-4-4z' fill='white' fill-opacity='${o}'/>` +
  `<circle r='3' fill='black' fill-opacity='.5'/></g>`;
const kunai = (x, y, s, o, r = 0) =>
  `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})'>` +
  `<path d='M0-28 5.5-9 0-5-5.5-9z' fill='white' fill-opacity='${o}'/>` +
  `<rect x='-1.8' y='-5' width='3.6' height='15' rx='1' fill='#ff8a1f' fill-opacity='${Math.min(1, o * 1.6)}'/>` +
  `<circle cy='14.5' r='3.6' fill='none' stroke='white' stroke-opacity='${o}' stroke-width='1.6'/></g>`;
const ramen = (x, y, s, o) =>
  `<g transform='translate(${x} ${y}) scale(${s})'>` +
  `<path d='M-20 0h40a20 15 0 0 1-40 0z' fill='white' fill-opacity='${o}'/>` +
  `<path d='M-17 5h34' stroke='#ff8a1f' stroke-opacity='${Math.min(1, o * 2)}' stroke-width='2'/>` +
  `<path d='M-6-3 14-22M-1-2 19-20' stroke='white' stroke-opacity='${Math.min(1, o * 1.4)}' stroke-width='1.6' stroke-linecap='round'/>` +
  `<path d='M-12-5q-3-4 0-8t0-8M-4-5q-3-4 0-8' fill='none' stroke='white' stroke-opacity='${o * 0.8}' stroke-width='1.4' stroke-linecap='round'/>` +
  `<circle cx='8' cy='-1' r='4' fill='white' fill-opacity='${Math.min(1, o * 1.5)}'/>` +
  `<path d='M8-1m-2 0a2 2 0 1 1 2 2' fill='none' stroke='#ff6aa0' stroke-opacity='.8' stroke-width='1'/></g>`;
const leaf = (x, y, s, o, r = 0, c = "#7cd957") =>
  `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})'>` +
  `<path d='M0 12C-10 4-10-8 0-14 10-8 10 4 0 12z' fill='${c}' fill-opacity='${o}'/>` +
  `<path d='M0 12V-12' stroke='black' stroke-opacity='.25' stroke-width='1'/></g>`;
const scroll = (x, y, s, o, r = 0) =>
  `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})'>` +
  `<rect x='-16' y='-7' width='32' height='14' rx='2' fill='white' fill-opacity='${o}'/>` +
  `<rect x='-20' y='-8.5' width='5' height='17' rx='2.5' fill='#ff8a1f' fill-opacity='${Math.min(1, o * 1.8)}'/>` +
  `<rect x='15' y='-8.5' width='5' height='17' rx='2.5' fill='#ff8a1f' fill-opacity='${Math.min(1, o * 1.8)}'/>` +
  `<path d='M-9-2h18M-9 2h12' stroke='black' stroke-opacity='.3' stroke-width='1.2'/></g>`;
// Homem-Aranha: aranhinha pendurada no fio e prédios no fim da tela
const spider = (x, y, s, o, fio = 0) =>
  `<g transform='translate(${x} ${y}) scale(${s})' stroke='white' stroke-opacity='${o}' stroke-width='1.4' fill='none' stroke-linecap='round'>` +
  (fio ? `<path d='M0-6V${-fio}' stroke-width='.8'/>` : "") +
  `<path d='M-3-2-10-8-13-4M-3 0-11-2-14 3M-3 2-10 6-12 11M-2 3-6 10-6 15M3-2 10-8 13-4M3 0 11-2 14 3M3 2 10 6 12 11M2 3 6 10 6 15'/>` +
  `<ellipse cy='-2' rx='3.4' ry='4' fill='white' fill-opacity='${o}' stroke='none'/><ellipse cy='5' rx='4.4' ry='5.4' fill='white' fill-opacity='${o}' stroke='none'/></g>`;
function skyline(w, h, o) {
  let s = 7, x = 0, d = "";
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  while (x < w) {
    const bw = 26 + rnd() * 40, bh = 60 + rnd() * 150;
    d += `<rect x='${x.toFixed(0)}' y='${(h - bh).toFixed(0)}' width='${(bw - 3).toFixed(0)}' height='${bh.toFixed(0)}'/>`;
    for (let wy = h - bh + 10; wy < h - 8; wy += 14) for (let wx = x + 5; wx < x + bw - 9; wx += 9)
      if (rnd() > 0.62) d += `<rect x='${wx.toFixed(0)}' y='${wy.toFixed(0)}' width='3' height='5' fill='#ffd36e' fill-opacity='${Math.min(1, o * 4)}'/>`;
    x += bw;
  }
  return svgUrl(w, h, `<g fill='white' fill-opacity='${o}'>${d}</g>`);
}
// Zero Two: flor de cerejeira rosa, pétalas caindo e estrelinhas
function sakura(x, y, s, o, r = 0) {
  let p = "";
  for (let k = 0; k < 5; k++) p += `<path transform='rotate(${k * 72})' d='M0 0C-7-4-8-13-3-17L0-14 3-17C8-13 7-4 0 0z'/>`;
  return `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})' fill='#ffb3c9' fill-opacity='${o}'>${p}` +
    `<circle r='3' fill='#ff4f7a' fill-opacity='${Math.min(1, o * 1.8)}'/></g>`;
}
const pinkPetal = (x, y, s, o, r) =>
  `<path transform='translate(${x} ${y}) rotate(${r}) scale(${s})' d='M0 0C-6-4-7-12-2-16L0-13 2-16C7-12 6-4 0 0z' fill='#ffb3c9' fill-opacity='${o}'/>`;
// Dexter: lâmina de vidro com gota de sangue
const slide = (x, y, s, o, r = 0) =>
  `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})'>` +
  `<rect x='-24' y='-8' width='48' height='16' rx='1.5' fill='white' fill-opacity='${o * 0.6}' stroke='white' stroke-opacity='${o * 1.5}' stroke-width='1'/>` +
  `<circle cx='6' cy='0' r='4.5' fill='#ff2a36' fill-opacity='${Math.min(1, o * 3)}'/>` +
  `<rect x='-21' y='-5' width='9' height='10' fill='white' fill-opacity='${o}'/></g>`;

const PATTERNS = {
  // respingos, faca, seringa, lâminas de vidro com sangue e gotas
  dexter: { img: svgUrl(360, 340, splat(60, 60, 1.4, 0.132) + blade(240, 70, 1.4, 0.096, -28) + syringe(95, 215, 1.5, 0.084, 32) + slide(250, 170, 1.1, 0.096, 12) + slide(270, 190, 1.1, 0.078, 22) + drop(160, 140, 0.9, 0.144) + drop(180, 165, 0.5, 0.12) + splat(280, 300, 0.7, 0.108) + blade(150, 315, 0.8, 0.072, 160) + drop(330, 40, 0.6, 0.12) + splat(25, 300, 0.5, 0.096)), size: "360px", pos: "0 0", rep: "repeat" },
  // mar aberto: leme, chapéu de palha, âncora, bússola, caveira pirata, gaivotas, ondas e o X do tesouro
  onepiece: { img: svgUrl(380, 360, helm(75, 75, 1.35, 0.14) + strawHat(275, 95, 1.6, 0.3, -12) + skull(285, 250, 1.1, 0.12) + anchor(85, 255, 1.25, 0.14, 14) + compass(185, 185, 0.95, 0.16) + wave(40, 170, 0.9, 0.16) + wave(330, 185, 0.8, 0.14) + wave(180, 330, 1.1, 0.16) + wave(345, 20, 0.7, 0.12) + wave(200, 290, 0.6, 0.12) + gull(180, 40, 1, 0.24) + gull(205, 56, 0.7, 0.2) + gull(345, 320, 0.8, 0.2) + treasureX(330, 345, 0.8, 0.22) + strawHat(160, 255, 0.6, 0.22, 16) + sparkle(130, 125, 0.5, 0.2) + sparkle(25, 335, 0.4, 0.18)), size: "380px", pos: "0 0", rep: "repeat" },
  // laços vermelhos, maçãs, corações rosa, florzinhas brancas e estrelinhas amarelas
  kitty: { img: svgUrl(320, 300, bow(60, 55, 1.5, 0.189, -12) + apple(235, 80, 1.15, 0.18, 10) + pinkHeart(160, 150, 1, 0.135, -8) + flower(270, 220, 1.1, 0.072, 15) + bow(95, 225, 0.9, 0.162, 18) + star5(175, 35, 0.75, 0.189, "#ffe14d") + pinkHeart(20, 140, 0.6, 0.126, 12, "#ffffff") + apple(180, 270, 0.65, 0.153, -15) + star5(300, 150, 0.5, 0.171, "#ffe14d") + flower(30, 290, 0.7, 0.063) + sparkle(130, 95, 0.7, 0.135) + pinkHeart(290, 20, 0.55, 0.117)), size: "320px", pos: "0 0", rep: "repeat" },
  // teia no canto, aranhas penduradas e prédios da cidade embaixo
  aranha: { img: `${web()}, ${skyline(1200, 260, 0.035)}, ${svgUrl(420, 380, spider(90, 120, 1.3, 0.11, 120) + spider(300, 70, 0.9, 0.09, 70) + spider(220, 300, 0.7, 0.08, 90) + spider(380, 250, 0.6, 0.075, 60))}`, size: "900px, 1200px 260px, 420px", pos: "right top, left bottom, 0 0", rep: "no-repeat, repeat-x, repeat" },
  // flores de cerejeira, pétalas caindo, corações e estrelinhas
  zerotwo: { img: svgUrl(320, 300, sakura(65, 60, 1.5, 0.15, 10) + sakura(230, 195, 1.1, 0.13, -20) + pinkPetal(200, 55, 0.9, 0.16, 40) + pinkPetal(95, 215, 0.8, 0.15, -60) + pinkPetal(280, 110, 0.6, 0.14, 120) + pinkPetal(25, 150, 0.6, 0.14, 200) + pinkPetal(150, 130, 0.5, 0.13, 80) + pinkHeart(150, 260, 0.7, 0.11, -10, "#ff4f7a") + sparkle(285, 30, 0.6, 0.15) + sparkle(40, 270, 0.5, 0.13) + sakura(300, 285, 0.6, 0.11, 30)), size: "320px", pos: "0 0", rep: "repeat" },
  // shuriken, kunai, lámen, folhas, pergaminho e espirais
  naruto: { img: svgUrl(360, 340, shuriken(70, 65, 1.3, 0.1, 15) + kunai(260, 80, 1.2, 0.1, 35) + ramen(180, 200, 1.3, 0.1) + leaf(40, 220, 1.1, 0.16, -30) + leaf(320, 230, 0.8, 0.14, 40) + scroll(300, 310, 1, 0.1, -12) + spiral(170, 60, 0.8, 0.08) + spiral(70, 310, 0.6, 0.07) + shuriken(320, 160, 0.6, 0.09, -10) + kunai(110, 140, 0.7, 0.08, -50) + leaf(220, 20, 0.6, 0.13, 10)), size: "360px", pos: "0 0", rep: "repeat" },
  // espaço: saturno, planetas, portal verde, disco voador e muitas estrelas
  rick: { img: svgUrl(360, 360, stars(360, 360, 60, 7) + saturn(85, 80, 1.4, 0.2) + portal(270, 215, 1.2, 0.3) + planet(280, 60, 1, 0.17) + planet(70, 285, 0.7, 0.15) + saucer(160, 300, 1.15, 0.18, -10) + saturn(300, 330, 0.55, 0.15, 20) + sparkle(185, 140, 0.7, 0.28) + sparkle(335, 130, 0.45, 0.24) + sparkle(30, 180, 0.5, 0.24) + planet(185, 30, 0.45, 0.18)), size: "360px", pos: "0 0", rep: "repeat" },
  // terra de Ooo: arco-íris, espada, balinhas, estrelas coloridas e nuvens
  aventura: { img: svgUrl(360, 340, cloud(65, 55, 1.5, 0.12) + rainbow(255, 100, 1.25, 0.3) + sword(85, 215, 1.15, 0.2, -28) + candy(210, 235, 1.15, 0.32, 20) + star5(175, 45, 0.95, 0.38) + star5(320, 260, 0.65, 0.34, "#ff7eb6") + star5(30, 315, 0.55, 0.32, "#7cd957") + star5(150, 150, 0.45, 0.3, "#4cc3ff") + cloud(280, 300, 0.95, 0.1) + candy(335, 25, 0.75, 0.28, -30) + sparkle(120, 110, 0.7, 0.22) + sparkle(250, 175, 0.5, 0.2) + rainbow(120, 330, 0.6, 0.24) + dot(300, 200, 2, 0.3) + dot(40, 120, 1.6, 0.26)), size: "360px", pos: "0 0", rep: "repeat" },
  // lírios-aranha, olho vermelho, tentáculos vermelhos, centopeia, café e gotas
  // mais branco: lírios brancos, centopeia e café em branco; o vermelho só no olho, num lírio e nas gotas
  tokyoghoul: { img: svgUrl(380, 360, redEye(90, 80, 1.3, 0.1) + lily(275, 90, 1.25, 0.18, 15, "#ffffff", "#ffffff") + tendril(10, 235, 1.3, 0.084, -12) + centipede(205, 265, 1, 0.132, -20) + coffee(320, 315, 1, 0.132) + drop(165, 175, 0.6, 0.08) + lily(95, 320, 0.7, 0.156, -20, "#ffffff", "#ffffff") + lily(190, 40, 0.55, 0.18, 40) + sparkle(320, 20, 0.6, 0.18) + sparkle(250, 190, 0.6, 0.18) + sparkle(40, 150, 0.45, 0.156)), size: "380px", pos: "0 0", rep: "repeat" },
};

const THEMES = ["preto", "rosa", "azul", "roxo", "vermelho", "cinza", "menta", "dourado", "oceano", "kitty", "aranha", "zerotwo", "naruto", "onepiece", "dexter", "rick", "aventura", "tokyoghoul"];
const STYLES = ["solido", "translucido", "vidro", "glass", "acrilico", "neon"];
const LOOK_DEF = { theme: "rosa", style: "vidro", motion: true, splash: true, blur: 6, dim: 45, pk: 100, pb: 100 };
let look = { ...LOOK_DEF };
try { look = { ...LOOK_DEF, ...JSON.parse(localStorage.getItem("look") || "{}") }; } catch {}
if (!THEMES.includes(look.theme)) look.theme = LOOK_DEF.theme;
if (!STYLES.includes(look.style)) look.style = LOOK_DEF.style;

// ícone de cada tema (aparece na abertura, na entrada, na barra do topo e no cartão
// do tema). Arquivo faltando = volta pra gatinha.
const THEME_PIC = {
  kitty: "kitty.png",
  rosa: "temas/rosa.png", azul: "temas/azul.png", roxo: "temas/roxo.png", dourado: "temas/dourado.png",
  aranha: "temas/aranha.png", zerotwo: "temas/zerotwo.png", naruto: "temas/naruto.png",
  rick: "temas/rick.png", aventura: "temas/aventura.png", tokyoghoul: "temas/tokyoghoul.png",
  vermelho: "temas/vermelho.png", onepiece: "temas/onepiece.png", dexter: "temas/dexter.png",
  preto: "temas/preto.png", cinza: "temas/cinza.png", menta: "temas/menta.png", oceano: "temas/oceano.png",
};
const picFor = (t) => THEME_PIC[t] || "kitty.png";
function setPic(img, src) {
  if (!img || img.getAttribute("src") === src) return;
  img.onerror = () => { img.onerror = null; img.src = "kitty.png"; };
  img.src = src;
}
// cartões dos temas: o ícone entra no lugar do emoji
$$(".theme").forEach((t) => {
  if (!THEME_PIC[t.dataset.t]) return;
  const img = document.createElement("img");
  img.className = "tPic";
  img.alt = "";
  img.onerror = () => img.remove();
  img.src = THEME_PIC[t.dataset.t];
  img.onload = () => t.querySelector(".tPrev em")?.remove();
  t.querySelector(".tPrev").append(img);
});

function applyLook() {
  const root = document.documentElement;
  const pic = picFor(look.theme);
  setPic(document.querySelector(".spPic img"), pic);
  setPic($$(".gatePic")[0], pic);
  setPic($$(".brandPic")[0], pic);
  setPic($$(".tbIcon")[0], THEME_PIC[look.theme] ? pic : "icon64.png");
  // ícone da barra de tarefas do Windows e do relógio
  if (look.theme !== state.iconTheme) {
    state.iconTheme = look.theme;
    invoke("set_theme_icon", { theme: look.theme }).catch((e) => console.warn("ícone:", e));
  }
  // troca tudo no mesmo quadro, sem transições pela metade
  root.classList.add("switching");
  root.dataset.theme = look.theme;
  root.dataset.style = look.style;
  root.classList.toggle("still", !look.motion);
  const pat = PATTERNS[look.theme], el = $("pattern");
  el.style.backgroundImage = pat ? pat.img : "none";
  if (pat) Object.assign(el.style, { backgroundSize: pat.size, backgroundPosition: pat.pos, backgroundRepeat: pat.rep });
  root.style.setProperty("--bgBlur", `${look.blur}px`);
  root.style.setProperty("--bgDim", look.dim / 100);
  root.style.setProperty("--k", look.pk / 100);   // intensidade do estilo dos painéis
  root.style.setProperty("--kb", look.pb / 100);  // desfoque dos painéis
  $("pnK").value = look.pk; $("pnKV").textContent = `${look.pk}%`;
  $("pnB").value = look.pb; $("pnBV").textContent = `${look.pb}%`;
  $$(".theme").forEach((t) => t.classList.toggle("on", t.dataset.t === look.theme));
  $$(".style").forEach((t) => t.classList.toggle("on", t.dataset.s === look.style));
  $("lookMotion").checked = look.motion;
  $("lookSplash").checked = look.splash;
  $("bgBlur").value = look.blur; $("bgBlurV").textContent = look.blur;
  $("bgDim").value = look.dim; $("bgDimV").textContent = `${look.dim}%`;
  try { localStorage.setItem("look", JSON.stringify(look)); } catch {}
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("switching")));
}
$$(".theme").forEach((t) => t.addEventListener("click", () => { if (look.theme !== t.dataset.t) { look.theme = t.dataset.t; applyLook(); } }));
$$(".style").forEach((t) => t.addEventListener("click", () => { if (look.style !== t.dataset.s) { look.style = t.dataset.s; applyLook(); } }));
$("lookMotion").addEventListener("change", () => { look.motion = $("lookMotion").checked; applyLook(); });
$("lookSplash").addEventListener("change", () => { look.splash = $("lookSplash").checked; applyLook(); });
$("bgBlur").addEventListener("input", () => { look.blur = +$("bgBlur").value; applyLook(); });
$("bgDim").addEventListener("input", () => { look.dim = +$("bgDim").value; applyLook(); });
$("pnK").addEventListener("input", () => { look.pk = +$("pnK").value; applyLook(); });
$("pnB").addEventListener("input", () => { look.pb = +$("pnB").value; applyLook(); });
$("lookReset").addEventListener("click", () => {
  Object.assign(look, { pk: LOOK_DEF.pk, pb: LOOK_DEF.pb, blur: LOOK_DEF.blur, dim: LOOK_DEF.dim });
  applyLook();
});
applyLook();

// ---------- imagem/GIF de fundo (guardada no IndexedDB, só neste PC) ----------
const bgDb = () => new Promise((ok, err) => {
  const r = indexedDB.open("tomalerda", 1);
  r.onupgradeneeded = () => r.result.createObjectStore("fundo");
  r.onsuccess = () => ok(r.result);
  r.onerror = () => err(r.error);
});
async function bgStore(mode, fn) {
  const db = await bgDb();
  return new Promise((ok, err) => {
    const tx = db.transaction("fundo", mode), req = fn(tx.objectStore("fundo"));
    tx.oncomplete = () => ok(req && req.result);
    tx.onerror = () => err(tx.error);
  });
}
let bgUrl = null;
function showBg(blob) {
  if (bgUrl) URL.revokeObjectURL(bgUrl);
  bgUrl = blob ? URL.createObjectURL(blob) : null;
  const css = bgUrl ? `url("${bgUrl}")` : "";
  $("bgImg").style.backgroundImage = css;
  $("bgThumb").style.backgroundImage = css;
  $("bgThumb").classList.toggle("on", !!bgUrl);
  document.documentElement.classList.toggle("hasBg", !!bgUrl);
  $("bgRemove").disabled = !bgUrl;
}
$("bgChoose").addEventListener("click", () => $("bgFile").click());
$("bgFile").addEventListener("change", async () => {
  const file = $("bgFile").files[0];
  $("bgFile").value = "";
  if (!file) return;
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return toast("Escolha uma imagem PNG, JPG, WEBP ou GIF.");
  if (file.size > 30 * 1024 * 1024) return toast("Arquivo grande demais — o limite é 30 MB.");
  try {
    await bgStore("readwrite", (s) => s.put(file, "img"));
    showBg(file);
    toast(file.type === "image/gif" ? "GIF de fundo aplicado!" : "Imagem de fundo aplicada!");
  } catch (e) {
    toast(`Não deu pra salvar a imagem: ${e}`);
  }
});
$("bgRemove").addEventListener("click", async () => {
  try { await bgStore("readwrite", (s) => s.delete("img")); } catch {}
  showBg(null);
  toast("Fundo removido.");
});
bgStore("readonly", (s) => s.get("img")).then((b) => showBg(b instanceof Blob ? b : null)).catch(() => showBg(null));

// ================= barra do topo =================
function toast(msg, ms = 3200) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), ms);
}
try {
  const win = window.__TAURI__.window.getCurrentWindow();
  $("wClose").addEventListener("click", () => win.close());
  $("wMin").addEventListener("click", () => win.minimize());
  $("wHide").addEventListener("click", async () => {
    await win.hide();
    log("Em segundo plano — clique no ícone perto do relógio para voltar.", "info");
  });
  // versão instalada (vem do próprio app) na barra lateral e na abertura
  window.__TAURI__.app.getVersion().then((v) => {
    for (const [id, txt] of [["appVer", `v${v}`], ["spVer", `versão ${v}`], ["gateVer", `v${v}`]]) {
      const el = $(id);
      if (el) { el.textContent = txt; el.hidden = false; }
    }
  }).catch(() => {});
  // dois cliques na barra = maximizar / voltar
  document.querySelector(".tbTitle").addEventListener("dblclick", () => win.toggleMaximize());
  // maximizada = cantos retos; normal = arredondada
  const syncMax = async () => {
    try { document.body.classList.toggle("maxed", await win.isMaximized()); } catch {}
  };
  win.onResized(syncMax);
  syncMax();
} catch (e) {
  console.error(e);
}

// ================= atualização =================
// Confere ao abrir, a cada 1 min e quando a janela volta pro foco (o latest.json tem
// menos de 1 KB). Achou versão nova: instala sozinho assim que o app
// estiver parado (sem processo rodando e sem modo ausente ligado) e reabre na hora.
// O botão na barra lateral continua lá pra quem quiser atualizar na mão.
const upd = { version: null, installing: false, failed: 0 };
async function installUpdate(auto) {
  if (upd.installing) return;
  upd.installing = true;
  const btn = $("updBtn");
  btn.disabled = true;
  $("updText").textContent = "Baixando…";
  if (auto) toast(`Atualizando pra v${upd.version}… o app reabre sozinho.`);
  const off = await window.__TAURI__.event.listen("update-progress", (e) => ($("updText").textContent = `Baixando ${e.payload}%`));
  try {
    await invoke("install_update"); // o app reabre sozinho no fim
  } catch (e) {
    off();
    upd.installing = false;
    upd.failed++;
    btn.disabled = false;
    $("updText").textContent = "Tentar de novo";
    toast(`Não deu pra atualizar: ${e}`);
  }
}
const busy = () => state.running || (typeof idle !== "undefined" && idle.on);
async function checkUpdate() {
  if (upd.installing) return;
  try {
    const v = await invoke("check_update");
    if (!v) return;
    upd.version = v;
    $("updText").textContent = `Atualizar (v${v})`;
    $("updBtn").hidden = false;
    // automático: só se não estiver no meio de nada e sem ter falhado 2x seguidas
    if (!busy() && upd.failed < 2) installUpdate(true);
  } catch (e) {
    console.warn("atualização:", e);
  }
}
$("updBtn").addEventListener("click", () => installUpdate(false));
setTimeout(checkUpdate, 4000);
// a cada minuto: se já sabe da versão nova (esperando um processo acabar), tenta instalar;
// senão, confere no servidor
setInterval(() => {
  if (upd.version) { if (!upd.installing && !busy() && upd.failed < 2) installUpdate(true); }
  else checkUpdate();
}, 60 * 1000);
// voltou pra janela: confere na hora (no máximo 1x a cada 20 s)
let lastFocusCheck = 0;
window.addEventListener("focus", () => {
  if (Date.now() - lastFocusCheck < 20000) return;
  lastFocusCheck = Date.now();
  checkUpdate();
});

// ================= segurança da interface =================
// sem menu do botão direito (exceto em campos de texto) e sem atalhos de recarregar/inspecionar
document.addEventListener("contextmenu", (e) => {
  if (!e.target.closest("input, textarea")) e.preventDefault();
});
document.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k === "f5" || k === "f12" || (e.ctrlKey && (k === "r" || k === "u" || k === "p")) || (e.ctrlKey && e.shiftKey && (k === "i" || k === "j" || k === "c"))) {
    e.preventDefault();
  }
});
// pausa as animações do fundo quando a janela está escondida/minimizada (economiza CPU)
document.addEventListener("visibilitychange", () => document.documentElement.classList.toggle("paused", document.hidden));

// ================= tela de abertura =================
(function splash() {
  const sp = $("splash");
  if (!look.splash) { sp.remove(); return; }
  const hearts = $("spHearts");
  for (let i = 0; i < 18; i++) {
    const h = document.createElement("span");
    h.textContent = ["♥", "✦", "♡"][i % 3];
    h.style.left = Math.random() * 100 + "%";
    h.style.fontSize = 10 + Math.random() * 18 + "px";
    h.style.animationDuration = 4 + Math.random() * 4 + "s";
    h.style.animationDelay = -Math.random() * 6 + "s";
    hearts.append(h);
  }
  const eraserDone = splashEraser(sp); // a borrachinha apaga o nome e ele volta escrito
  const MSGS = ["acordando…", "apagando a bagunça…", "polindo o vidro…", "escolhendo as cores…", "quase lá…", "pronto!"];
  let pct = 0;
  (function tick() {
    pct = Math.min(100, pct + 1.5 + Math.random() * 4.5);
    $("spBar").style.width = pct + "%";
    $("spPct").textContent = Math.floor(pct) + "%";
    $("spMsg").textContent = MSGS[Math.min(MSGS.length - 1, Math.floor(pct / 20))];
    if (pct < 100) return setTimeout(tick, 45 + Math.random() * 70);
    // só sai depois que o nome voltou escrito (no máximo 1,2 s de espera)
    Promise.race([eraserDone, new Promise((r) => setTimeout(r, 1200))]).then(() =>
      setTimeout(() => {
        sp.classList.add("out");
        setTimeout(() => sp.remove(), 650);
      }, 260));
  })();
})();

// Borrachinha da abertura: entra, esfrega o "tomalerda" da esquerda pra direita soltando
// farelinhos, sai de lado e o nome volta escrito com brilhinhos. Uns 2 s no total.
async function splashEraser(sp) {
  const card = sp.querySelector(".spCard"), logo = sp.querySelector(".spLogo");
  if (!card || !logo) return;
  const er = document.createElement("div");
  er.className = "spEr";
  er.innerHTML =
    `<svg viewBox="6 8 173 152"><defs>` +
    `<clipPath id="spErF"><path d="M12 42 73 78v46L12 88z"/></clipPath>` +
    `<clipPath id="spErC"><path d="M73 78 124 107v46L73 124z"/></clipPath>` +
    `<clipPath id="spErP"><path d="M124 107 173 79v46l-49 28z"/></clipPath></defs>` +
    `<path class="t" d="M60 14 122 50 73 78 12 42z"/><path class="f" d="M12 42 73 78v46L12 88z"/>` +
    `<path class="c" d="M122 50 173 79 124 107 73 78z"/><path class="c" d="M73 78 124 107v46L73 124z"/><path class="c" d="M124 107 173 79v46l-49 28z"/>` +
    `<g clip-path="url(#spErF)"><ellipse class="sh" cx="34" cy="122" rx="62" ry="30"/></g>` +
    `<g clip-path="url(#spErC)"><ellipse class="cs" cx="96" cy="160" rx="52" ry="22"/></g>` +
    `<g clip-path="url(#spErP)"><ellipse class="cs" cx="160" cy="158" rx="50" ry="26"/></g>` +
    `<path d="M40 30 80 53" stroke="#fff" stroke-opacity=".7" stroke-width="5" stroke-linecap="round"/>` +
    `<path class="o" d="M60 14 122 50 73 78 12 42zM12 42 73 78v46L12 88zM122 50 173 79 124 107 73 78zM73 78 124 107v46L73 124zM124 107 173 79v46l-49 28z"/></svg>`;
  card.append(er);

  const TX = 2, TY = 26.8, BASE = -38;   // ponta rosa dentro do desenho (58 px de largura)
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const tween = (ms, fn, e = (t) => t) => new Promise((res) => {
    const s = performance.now();
    (function f(now) {
      const t = Math.min(1, (now - s) / ms);
      fn(e(t));
      t < 1 ? requestAnimationFrame(f) : res();
    })(s);
  });
  let pos = { x: 0, y: 0, r: BASE };
  const place = (x, y, r) => { pos = { x, y, r }; er.style.transform = `translate(${x - TX}px, ${y - TY}px) rotate(${r}deg)`; };
  const moveTo = (x, y, r, ms, arc = 18) => {
    const p = { ...pos };
    return tween(ms, (t) => place(p.x + (x - p.x) * t, p.y + (y - p.y) * t - Math.sin(t * Math.PI) * arc, p.r + (r - p.r) * t), ease);
  };
  const crumb = (x, y) => {
    const c = document.createElement("i");
    c.className = "spCrumb";
    const s = 2.5 + Math.random() * 3.5;
    c.style.width = `${s}px`; c.style.height = `${s * (0.6 + Math.random() * 0.7)}px`;
    c.style.background = ["var(--er)", "var(--a2)", "color-mix(in srgb, var(--er) 70%, #fff)", "rgba(255,255,255,.7)"][(Math.random() * 4) | 0];
    card.append(c);
    let vx = (Math.random() - 0.65) * 2.4, vy = -0.5 - Math.random() * 2, px = x, py = y, rot = Math.random() * 360, life = 0;
    const max = 34 + Math.random() * 20;
    (function f() {
      life++; vy += 0.2; px += vx; py += vy; rot += vx * 9;
      c.style.transform = `translate(${px}px, ${py}px) rotate(${rot}deg)`;
      c.style.opacity = String(Math.max(0, 1 - life / max));
      life < max ? requestAnimationFrame(f) : c.remove();
    })();
  };
  const spark = (x, y) => {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "-10 -10 20 20"); s.classList.add("spSpark");
    s.innerHTML = `<path d="M0-10C1-2 2-1 10 0 2 1 1 2 0 10-1 2-2 1-10 0-2-1-1-2 0-10z" fill="${Math.random() < 0.5 ? "var(--a2)" : "#fff"}"/>`;
    card.append(s);
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, d = 18 + Math.random() * 26;
    tween(620, (t) => {
      s.style.transform = `translate(${x + Math.cos(a) * d * t - 6}px, ${y + Math.sin(a) * d * t - 6}px) scale(${Math.sin(t * Math.PI)}) rotate(${t * 200}deg)`;
    }, (t) => 1 - Math.pow(1 - t, 2)).then(() => s.remove());
  };

  // posição do nome dentro do cartão (offset* não muda com a animação de entrada do cartão)
  const L = logo.offsetLeft + 8, W = logo.offsetWidth - 16, T = logo.offsetTop, H = logo.offsetHeight;
  const top = T + H * 0.42, bot = T + H * 0.74, mid = (top + bot) / 2, amp = (bot - top) / 2;

  await sleep(420);                                   // deixa o cartão terminar de entrar
  place(L + W + 26, T + H + 6, BASE + 12);
  er.classList.add("on");
  await moveTo(L - 4, mid, BASE, 240);
  await tween(760, (t) => {                           // esfrega rápido, 7 idas e vindas
    const p = t * (W + 14), wob = Math.sin(t * Math.PI * 14);
    place(L - 4 + p, mid + wob * amp, BASE + wob * 8);
    logo.style.setProperty("--ec", `${p + 2}px`);
    if (Math.random() < 0.65) crumb(pos.x, pos.y);
  });
  await moveTo(L + W + 26, T + H + 6, BASE + 12, 200, 14);
  er.classList.remove("on");
  logo.classList.add("write");                        // o nome volta escrito
  await tween(440, (t) => {
    const p = t * (W + 50);
    logo.style.setProperty("--w", `${Math.max(0, p - 22)}px`);
    if (Math.random() < 0.3) spark(L + p - 20, T + H * (0.3 + Math.random() * 0.45));
  }, ease);
  logo.classList.remove("write");
  logo.style.removeProperty("--ec");
  logo.style.removeProperty("--w");
  setTimeout(() => er.remove(), 300);
}

// caixas extras que só aparecem com a opção ligada
[["idAfk", "afkBox"], ["idReply", "replyBox"]].forEach(([t, box]) => {
  const upd = () => $(box).classList.toggle("show", $(t).checked);
  $(t).addEventListener("change", upd);
  setTimeout(upd);
});

$("stopBtn").addEventListener("click", async () => {
  state.queue = [];
  $("statusText").textContent = "Parando…";
  await invoke("stop_deletion");
});
$("clearLog").addEventListener("click", () => ($("log").innerHTML = ""));

// ================= modo ausente (gateway) =================
const IDLE_CHECKS = ["idLeaveGroups", "idClose", "idAfk", "idReply", "idMute", "idDeaf"];
const IDLE_TEXTS = ["idGuild", "idChannel", "idMsg"];
const idle = {
  on: false, ws: null, hb: null, seq: null, ackd: true,
  sessionId: null, resumeUrl: null, token: null, me: null,
  groups: new Set(), lastReply: {}, voiceTimer: null, lastVoice: 0,
  stats: { groups: 0, closed: 0, replies: 0 },
};
const opt = (id) => $(id).checked;

function saveIdle() {
  const o = {};
  IDLE_CHECKS.forEach((id) => (o[id] = $(id).checked));
  IDLE_TEXTS.forEach((id) => (o[id] = $(id).value));
  try { localStorage.setItem("idle", JSON.stringify(o)); } catch {}
}
try {
  const o = JSON.parse(localStorage.getItem("idle") || "{}");
  IDLE_CHECKS.forEach((id) => id in o && ($(id).checked = o[id]));
  IDLE_TEXTS.forEach((id) => id in o && ($(id).value = o[id]));
} catch {}
[...IDLE_CHECKS, ...IDLE_TEXTS].forEach((id) => $(id).addEventListener("change", saveIdle));
["idAfk", "idGuild", "idChannel", "idMute", "idDeaf"].forEach((id) =>
  $(id).addEventListener("change", () => idle.me && (opt("idAfk") ? joinVoice() : leaveVoice()))
);

function idleUi(kind, title, sub) {
  $("idleBig").className = "bigDot " + kind;
  $("idleTitle").textContent = title;
  if (sub) $("idleSub").textContent = sub;
  $("idleDot").classList.toggle("on", kind === "on");
  $("idleDot").classList.toggle("wait", kind === "wait");
  const btn = $("idleBtn");
  btn.textContent = idle.on ? "Desligar" : "Ligar";
  btn.classList.toggle("off", idle.on);
}
function idleStats() {
  $("iGroups").textContent = idle.stats.groups;
  $("iClosed").textContent = idle.stats.closed;
  $("iReplies").textContent = idle.stats.replies;
}
const ilog = (m, l = "info") => log(`💤 ${m}`, l);

$("idleBtn").addEventListener("click", () => (idle.on ? idleStop() : idleStart()));

function idleStart() {
  if (!hasToken() || needUser()) return;
  idle.on = true;
  idle.token = state.token.trim().replace(/^"|"$/g, "");
  idle.sessionId = null;
  idle.seq = null;
  idleUi("wait", "Conectando…");
  gwConnect(false);
}

function idleStop() {
  idle.on = false;
  leaveVoice();
  clearInterval(idle.hb);
  clearTimeout(idle.voiceTimer);
  try { idle.ws?.close(1000); } catch {}
  idle.ws = null;
  idle.me = null;
  idleUi("off", "Desligado", "Liga e o tomalerda fica cuidando da sua conta enquanto o app estiver aberto.");
  ilog("Modo ausente desligado.", "warn");
}

function send(op, d) {
  if (idle.ws?.readyState === 1) idle.ws.send(JSON.stringify({ op, d }));
}

function gwConnect(resume) {
  const base = resume && idle.resumeUrl ? idle.resumeUrl : "wss://gateway.discord.gg";
  const ws = new WebSocket(`${base}/?v=10&encoding=json`);
  idle.ws = ws;
  ws.onmessage = (e) => {
    if (ws !== idle.ws) return;
    let p;
    try { p = JSON.parse(e.data); } catch { return; }
    onPacket(p, resume);
  };
  ws.onclose = (e) => {
    if (ws !== idle.ws) return;
    clearInterval(idle.hb);
    if (!idle.on) return;
    if ([4004, 4010, 4011, 4012, 4013, 4014].includes(e.code)) {
      ilog(e.code === 4004 ? "Token inválido." : `Discord recusou a conexão (${e.code}).`, "error");
      idleStop();
      return;
    }
    idleUi("wait", "Reconectando…");
    idle.tries = (idle.tries || 0) + 1; const wait = Math.min(60000, 2000 * 2 ** Math.min(idle.tries, 5)); setTimeout(() => idle.on && gwConnect(!!idle.sessionId), wait);
  };
}

function onPacket(p, resume) {
  if (p.s != null) idle.seq = p.s;
  switch (p.op) {
    case 10: {
      const every = p.d.heartbeat_interval;
      idle.ackd = true;
      clearInterval(idle.hb);
      setTimeout(() => send(1, idle.seq), Math.random() * every);
      idle.hb = setInterval(() => {
        if (!idle.ackd) { idle.ws?.close(4000); return; }
        idle.ackd = false;
        send(1, idle.seq);
      }, every);
      if (resume && idle.sessionId) {
        send(6, { token: idle.token, session_id: idle.sessionId, seq: idle.seq });
      } else {
        send(2, { token: idle.token, properties: { os: "Windows", browser: "Chrome", device: "" }, compress: false });
      }
      break;
    }
    case 11: idle.ackd = true; break;
    case 1: send(1, idle.seq); break;
    case 7: idle.ws?.close(4000); break;
    case 9:
      if (!p.d) { idle.sessionId = null; idle.seq = null; }
      setTimeout(() => idle.ws?.close(4000), 1500);
      break;
    case 0: dispatch(p.t, p.d); break;
  }
}

function dispatch(t, d) {
  switch (t) {
    case "READY":
      idle.me = d.user;
      idle.sessionId = d.session_id;
      idle.tries = 0;
      idle.resumeUrl = d.resume_gateway_url;
      idle.groups = new Set((d.private_channels || []).filter((c) => c.type === 3).map((c) => c.id));
      idleUi("on", "Ligado", `Cuidando da conta ${d.user.global_name || d.user.username}.`);
      ilog("Modo ausente ligado.", "ok");
      if (opt("idAfk")) joinVoice();
      break;
    case "RESUMED":
      idleUi("on", "Ligado");
      if (opt("idAfk")) joinVoice();
      break;
    case "CHANNEL_CREATE":
      if (d.type === 3) {
        idle.groups.add(d.id);
        if (opt("idLeaveGroups") && d.owner_id !== idle.me?.id && !protectedId(d.id, d.owner_id)) leaveGroup(d);
      }
      break;
    case "MESSAGE_CREATE":
      onDm(d);
      break;
    case "VOICE_STATE_UPDATE":
      if (d.user_id === idle.me?.id && opt("idAfk") && d.channel_id !== val("idChannel")) {
        clearTimeout(idle.voiceTimer);
        idle.voiceTimer = setTimeout(() => {
          if (!idle.on || !opt("idAfk")) return;
          ilog("Saiu da call — voltando.", "warn");
          joinVoice();
        }, 5000);
      }
      break;
  }
}

async function leaveGroup(d) {
  await new Promise((r) => setTimeout(r, 1200));
  const name = d.name || (d.recipients || []).map((u) => u.username).join(", ") || d.id;
  try {
    const r = await api("DELETE", `/channels/${d.id}?silent=true`, null, idle.token, false);
    if (!r.ok) throw r.data?.message || `HTTP ${r.status}`;
    idle.groups.delete(d.id);
    idle.stats.groups++;
    idleStats();
    ilog(`Saiu do grupo: ${name}`, "ok");
  } catch (e) {
    ilog(`Não saiu do grupo ${name}: ${e}`, "error");
  }
}

async function onDm(m) {
  if (!idle.me || m.guild_id || m.author?.id === idle.me.id || m.author?.bot) return;
  if (idle.groups.has(m.channel_id)) return; // só PV, não grupo
  if (protectedId(m.channel_id, m.author?.id)) return;
  const who = m.author?.global_name || m.author?.username || "alguém";

  if (opt("idReply") && val("idMsg")) {
    const last = idle.lastReply[m.channel_id] || 0;
    if (Date.now() - last > 10 * 60 * 1000) {
      idle.lastReply[m.channel_id] = Date.now();
      await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1500));
      try {
        const r = await api("POST", `/channels/${m.channel_id}/messages`, { content: $("idMsg").value }, idle.token, false);
        if (!r.ok) throw r.data?.message || `HTTP ${r.status}`;
        idle.stats.replies++;
        idleStats();
        ilog(`Respondeu ${who}`, "ok");
      } catch (e) {
        ilog(`Não respondeu ${who}: ${e}`, "error");
      }
    }
  }

  if (opt("idClose")) {
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const r = await api("DELETE", `/channels/${m.channel_id}`, null, idle.token, false);
      if (!r.ok) throw r.data?.message || `HTTP ${r.status}`;
      idle.stats.closed++;
      idleStats();
      ilog(`Fechou o PV com ${who}`, "ok");
    } catch (e) {
      ilog(`Não fechou o PV com ${who}: ${e}`, "error");
    }
  }
}

function joinVoice() {
  const ch = val("idChannel");
  if (!idle.me || !ch) {
    if (opt("idAfk") && !ch) ilog("Informe o ID do canal de voz para ficar AFK.", "warn");
    return;
  }
  if (Date.now() - idle.lastVoice < 4000) return;
  idle.lastVoice = Date.now();
  send(4, { guild_id: val("idGuild") || null, channel_id: ch, self_mute: opt("idMute"), self_deaf: opt("idDeaf") });
  ilog(`Entrando na call ${ch}…`);
}
function leaveVoice() {
  if (!idle.me) return;
  send(4, { guild_id: val("idGuild") || null, channel_id: null, self_mute: false, self_deaf: false });
}

// ================= eventos do backend =================
listen("deletion-progress", (e) => showProgress(e.payload));
listen("deletion-log", (e) => log(e.payload.message, e.payload.level));
listen("deletion-finished", (e) => {
  const p = e.payload;
  showProgress(p);
  state.base.scanned += p.scanned;
  state.base.deleted += p.deleted;
  state.base.skipped += p.skipped;
  log(`✔ ${state.current?.label ?? "Processo"}: ${p.deleted} ${p.dryRun ? "encontradas" : "feitas"}, ${p.skipped} puladas.`, "ok");
  if (p.cancelled) state.queue = [];
  runNext();
});
listen("deletion-error", (e) => {
  log(`Erro: ${e.payload}`, "error");
  runNext();
});

go("home");
updateStartButton();
idleStats();
