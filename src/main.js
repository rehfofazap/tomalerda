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

// menu recolhido (só ícones): o nome aparece ao passar o mouse; a escolha fica salva
$$(".navItem").forEach((b) => (b.title = b.textContent.trim()));
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
// Entrada obrigatória: enquanto não houver token aceito pelo Discord, o cartão
// de token fica dentro da tela de entrada, que cobre o app inteiro.
function lockApp() {
  $("gateSlot").append($("tokenCard"));
  $("gate").classList.remove("out");
  document.body.classList.add("locked");
  document.querySelector(".app").inert = true;
  setTimeout(() => $("token").focus(), 50);
}
function unlockApp() {
  if (!document.body.classList.contains("locked")) return;
  document.querySelector('section[data-page="settings"]').append($("tokenCard"));
  $("gate").classList.add("out");
  document.body.classList.remove("locked");
  document.querySelector(".app").inert = false;
  go("home");
}
lockApp();
$("token").addEventListener("keydown", (e) => e.key === "Enter" && !$("checkBtn").disabled && connect(true));

$("tokenType").addEventListener("change", () => (state.tokenType = segVal("tokenType")));
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
  const av = $("avatar");
  av.textContent = "";
  // só monta a URL da foto se id e hash tiverem o formato esperado
  if (u.avatar && isId(u.id) && /^(a_)?[0-9a-f]{32}$/.test(u.avatar)) {
    const img = new Image();
    img.src = `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128`;
    img.onerror = () => (av.textContent = name[0].toUpperCase());
    av.append(img);
  } else {
    av.textContent = name[0].toUpperCase();
  }
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
  $("gateSub").textContent = p ? "Cole o token da outra conta." : "Conecte seu token do Discord pra começar.";
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
    const u = await invoke("check_token", { token: tk, isBot: isBot() });
    state.user = u;
    state.token = tk;
    state.prev = null;
    unlockApp();
    showUser(u);
    log(`Conectado como ${u.global_name || u.username}`, "ok");
    if (fromButton) {
      if ($("remember").checked) {
        await invoke("save_token", { token: tk, isBot: isBot() });
        toast("Token guardado no Cofre do Windows.");
      } else {
        await invoke("forget_token");
      }
    }
  } catch (e) {
    $("account").textContent = `Erro: ${e}`;
  } finally {
    btn.disabled = false;
  }
}

$("remember").addEventListener("change", async () => {
  if (!$("remember").checked) {
    await invoke("forget_token");
    toast("Token apagado deste PC.");
  }
});

// se tiver token guardado, conecta sozinho ao abrir
(async () => {
  try {
    const saved = await invoke("load_token");
    if (!saved) return;
    const [token, bot] = saved;
    $("token").value = token;
    state.tokenType = bot ? "bot" : "user";
    $$("#tokenType button").forEach((b) => b.classList.toggle("on", b.dataset.v === state.tokenType));
    $("remember").checked = true;
    connect(false);
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
const PATTERNS = {
  dexter: { img: svgUrl(320, 300, splat(60, 60, 1.3, 0.13) + blade(220, 70, 1.3, 0.09, -28) + syringe(90, 200, 1.4, 0.08, 32) + drop(250, 200, 1.1, 0.14) + drop(275, 235, 0.6, 0.12) + splat(250, 270, 0.6, 0.11) + blade(150, 285, 0.8, 0.07, 160) + drop(160, 130, 0.7, 0.12) + splat(20, 260, 0.5, 0.1)), size: "320px", pos: "0 0", rep: "repeat" },
  onepiece: { img: svgUrl(300, 280, skull(70, 70, 1.3, 0.08) + hat(220, 190, 1.2, 0.08, -12) + hat(235, 55, 0.6, 0.07, 18) + skull(80, 215, 0.6, 0.07) + wave(160, 120, 1, 0.08) + wave(40, 150, 0.7, 0.07) + wave(260, 260, 0.8, 0.06) + sparkle(160, 245, 0.5, 0.12) + sparkle(150, 30, 0.4, 0.1)), size: "300px", pos: "0 0", rep: "repeat" },
  kitty: { img: svgUrl(240, 240, heart(40, 30, 1.3, 0.09, -12) + heart(165, 130, 0.9, 0.07, 14) + heart(95, 190, 0.55, 0.06) + sparkle(175, 45, 0.9, 0.14) + sparkle(55, 150, 0.6, 0.12) + sparkle(215, 210, 0.4, 0.1)), size: "240px", pos: "0 0", rep: "repeat" },
  aranha: { img: web(), size: "900px", pos: "right top", rep: "no-repeat" },
  zerotwo: { img: svgUrl(280, 280, flower(60, 60, 1.6, 0.08, 10) + flower(200, 190, 1.1, 0.07, -20) + petal(190, 60, 0.9, 0.08, 40) + petal(80, 220, 0.8, 0.07, -60) + petal(250, 120, 0.6, 0.06, 120) + petal(30, 140, 0.6, 0.06, 200)), size: "280px", pos: "0 0", rep: "repeat" },
  naruto: { img: svgUrl(260, 260, spiral(70, 70, 1.6, 0.08) + spiral(195, 185, 1.1, 0.07) + spiral(205, 55, 0.6, 0.06) + spiral(55, 205, 0.5, 0.06)), size: "260px", pos: "0 0", rep: "repeat" },
  // portais, planetinhas e estrelas
  rick: { img: svgUrl(300, 300, spiral(80, 85, 1.4, 0.09) + ring(80, 85, 34, 0.06) + spiral(225, 215, 0.9, 0.07) + ring(225, 215, 22, 0.05) + dot(235, 60, 9, 0.07) + ring(235, 60, 15, 0.06) + dot(60, 240, 5, 0.08) + sparkle(160, 140, 0.6, 0.12) + sparkle(270, 140, 0.4, 0.1) + dot(30, 30, 1.6, 0.25) + dot(150, 270, 1.6, 0.2) + dot(285, 285, 1.4, 0.2)), size: "300px", pos: "0 0", rep: "repeat" },
  // nuvens fofas e estrelinhas
  aventura: { img: svgUrl(300, 260, cloud(70, 60, 1.5, 0.08) + cloud(220, 170, 1.1, 0.07) + cloud(250, 40, 0.6, 0.06) + sparkle(160, 95, 0.8, 0.14) + sparkle(40, 190, 0.6, 0.12) + sparkle(130, 230, 0.4, 0.1) + dot(280, 110, 2, 0.25) + dot(100, 140, 1.6, 0.2)), size: "300px", pos: "0 0", rep: "repeat" },
};

const THEMES = ["preto", "rosa", "azul", "roxo", "vermelho", "cinza", "menta", "dourado", "oceano", "kitty", "aranha", "zerotwo", "naruto", "onepiece", "dexter", "rick", "aventura"];
const STYLES = ["solido", "translucido", "vidro", "glass", "acrilico", "neon"];
const LOOK_DEF = { theme: "rosa", style: "vidro", motion: true, splash: true, blur: 6, dim: 45 };
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
  rick: "temas/rick.png", aventura: "temas/aventura.png",
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
  // dois cliques na barra = maximizar / voltar
  document.querySelector(".tbTitle").addEventListener("dblclick", () => win.toggleMaximize());
} catch (e) {
  console.error(e);
}

// ================= atualização =================
// confere ao abrir e a cada 6 horas; se tiver versão nova, aparece o botão no topo
async function checkUpdate() {
  try {
    const v = await invoke("check_update");
    if (!v) return;
    $("updText").textContent = `Atualizar (v${v})`;
    $("updBtn").hidden = false;
  } catch (e) {
    console.warn("atualização:", e);
  }
}
$("updBtn").addEventListener("click", async () => {
  const btn = $("updBtn");
  btn.disabled = true;
  $("updText").textContent = "Baixando…";
  const off = await window.__TAURI__.event.listen("update-progress", (e) => ($("updText").textContent = `Baixando ${e.payload}%`));
  try {
    await invoke("install_update"); // o app reabre sozinho no fim
  } catch (e) {
    off();
    btn.disabled = false;
    $("updText").textContent = "Tentar de novo";
    toast(`Não deu pra atualizar: ${e}`);
  }
});
setTimeout(checkUpdate, 4000);
setInterval(checkUpdate, 6 * 60 * 60 * 1000);

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
  const MSGS = ["acordando…", "amarrando o laço…", "polindo o vidro…", "escolhendo as cores…", "quase lá…", "pronto!"];
  let pct = 0;
  (function tick() {
    pct = Math.min(100, pct + 1.5 + Math.random() * 4.5);
    $("spBar").style.width = pct + "%";
    $("spPct").textContent = Math.floor(pct) + "%";
    $("spMsg").textContent = MSGS[Math.min(MSGS.length - 1, Math.floor(pct / 20))];
    if (pct < 100) return setTimeout(tick, 45 + Math.random() * 70);
    setTimeout(() => {
      sp.classList.add("out");
      setTimeout(() => sp.remove(), 650);
    }, 380);
  })();
})();

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
