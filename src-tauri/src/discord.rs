//! Cliente mínimo da API do Discord + lógica de exclusão.

use reqwest::{Method, StatusCode, Url};
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

const API: &str = "https://discord.com/api/v10";
const DISCORD_EPOCH_MS: i64 = 1_420_070_400_000;
const CANCELLED: &str = "__cancelled__";

// ---------------------------------------------------------------------------
// Tipos trocados com o frontend
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Mode {
    /// Percorre o histórico de um canal/DM (funciona com bot e usuário).
    Channel,
    /// Usa a busca do Discord num servidor ou DM (só token de usuário).
    Search,
    /// Todas as DMs/grupos abertos (só token de usuário).
    Dms,
    /// Abre a DM com cada amigo e limpa (só token de usuário).
    Friends,
    /// Suas mensagens num servidor + limpa a aba de menções dele.
    GuildMentions,
    /// Lê o pacote de dados do Discord (package.zip ou a pasta) e apaga por ID.
    Package,
    /// Desfaz todas as amizades.
    RemoveFriends,
    /// Fecha todos os PVs (e, se pedido, sai dos grupos).
    CloseDms,
    /// Sai de todos os servidores (menos os que você é dono).
    LeaveGuilds,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub token: String,
    pub is_bot: bool,
    pub mode: Mode,
    pub channel_id: Option<String>,
    pub guild_id: Option<String>,
    /// Vazio = as mensagens do dono do token.
    pub author_id: Option<String>,
    pub content: Option<String>,
    /// Só mensagens depois desta data (ms desde 1970).
    pub after_ms: Option<i64>,
    /// Só mensagens antes desta data (ms desde 1970).
    pub before_ms: Option<i64>,
    pub delay_ms: u64,
    pub dry_run: bool,
    /// Só mensagens com anexos (imagens, vídeos, arquivos).
    #[serde(default)]
    pub only_attachments: bool,
    /// IDs de canais ou usuários que nunca serão tocados.
    #[serde(default)]
    pub whitelist: Vec<String>,
    /// Fechar PVs: também sair dos grupos.
    #[serde(default)]
    pub leave_groups: bool,
    /// PV com todos os amigos: desfaz a amizade depois de apagar o PV.
    #[serde(default)]
    pub unfriend_after: bool,
    /// PVs abertos: fecha a conversa (só PV, grupo não) depois de apagar.
    #[serde(default)]
    pub close_after: bool,
    /// Pacote de dados: caminho do package.zip ou da pasta extraída.
    #[serde(default)]
    pub package_path: Option<String>,
    /// Pacote de dados: "all", "dms" ou "guilds".
    #[serde(default)]
    pub package_scope: Option<String>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    pub scanned: u64,
    pub deleted: u64,
    pub skipped: u64,
    pub total: Option<u64>,
    pub cancelled: bool,
    pub dry_run: bool,
    /// Várias conversas (todos os PVs / amigos): qual é a atual (1..) e quantas são.
    pub step: u64,
    pub steps: u64,
    /// feitas+puladas quando a conversa atual começou (o `total` é só dela).
    pub conv_base: u64,
    /// % do processo inteiro (calculada no emit_progress), pra barra e o tempo restante.
    pub percent: Option<f64>,
    /// Total de mensagens do processo inteiro (somando todas as conversas), se já contou.
    pub grand_total: Option<u64>,
    /// Ainda contando as mensagens antes de começar a apagar.
    pub counting: bool,
}

#[derive(Debug, Clone, Serialize)]
struct LogLine {
    level: &'static str,
    message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    #[serde(default)]
    pub global_name: Option<String>,
    #[serde(default)]
    pub avatar: Option<String>,
    #[serde(default)]
    pub bot: Option<bool>,
}

/// Prévia de um ID: pessoa, PV, grupo ou canal.
#[derive(Debug, Clone, Serialize)]
pub struct Target {
    pub kind: &'static str,
    pub name: String,
    pub sub: String,
    pub avatar: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DmChannel {
    id: String,
    #[serde(rename = "type", default)]
    kind: u8,
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    recipients: Vec<User>,
}

#[derive(Debug, Deserialize)]
struct PartialGuild {
    id: String,
    #[serde(default)]
    name: String,
    #[serde(default)]
    owner: bool,
}

#[derive(Debug, Deserialize)]
struct Relationship {
    #[serde(rename = "type")]
    kind: u8,
    user: User,
}

// ---------------------------------------------------------------------------
// Tipos da API
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
struct Author {
    id: String,
}

#[derive(Debug, Deserialize)]
struct Message {
    id: String,
    channel_id: String,
    author: Author,
    #[serde(default)]
    content: String,
    #[serde(default)]
    attachments: Vec<Value>,
    #[serde(default)]
    hit: Option<bool>,
}

#[derive(Debug, Deserialize)]
struct SearchResponse {
    #[serde(default)]
    total_results: u64,
    #[serde(default)]
    messages: Vec<Vec<Message>>,
}

enum DeleteOutcome {
    Deleted,
    Skipped(String),
}

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

/// ID do Discord: só números, 15 a 21 dígitos.
pub fn is_snowflake(s: &str) -> bool {
    (15..=21).contains(&s.len()) && s.bytes().all(|b| b.is_ascii_digit())
}

/// Lê um ID opcional do config: vazio vira None, qualquer coisa que não seja ID dá erro.
fn id_field(v: &Option<String>, what: &str) -> Result<Option<String>, String> {
    match non_empty(v) {
        None => Ok(None),
        Some(s) if is_snowflake(&s) => Ok(Some(s)),
        Some(_) => Err(format!("O ID {what} é inválido — tem que ser só números.")),
    }
}

/// Rotas liberadas para `raw`.
fn allowed_route(method: &str, path: &str) -> bool {
    let (p, query) = path.split_once('?').unwrap_or((path, ""));
    let seg: Vec<&str> = p.split('/').collect();
    let id = |i: usize| seg.get(i).is_some_and(|s| is_snowflake(s));
    match (method, seg.as_slice()) {
        ("POST" | "DELETE", ["", "hypesquad", "online"]) => query.is_empty(),
        ("POST", ["", "channels", _, "messages"]) => id(2) && query.is_empty(),
        ("DELETE", ["", "channels", _]) => id(2) && (query.is_empty() || query == "silent=true"),
        _ => false,
    }
}

fn ms_to_snowflake(ms: i64) -> u64 {
    ((ms - DISCORD_EPOCH_MS).max(0) as u64) << 22
}

fn retry_after(body: &str) -> Option<f64> {
    serde_json::from_str::<Value>(body)
        .ok()?
        .get("retry_after")?
        .as_f64()
}

fn discord_error(body: &str) -> String {
    serde_json::from_str::<Value>(body)
        .ok()
        .and_then(|v| v.get("message").and_then(|m| m.as_str()).map(String::from))
        .unwrap_or_else(|| body.chars().take(200).collect())
}

fn preview(text: &str) -> String {
    let one_line = text.replace('\n', " ");
    if one_line.is_empty() {
        return "(sem texto / anexo)".into();
    }
    let short: String = one_line.chars().take(60).collect();
    if one_line.chars().count() > 60 {
        format!("{short}…")
    } else {
        short
    }
}

fn non_empty(v: &Option<String>) -> Option<String> {
    v.as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

async fn sleep_cancellable(d: Duration, cancel: &AtomicBool) -> Result<(), String> {
    let step = Duration::from_millis(200);
    let mut left = d;
    while !left.is_zero() {
        if cancel.load(Ordering::SeqCst) {
            return Err(CANCELLED.into());
        }
        let s = left.min(step);
        tokio::time::sleep(s).await;
        left -= s;
    }
    Ok(())
}

fn emit_log(app: &AppHandle, level: &'static str, message: impl Into<String>) {
    let _ = app.emit(
        "deletion-log",
        LogLine {
            level,
            message: message.into(),
        },
    );
}

// ---------------------------------------------------------------------------
// Cliente HTTP
// ---------------------------------------------------------------------------

pub struct Client {
    http: reqwest::Client,
    auth: String,
    app: Option<AppHandle>,
}

impl Client {
    pub fn new(token: &str, is_bot: bool, app: Option<AppHandle>) -> Result<Self, String> {
        let token = token.trim().trim_matches('"');
        if token.is_empty() {
            return Err("Informe o token.".into());
        }
        if token.len() > 200 || !token.bytes().all(|b| b.is_ascii_graphic()) {
            return Err("Esse token não tem o formato certo.".into());
        }
        let auth = if is_bot {
            format!("Bot {token}")
        } else {
            token.to_string()
        };
        let http = reqwest::Client::builder()
            .user_agent("DiscordBot (https://localhost/tomalerda, 0.1.0)")
            .https_only(true)
            .timeout(Duration::from_secs(30))
            .build()
            .map_err(|e| e.to_string())?;
        Ok(Self { http, auth, app })
    }

    async fn send(&self, method: Method, url: &str, cancel: &AtomicBool) -> Result<(StatusCode, String), String> {
        self.send_body(method, url, None, cancel).await
    }

    /// Envia a requisição e trata rate limit (429) sozinho.
    async fn send_body(
        &self,
        method: Method,
        url: &str,
        body: Option<&Value>,
        cancel: &AtomicBool,
    ) -> Result<(StatusCode, String), String> {
        loop {
            if cancel.load(Ordering::SeqCst) {
                return Err(CANCELLED.into());
            }
            let mut req = self
                .http
                .request(method.clone(), url)
                .header("Authorization", &self.auth);
            if let Some(b) = body {
                req = req.json(b);
            }
            let resp = req
                .send()
                .await
                .map_err(|e| format!("Erro de rede: {e}"))?;

            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();

            if status == StatusCode::TOO_MANY_REQUESTS {
                let wait = retry_after(&body).unwrap_or(5.0);
                if let Some(app) = &self.app {
                    emit_log(app, "warn", format!("Rate limit — aguardando {wait:.1}s"));
                }
                sleep_cancellable(Duration::from_secs_f64(wait + 0.25), cancel).await?;
                continue;
            }
            if status == StatusCode::UNAUTHORIZED {
                return Err("Token inválido ou expirado (401).".into());
            }
            return Ok((status, body));
        }
    }

    async fn get_json<T: DeserializeOwned>(&self, url: &str, cancel: &AtomicBool) -> Result<T, String> {
        let (status, body) = self.send(Method::GET, url, cancel).await?;
        if !status.is_success() {
            return Err(format!("HTTP {}: {}", status.as_u16(), discord_error(&body)));
        }
        serde_json::from_str(&body).map_err(|e| format!("Resposta inesperada do Discord: {e}"))
    }

    /// Abre (ou reaproveita) a DM com um usuário e devolve o ID do canal.
    async fn open_dm(&self, user_id: &str, cancel: &AtomicBool) -> Result<String, String> {
        let body = serde_json::json!({ "recipient_id": user_id });
        let (status, text) = self
            .send_body(Method::POST, &format!("{API}/users/@me/channels"), Some(&body), cancel)
            .await?;
        if !status.is_success() {
            return Err(format!("HTTP {}: {}", status.as_u16(), discord_error(&text)));
        }
        let ch: DmChannel = serde_json::from_str(&text).map_err(|e| e.to_string())?;
        Ok(ch.id)
    }

    /// Pedido avulso à API (modo ausente e HypeSquad). Só aceita as poucas
    /// rotas que o app usa — nada de caminho livre vindo da interface.
    pub async fn raw(&self, method: &str, path: &str, body: Option<Value>) -> Result<(u16, String), String> {
        let method_up = method.to_uppercase();
        if !allowed_route(&method_up, path) {
            return Err("Ação não permitida.".into());
        }
        let method = Method::from_bytes(method_up.as_bytes()).map_err(|e| e.to_string())?;
        let never = AtomicBool::new(false);
        let (status, text) = self.send_body(method, &format!("{API}{path}"), body.as_ref(), &never).await?;
        Ok((status.as_u16(), text))
    }

    pub async fn me(&self) -> Result<User, String> {
        let never = AtomicBool::new(false);
        self.get_json(&format!("{API}/users/@me"), &never).await
    }

    /// Mostra de quem é um ID (pessoa, PV, grupo ou canal) antes de apagar.
    pub async fn lookup(&self, id: &str) -> Result<Target, String> {
        if !is_snowflake(id) {
            return Err("ID inválido.".into());
        }
        let never = AtomicBool::new(false);
        let avatar = |u: &User| {
            u.avatar.as_ref().map(|a| format!("https://cdn.discordapp.com/avatars/{}/{a}.png?size=128", u.id))
        };
        let (status, body) = self.send(Method::GET, &format!("{API}/channels/{id}"), &never).await?;
        if status.is_success() {
            let v: Value = serde_json::from_str(&body).map_err(|e| e.to_string())?;
            let kind = v.get("type").and_then(|t| t.as_u64()).unwrap_or(0);
            let users: Vec<User> = v
                .get("recipients")
                .and_then(|r| serde_json::from_value(r.clone()).ok())
                .unwrap_or_default();
            let name = v.get("name").and_then(|n| n.as_str()).filter(|n| !n.is_empty()).map(str::to_string);
            return Ok(match kind {
                1 => {
                    let u = users.first().ok_or("PV sem ninguém?")?;
                    Target {
                        kind: "dm",
                        name: u.global_name.clone().unwrap_or_else(|| u.username.clone()),
                        sub: format!("PV com {}", u.username),
                        avatar: avatar(u),
                    }
                }
                3 => Target {
                    kind: "group",
                    name: name.unwrap_or_else(|| users.iter().map(|u| u.username.as_str()).collect::<Vec<_>>().join(", ")),
                    sub: format!("Grupo com {} pessoas", users.len() + 1),
                    avatar: v
                        .get("icon")
                        .and_then(|i| i.as_str())
                        .map(|i| format!("https://cdn.discordapp.com/channel-icons/{id}/{i}.png?size=128")),
                },
                _ => Target {
                    kind: "channel",
                    name: format!("#{}", name.unwrap_or_else(|| id.to_string())),
                    sub: "Canal de servidor".into(),
                    avatar: None,
                },
            });
        }
        let ch_status = status.as_u16();
        let person = |u: &User| Target {
            kind: "user",
            name: u.global_name.clone().unwrap_or_else(|| u.username.clone()),
            sub: u.username.clone(),
            avatar: avatar(u),
        };
        // 1) perfil direto (com conta de usuário o Discord às vezes recusa)
        let (status, body) = self.send(Method::GET, &format!("{API}/users/{id}"), &never).await?;
        if status.is_success() {
            if let Ok(u) = serde_json::from_str::<User>(&body) {
                return Ok(person(&u));
            }
        }
        let u_status = status.as_u16();
        // 2) perfil do jeito que o app do Discord pede
        let (status, body) = self.send(Method::GET, &format!("{API}/users/{id}/profile"), &never).await?;
        if status.is_success() {
            if let Some(u) = serde_json::from_str::<Value>(&body)
                .ok()
                .and_then(|v| v.get("user").cloned())
                .and_then(|u| serde_json::from_value::<User>(u).ok())
            {
                return Ok(person(&u));
            }
        }
        let p_status = status.as_u16();
        // 3) está na sua lista de amigos (ou pedidos/bloqueados)?
        if let Ok(rels) = self.get_json::<Vec<Relationship>>(&format!("{API}/users/@me/relationships"), &never).await {
            if let Some(r) = rels.iter().find(|r| r.user.id == id) {
                return Ok(person(&r.user));
            }
        }
        // 4) tem PV aberto com ela?
        if let Ok(dms) = self.get_json::<Vec<DmChannel>>(&format!("{API}/users/@me/channels"), &never).await {
            if let Some(u) = dms.iter().flat_map(|d| d.recipients.iter()).find(|u| u.id == id) {
                return Ok(person(u));
            }
        }
        Err(format!(
            "Não achei ninguém nem conversa com esse ID (canal {ch_status}, pessoa {u_status}/{p_status}). Dá pra apagar mesmo assim."
        ))
    }

    async fn delete(&self, channel_id: &str, id: &str, cancel: &AtomicBool) -> Result<DeleteOutcome, String> {
        let url = format!("{API}/channels/{channel_id}/messages/{id}");
        let (status, body) = self.send(Method::DELETE, &url, cancel).await?;
        match status.as_u16() {
            200 | 204 => Ok(DeleteOutcome::Deleted),
            404 => Ok(DeleteOutcome::Skipped("já não existe".into())),
            400 | 403 => Ok(DeleteOutcome::Skipped(discord_error(&body))),
            code => Err(format!("HTTP {code} ao apagar: {}", discord_error(&body))),
        }
    }
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

struct Job {
    app: AppHandle,
    client: Client,
    cfg: Config,
    cancel: Arc<AtomicBool>,
    author_id: String,
    progress: Progress,
    /// Contagem feita antes (canal → nº de mensagens suas), pra não buscar de novo.
    pre: HashMap<String, u64>,
}

pub async fn run(app: AppHandle, mut cfg: Config, cancel: Arc<AtomicBool>) -> Result<Progress, String> {
    // valida tudo que vira parte de um endereço antes de tocar na rede
    cfg.channel_id = id_field(&cfg.channel_id, "do canal")?;
    cfg.guild_id = id_field(&cfg.guild_id, "do servidor")?;
    cfg.author_id = id_field(&cfg.author_id, "do autor")?;
    cfg.whitelist.retain(|w| is_snowflake(w.trim()));
    cfg.delay_ms = cfg.delay_ms.clamp(300, 10_000);
    let client = Client::new(&cfg.token, cfg.is_bot, Some(app.clone()))?;
    let me = client.me().await?;
    emit_log(&app, "info", format!("Conectado como {} ({})", me.username, me.id));

    let author_id = non_empty(&cfg.author_id).unwrap_or_else(|| me.id.clone());
    // não existe mais modo simulação: tudo é feito de verdade
    cfg.dry_run = false;

    let mut job = Job {
        progress: Progress {
            dry_run: cfg.dry_run,
            ..Default::default()
        },
        app,
        client,
        cfg,
        cancel,
        author_id,
        pre: HashMap::new(),
    };

    let result = match job.cfg.mode {
        Mode::Channel => job.run_channel().await,
        Mode::Search => job.run_search().await,
        Mode::Dms => job.run_dms().await,
        Mode::Friends => job.run_friends().await,
        Mode::GuildMentions => job.run_guild_mentions().await,
        Mode::Package => job.run_package().await,
        Mode::RemoveFriends => job.run_remove_friends().await,
        Mode::CloseDms => job.run_close_dms().await,
        Mode::LeaveGuilds => job.run_leave_guilds().await,
    };

    match result {
        Ok(()) => Ok(job.progress),
        Err(e) if e == CANCELLED => {
            job.progress.cancelled = true;
            emit_log(&job.app, "warn", "Interrompido pelo usuário.");
            Ok(job.progress)
        }
        Err(e) => Err(e),
    }
}

impl Job {
    fn emit_progress(&self) {
        let mut p = self.progress.clone();
        let done = p.deleted + p.skipped;
        // quanto da conversa/lista atual já foi (0..1), se o total é conhecido
        let frac = p.total.filter(|t| *t > 0).map(|t| (done.saturating_sub(p.conv_base) as f64 / t as f64).min(1.0));
        p.percent = if p.counting {
            Some(0.0)
        } else if let Some(g) = p.grand_total.filter(|g| *g > 0) {
            Some((done as f64 / g as f64 * 100.0).min(100.0))
        } else if p.steps > 0 {
            Some(((p.step.saturating_sub(1)) as f64 + frac.unwrap_or(0.0)) / p.steps as f64 * 100.0)
        } else {
            frac.map(|f| f * 100.0)
        };
        let _ = self.app.emit("deletion-progress", &p);
    }

    /// Quantas mensagens suas (com a palavra, nas datas escolhidas) tem nessa conversa,
    /// pela busca do Discord. None = não deu pra contar (bot, erro...).
    async fn count_mine(&self, channel_id: &str) -> Option<u64> {
        if self.cfg.is_bot {
            return None;
        }
        let guild = self.channel_guild(channel_id).await;
        self.count_in(channel_id, guild).await
    }

    async fn count_in(&self, channel_id: &str, guild: Option<String>) -> Option<u64> {
        let base = match &guild {
            Some(g) => format!("{API}/guilds/{g}/messages/search"),
            None => format!("{API}/channels/{channel_id}/messages/search"),
        };
        let mut url = Url::parse(&base).ok()?;
        {
            let mut q = url.query_pairs_mut();
            q.append_pair("author_id", &self.author_id);
            if guild.is_some() {
                q.append_pair("channel_id", channel_id);
                q.append_pair("include_nsfw", "true");
            }
            if let Some(c) = non_empty(&self.cfg.content) {
                q.append_pair("content", &c);
            }
            if let Some(m) = self.cfg.after_ms.map(ms_to_snowflake) {
                q.append_pair("min_id", &m.to_string());
            }
            if let Some(m) = self.cfg.before_ms.map(ms_to_snowflake) {
                q.append_pair("max_id", &m.to_string());
            }
        }
        self.search(url.as_str()).await.ok().map(|r| r.total_results)
    }

    /// Várias conversas (PVs): conta antes as mensagens de todas, pra ter o total
    /// certo, a % e o tempo restante desde o começo. Devolve só as que têm algo
    /// pra apagar (ou que não deu pra contar).
    async fn precount(&mut self, chans: Vec<(String, String)>) -> Result<Vec<(String, String)>, String> {
        if self.cfg.is_bot || chans.is_empty() {
            return Ok(chans);
        }
        emit_log(&self.app, "info", format!("Contando suas mensagens em {} conversas…", chans.len()));
        self.progress.counting = true;
        self.progress.steps = chans.len() as u64;
        let mut sum = 0u64;
        let mut keep = Vec::new();
        for (i, (id, label)) in chans.into_iter().enumerate() {
            if self.cancel.load(Ordering::Relaxed) {
                return Err(CANCELLED.into());
            }
            self.progress.step = i as u64 + 1;
            self.progress.grand_total = Some(sum);
            self.emit_progress();
            match self.count_in(&id, None).await {
                Some(0) => {}
                Some(n) => {
                    sum += n;
                    self.pre.insert(id.clone(), n);
                    keep.push((id, label));
                }
                None => keep.push((id, label)),
            }
        }
        self.progress.counting = false;
        self.progress.grand_total = Some(sum);
        self.progress.step = 0;
        self.progress.steps = keep.len() as u64;
        emit_log(
            &self.app,
            "ok",
            format!("{sum} mensagens suas pra apagar em {} conversa{}.", keep.len(), if keep.len() == 1 { "" } else { "s" }),
        );
        self.emit_progress();
        Ok(keep)
    }

    /// Começo de uma conversa: zera a parte "dessa conversa" do progresso.
    fn start_conv(&mut self, total: Option<u64>) {
        self.progress.conv_base = self.progress.deleted + self.progress.skipped;
        self.progress.total = total;
        self.emit_progress();
    }

    fn whitelisted(&self, id: &str) -> bool {
        self.cfg.whitelist.iter().any(|w| w.trim() == id)
    }

    fn matches(&self, m: &Message, check_content: bool) -> bool {
        if m.author.id != self.author_id {
            return false;
        }
        if self.whitelisted(&m.channel_id) {
            return false;
        }
        if self.cfg.only_attachments && m.attachments.is_empty() {
            return false;
        }
        if check_content {
            if let Some(filter) = non_empty(&self.cfg.content) {
                if !m.content.to_lowercase().contains(&filter.to_lowercase()) {
                    return false;
                }
            }
        }
        true
    }

    async fn handle(&mut self, m: &Message) -> Result<(), String> {
        if self.cfg.dry_run {
            self.progress.deleted += 1;
            emit_log(&self.app, "info", format!("[simulação] {}", preview(&m.content)));
            self.emit_progress();
            return Ok(());
        }

        match self.client.delete(&m.channel_id, &m.id, &self.cancel).await? {
            DeleteOutcome::Deleted => {
                self.progress.deleted += 1;
                emit_log(&self.app, "ok", format!("Apagada: {}", preview(&m.content)));
            }
            DeleteOutcome::Skipped(reason) => {
                self.progress.skipped += 1;
                emit_log(&self.app, "warn", format!("Pulada ({reason}): {}", preview(&m.content)));
            }
        }
        self.emit_progress();
        sleep_cancellable(Duration::from_millis(self.cfg.delay_ms), &self.cancel).await
    }

    async fn run_channel(&mut self) -> Result<(), String> {
        let channel_id = non_empty(&self.cfg.channel_id).ok_or("Informe o ID do canal.")?;
        if self.whitelisted(&channel_id) {
            emit_log(&self.app, "warn", "Esse canal está na whitelist — nada a fazer.");
            return Ok(());
        }
        let channel_id = self.resolve_channel(channel_id).await?;
        if self.whitelisted(&channel_id) {
            emit_log(&self.app, "warn", "Essa conversa está na whitelist — nada a fazer.");
            return Ok(());
        }
        if self.wants_keyword_search() {
            return self.keyword_search_in(&channel_id).await;
        }
        self.clean_channel(&channel_id).await
    }

    /// Com palavra-chave (e token de usuário) dá pra usar a busca do Discord, que já
    /// devolve só as mensagens com a palavra. Ler o histórico inteiro de 100 em 100
    /// numa conversa grande demora tanto que parece que não está funcionando.
    fn wants_keyword_search(&self) -> bool {
        !self.cfg.is_bot && non_empty(&self.cfg.content).is_some()
    }

    /// Busca a palavra só nessa conversa: PV/grupo pela busca do canal, canal de
    /// servidor pela busca do servidor filtrando o canal.
    async fn keyword_search_in(&mut self, channel_id: &str) -> Result<(), String> {
        let guild = self.channel_guild(channel_id).await;
        self.cfg.channel_id = Some(channel_id.to_string());
        self.cfg.guild_id = guild;
        self.start_conv(None); // a busca preenche o total dessa conversa
        self.run_search().await
    }

    /// ID do servidor do canal (None = PV ou grupo).
    async fn channel_guild(&self, channel_id: &str) -> Option<String> {
        let (status, body) = self.client.send(Method::GET, &format!("{API}/channels/{channel_id}"), &self.cancel).await.ok()?;
        if !status.is_success() {
            return None;
        }
        let v: Value = serde_json::from_str(&body).ok()?;
        v.get("guild_id").and_then(|g| g.as_str()).map(|g| g.to_string())
    }

    /// Aceita ID de canal ou de pessoa: se o canal não existe e o ID é de um
    /// usuário, abre (ou reaproveita) o PV com ele e devolve o ID do PV.
    async fn resolve_channel(&self, id: String) -> Result<String, String> {
        let (status, _) = self.client.send(Method::GET, &format!("{API}/channels/{id}"), &self.cancel).await?;
        if status.is_success() {
            return Ok(id);
        }
        if status == StatusCode::NOT_FOUND && !self.cfg.is_bot {
            if let Ok(dm) = self.client.open_dm(&id, &self.cancel).await {
                emit_log(&self.app, "info", format!("Esse ID é de uma pessoa — abri o PV com ela ({dm})."));
                return Ok(dm);
            }
        }
        match status.as_u16() {
            404 => Err("Não achei nenhuma conversa nem pessoa com esse ID. Confira se copiou certo.".into()),
            403 => Err("Sem acesso a esse canal.".into()),
            c => Err(format!("HTTP {c} ao abrir o canal.")),
        }
    }

    fn require_user_token(&self) -> Result<(), String> {
        if self.cfg.is_bot {
            Err("Essa opção só funciona com token de usuário.".into())
        } else {
            Ok(())
        }
    }

    /// Limpa todas as DMs e grupos abertos.
    async fn run_dms(&mut self) -> Result<(), String> {
        self.require_user_token()?;
        let dms: Vec<DmChannel> = self
            .client
            .get_json(&format!("{API}/users/@me/channels"), &self.cancel)
            .await?;
        emit_log(&self.app, "info", format!("{} DMs/grupos abertos.", dms.len()));
        let mut chans = Vec::new();
        let mut single: HashSet<String> = HashSet::new(); // PVs 1:1 (grupo não fecha)
        for dm in dms {
            let protected = self.whitelisted(&dm.id) || dm.recipients.iter().any(|u| self.whitelisted(&u.id));
            let label = dm.name.clone().unwrap_or_else(|| {
                dm.recipients.iter().map(|u| u.username.as_str()).collect::<Vec<_>>().join(", ")
            });
            if protected {
                emit_log(&self.app, "warn", format!("Whitelist, pulando: {label}"));
                continue;
            }
            if dm.kind == 1 {
                single.insert(dm.id.clone());
            }
            chans.push((dm.id, label));
        }
        // "fechar depois": fecha também os PVs em que não tinha nada pra apagar
        let all: Vec<(String, String)> = chans.clone();
        let chans = self.precount(chans).await?;
        self.progress.steps = chans.len() as u64;
        for (i, (id, label)) in chans.into_iter().enumerate() {
            self.progress.step = i as u64 + 1;
            emit_log(&self.app, "info", format!("→ DM com {label}"));
            if self.wants_keyword_search() {
                self.keyword_search_in(&id).await?;
            } else {
                self.clean_channel(&id).await?;
            }
        }
        if self.cfg.close_after {
            for (id, label) in all.iter().filter(|(id, _)| single.contains(id)) {
                self.side_action(Method::DELETE, &format!("{API}/channels/{id}"), &format!("PV fechado: {label}")).await?;
            }
        }
        Ok(())
    }

    /// Ação extra que não conta como mensagem apagada (fechar PV, desfazer amizade).
    async fn side_action(&self, method: Method, url: &str, done: &str) -> Result<(), String> {
        if self.cancel.load(Ordering::Relaxed) {
            return Err(CANCELLED.into());
        }
        let (status, body) = self.client.send(method, url, &self.cancel).await?;
        if status.is_success() {
            emit_log(&self.app, "ok", done);
        } else {
            emit_log(&self.app, "warn", format!("{done} — não deu ({})", discord_error(&body)));
        }
        sleep_cancellable(Duration::from_millis(self.cfg.delay_ms.max(300)), &self.cancel).await
    }

    /// Abre a DM com cada amigo e limpa.
    async fn run_friends(&mut self) -> Result<(), String> {
        self.require_user_token()?;
        let rels: Vec<Relationship> = self
            .client
            .get_json(&format!("{API}/users/@me/relationships"), &self.cancel)
            .await?;
        let friends: Vec<User> = rels.into_iter().filter(|r| r.kind == 1).map(|r| r.user).collect();
        emit_log(&self.app, "info", format!("{} amigos encontrados.", friends.len()));
        // abre (ou reaproveita) o PV com cada amigo
        let mut chans = Vec::new();
        let mut friend_of: HashMap<String, String> = HashMap::new(); // PV → id do amigo
        for f in friends {
            if self.whitelisted(&f.id) {
                emit_log(&self.app, "warn", format!("Whitelist, pulando: {}", f.username));
                continue;
            }
            let channel_id = self.client.open_dm(&f.id, &self.cancel).await?;
            if self.whitelisted(&channel_id) {
                continue;
            }
            friend_of.insert(channel_id.clone(), f.id.clone());
            chans.push((channel_id, f.username));
            sleep_cancellable(Duration::from_millis(250), &self.cancel).await?;
        }
        let all: Vec<(String, String)> = chans.clone();
        let chans = self.precount(chans).await?;
        self.progress.steps = chans.len() as u64;
        for (i, (id, label)) in chans.into_iter().enumerate() {
            self.progress.step = i as u64 + 1;
            emit_log(&self.app, "info", format!("→ DM com {label}"));
            if self.wants_keyword_search() {
                self.keyword_search_in(&id).await?;
            } else {
                self.clean_channel(&id).await?;
            }
        }
        // "remover amizade": depois de apagar todos os PVs, desfaz cada amizade
        if self.cfg.unfriend_after {
            for (id, label) in &all {
                if let Some(uid) = friend_of.get(id) {
                    self.side_action(
                        Method::DELETE,
                        &format!("{API}/users/@me/relationships/{uid}"),
                        &format!("Amizade desfeita: {label}"),
                    )
                    .await?;
                }
            }
        }
        Ok(())
    }

    /// Percorre o histórico do canal, 100 mensagens por vez, do mais novo pro mais antigo.
    async fn clean_channel(&mut self, channel_id: &str) -> Result<(), String> {
        // conta antes pra ter % e tempo restante
        let pre = self.pre.get(channel_id).copied();
        let count = if pre.is_some() { pre } else { self.count_mine(channel_id).await };
        self.start_conv(count);
        if self.progress.steps == 0 {
            self.progress.grand_total = count; // uma conversa só: o total dela é o total
        }
        if let Some(n) = count {
            emit_log(&self.app, "info", format!("{n} mensage{} sua{} aqui.", if n == 1 { "m" } else { "ns" }, if n == 1 { "" } else { "s" }));
            // várias conversas: se não tem nada seu nessa, nem lê o histórico
            if n == 0 && self.progress.steps > 0 {
                return Ok(());
            }
        }
        let after = self.cfg.after_ms.map(ms_to_snowflake);
        let mut before = self.cfg.before_ms.map(ms_to_snowflake);

        loop {
            let mut url = format!("{API}/channels/{channel_id}/messages?limit=100");
            if let Some(b) = before {
                url.push_str(&format!("&before={b}"));
            }
            let page: Vec<Message> = self.client.get_json(&url, &self.cancel).await?;
            if page.is_empty() {
                break;
            }
            let full_page = page.len() == 100;
            before = page.last().and_then(|m| m.id.parse().ok());

            for m in &page {
                if let Some(a) = after {
                    if m.id.parse::<u64>().unwrap_or(0) <= a {
                        return Ok(()); // chegamos antes da data mínima
                    }
                }
                self.progress.scanned += 1;
                if self.matches(m, true) {
                    self.handle(m).await?;
                }
            }
            self.emit_progress();
            if !full_page {
                break;
            }
        }
        Ok(())
    }

    /// Usa a busca do Discord (servidor inteiro ou DM). Pagina por max_id,
    /// assim as mensagens já apagadas não bagunçam o offset.
    async fn run_search(&mut self) -> Result<(), String> {
        if self.cfg.is_bot {
            return Err("A busca só funciona com token de usuário. Use o modo \"Canal\".".into());
        }
        let guild = non_empty(&self.cfg.guild_id);
        let channel = non_empty(&self.cfg.channel_id);

        let base = match (&guild, &channel) {
            (Some(g), _) => format!("{API}/guilds/{g}/messages/search"),
            (None, Some(c)) => format!("{API}/channels/{c}/messages/search"),
            (None, None) => return Err("Informe o ID do servidor ou da DM.".into()),
        };

        let min_id = self.cfg.after_ms.map(ms_to_snowflake);
        let mut max_id = self.cfg.before_ms.map(ms_to_snowflake);
        let mut seen: HashSet<String> = HashSet::new();

        loop {
            let mut url = Url::parse(&base).map_err(|e| e.to_string())?;
            {
                let mut q = url.query_pairs_mut();
                q.append_pair("author_id", &self.author_id);
                if guild.is_some() {
                    q.append_pair("include_nsfw", "true");
                    if let Some(c) = &channel {
                        q.append_pair("channel_id", c);
                    }
                }
                if let Some(c) = non_empty(&self.cfg.content) {
                    q.append_pair("content", &c);
                }
                if let Some(m) = min_id {
                    q.append_pair("min_id", &m.to_string());
                }
                if let Some(m) = max_id {
                    q.append_pair("max_id", &m.to_string());
                }
            }

            let res = self.search(url.as_str()).await?;
            if self.progress.total.is_none() {
                self.progress.total = Some(res.total_results);
                if self.progress.steps == 0 {
                    self.progress.grand_total = Some(res.total_results);
                }
                emit_log(&self.app, "info", format!("A busca encontrou ~{} mensagens.", res.total_results));
            }

            // Cada grupo pode trazer mensagens de contexto; pegamos a marcada como "hit".
            let hits: Vec<Message> = res
                .messages
                .into_iter()
                .filter_map(|group| {
                    let idx = group.iter().position(|m| m.hit == Some(true)).unwrap_or(0);
                    group.into_iter().nth(idx)
                })
                .collect();

            let oldest = hits.iter().filter_map(|m| m.id.parse::<u64>().ok()).min();
            let mut any_new = false;

            for m in &hits {
                if !seen.insert(m.id.clone()) {
                    continue;
                }
                any_new = true;
                self.progress.scanned += 1;
                if self.matches(m, false) {
                    self.handle(m).await?;
                }
            }
            self.emit_progress();

            match oldest {
                Some(o) if any_new => max_id = Some(o),
                _ => break,
            }
            // pequena pausa entre buscas para não tomar rate limit
            sleep_cancellable(Duration::from_millis(1000), &self.cancel).await?;
        }
        Ok(())
    }

    async fn search(&self, url: &str) -> Result<SearchResponse, String> {
        loop {
            let (status, body) = self.client.send(Method::GET, url, &self.cancel).await?;
            if status == StatusCode::ACCEPTED {
                let wait = retry_after(&body).unwrap_or(2.0);
                emit_log(&self.app, "info", "O Discord ainda está indexando, aguardando…");
                sleep_cancellable(Duration::from_secs_f64(wait.max(1.0)), &self.cancel).await?;
                continue;
            }
            if !status.is_success() {
                return Err(format!("HTTP {} na busca: {}", status.as_u16(), discord_error(&body)));
            }
            return serde_json::from_str(&body).map_err(|e| format!("Resposta inesperada da busca: {e}"));
        }
    }

    /// Faz uma ação simples (desfazer amizade, fechar PV, sair de servidor...)
    /// respeitando simulação, contadores e o delay.
    async fn act(&mut self, method: Method, url: String, body: Option<Value>, label: String) -> Result<(), String> {
        self.progress.scanned += 1;
        if self.cfg.dry_run {
            self.progress.deleted += 1;
            emit_log(&self.app, "info", format!("[simulação] {label}"));
            self.emit_progress();
            return Ok(());
        }
        let (status, text) = self.client.send_body(method, &url, body.as_ref(), &self.cancel).await?;
        if status.is_success() {
            self.progress.deleted += 1;
            emit_log(&self.app, "ok", label);
        } else {
            self.progress.skipped += 1;
            emit_log(&self.app, "warn", format!("Pulado ({}): {label}", discord_error(&text)));
        }
        self.emit_progress();
        sleep_cancellable(Duration::from_millis(self.cfg.delay_ms), &self.cancel).await
    }

    /// Suas mensagens no servidor (pela busca) + esvazia a aba de menções dele.
    async fn run_guild_mentions(&mut self) -> Result<(), String> {
        self.require_user_token()?;
        let guild = non_empty(&self.cfg.guild_id).ok_or("Informe o ID do servidor.")?;
        emit_log(&self.app, "info", "Parte 1/2 — suas mensagens no servidor");
        self.run_search().await?;
        emit_log(&self.app, "info", "Parte 2/2 — aba de menções desse servidor");
        loop {
            let url = format!("{API}/users/@me/mentions?limit=100&roles=true&everyone=true&guild_id={guild}");
            let page: Vec<Message> = self.client.get_json(&url, &self.cancel).await?;
            if page.is_empty() {
                break;
            }
            let before = self.progress.deleted;
            for m in &page {
                self.act(
                    Method::DELETE,
                    format!("{API}/users/@me/mentions/{}", m.id),
                    None,
                    format!("Menção removida: {}", preview(&m.content)),
                )
                .await?;
            }
            // simulação ou nada removido: não adianta pedir a mesma página de novo
            if self.cfg.dry_run || self.progress.deleted == before {
                break;
            }
        }
        Ok(())
    }

    async fn run_remove_friends(&mut self) -> Result<(), String> {
        self.require_user_token()?;
        let rels: Vec<Relationship> = self
            .client
            .get_json(&format!("{API}/users/@me/relationships"), &self.cancel)
            .await?;
        let friends: Vec<User> = rels.into_iter().filter(|r| r.kind == 1).map(|r| r.user).collect();
        self.progress.total = Some(friends.len() as u64);
        emit_log(&self.app, "info", format!("{} amigos encontrados.", friends.len()));
        for f in friends {
            if self.whitelisted(&f.id) {
                self.progress.skipped += 1;
                emit_log(&self.app, "warn", format!("Whitelist, mantendo: {}", f.username));
                continue;
            }
            self.act(
                Method::DELETE,
                format!("{API}/users/@me/relationships/{}", f.id),
                None,
                format!("Amizade desfeita: {}", f.username),
            )
            .await?;
        }
        Ok(())
    }

    async fn run_close_dms(&mut self) -> Result<(), String> {
        self.require_user_token()?;
        let dms: Vec<DmChannel> = self
            .client
            .get_json(&format!("{API}/users/@me/channels"), &self.cancel)
            .await?;
        emit_log(&self.app, "info", format!("{} PVs/grupos abertos.", dms.len()));
        for dm in dms {
            let label = dm.name.clone().filter(|n| !n.is_empty()).unwrap_or_else(|| {
                dm.recipients.iter().map(|u| u.username.as_str()).collect::<Vec<_>>().join(", ")
            });
            if self.whitelisted(&dm.id) || dm.recipients.iter().any(|u| self.whitelisted(&u.id)) {
                self.progress.skipped += 1;
                emit_log(&self.app, "warn", format!("Whitelist, mantendo: {label}"));
                continue;
            }
            match dm.kind {
                3 if self.cfg.leave_groups => {
                    self.act(
                        Method::DELETE,
                        format!("{API}/channels/{}?silent=true", dm.id),
                        None,
                        format!("Saiu do grupo: {label}"),
                    )
                    .await?
                }
                3 => {}
                _ => {
                    self.act(
                        Method::DELETE,
                        format!("{API}/channels/{}", dm.id),
                        None,
                        format!("PV fechado: {label}"),
                    )
                    .await?
                }
            }
        }
        Ok(())
    }

    async fn run_leave_guilds(&mut self) -> Result<(), String> {
        let guilds: Vec<PartialGuild> = self
            .client
            .get_json(&format!("{API}/users/@me/guilds"), &self.cancel)
            .await?;
        self.progress.total = Some(guilds.len() as u64);
        emit_log(&self.app, "info", format!("Você está em {} servidores.", guilds.len()));
        for g in guilds {
            if self.whitelisted(&g.id) {
                self.progress.skipped += 1;
                emit_log(&self.app, "warn", format!("Whitelist, ficando em: {}", g.name));
                continue;
            }
            if g.owner {
                self.progress.skipped += 1;
                emit_log(&self.app, "warn", format!("Você é dono de {} — não dá pra sair, pulando.", g.name));
                continue;
            }
            self.act(
                Method::DELETE,
                format!("{API}/users/@me/guilds/{}", g.id),
                Some(serde_json::json!({ "lurking": false })),
                format!("Saiu de: {}", g.name),
            )
            .await?;
        }
        Ok(())
    }

    /// Lê o pacote de dados do Discord e apaga cada mensagem pelo ID.
    async fn run_package(&mut self) -> Result<(), String> {
        let path = non_empty(&self.cfg.package_path).ok_or("Escolha o package.zip ou a pasta do pacote.")?;
        let scope = non_empty(&self.cfg.package_scope).unwrap_or_else(|| "all".into());
        emit_log(&self.app, "info", "Lendo o pacote de dados…");
        let chans = tauri::async_runtime::spawn_blocking(move || read_package(&path))
            .await
            .map_err(|e| e.to_string())??;

        let after = self.cfg.after_ms.map(ms_to_snowflake);
        let before = self.cfg.before_ms.map(ms_to_snowflake);
        let mut list: Vec<(String, PkgChannel)> = chans
            .into_iter()
            .filter(|(_, c)| {
                let dm = c.kind == 1 || c.kind == 3;
                match scope.as_str() {
                    "dms" => dm,
                    "guilds" => !dm,
                    _ => true,
                }
            })
            .collect();
        list.sort_by(|a, b| b.1.msgs.len().cmp(&a.1.msgs.len()));
        let total: usize = list.iter().map(|(_, c)| c.msgs.len()).sum();
        if total == 0 {
            return Err("Não achei mensagens no pacote. Confira se marcou “Mensagens” ao pedir os dados.".into());
        }
        self.progress.total = Some(total as u64);
        emit_log(&self.app, "info", format!("{} conversas, {} mensagens no pacote.", list.len(), total));

        for (cid, ch) in list {
            if self.whitelisted(&cid) || ch.recipients.iter().any(|r| self.whitelisted(r)) {
                self.progress.skipped += ch.msgs.len() as u64;
                emit_log(&self.app, "warn", format!("Whitelist, pulando: {}", ch.label));
                self.emit_progress();
                continue;
            }
            emit_log(&self.app, "info", format!("→ {} ({} mensagens)", ch.label, ch.msgs.len()));
            for m in ch.msgs {
                let sid: u64 = m.id.parse().unwrap_or(0);
                if after.is_some_and(|a| sid <= a) || before.is_some_and(|b| sid >= b) {
                    continue;
                }
                self.progress.scanned += 1;
                let msg = Message {
                    id: m.id,
                    channel_id: cid.clone(),
                    author: Author { id: self.author_id.clone() },
                    content: m.content,
                    attachments: if m.has_attachments { vec![Value::Null] } else { Vec::new() },
                    hit: None,
                };
                if self.matches(&msg, true) {
                    self.handle(&msg).await?;
                }
            }
            self.emit_progress();
        }
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Pacote de dados (package.zip)
// ---------------------------------------------------------------------------

#[derive(Default)]
struct PkgChannel {
    kind: u8,
    label: String,
    recipients: Vec<String>,
    msgs: Vec<PkgMsg>,
}

struct PkgMsg {
    id: String,
    content: String,
    has_attachments: bool,
}

/// messages/c<ID>/{channel.json,messages.json,messages.csv} ou messages/index.json
fn pkg_classify(path: &str) -> Option<(String, String)> {
    let p = path.replace('\\', "/");
    let parts: Vec<&str> = p.split('/').filter(|s| !s.is_empty()).collect();
    let n = parts.len();
    if n < 2 {
        return None;
    }
    let file = parts[n - 1].to_lowercase();
    if file == "index.json" && parts[n - 2].eq_ignore_ascii_case("messages") {
        return Some((String::new(), file));
    }
    if n < 3 || !parts[n - 3].eq_ignore_ascii_case("messages") {
        return None;
    }
    if !matches!(file.as_str(), "channel.json" | "messages.json" | "messages.csv") {
        return None;
    }
    let dir = parts[n - 2];
    let id = dir.strip_prefix('c').or_else(|| dir.strip_prefix('C'))?;
    if id.is_empty() || !id.bytes().all(|b| b.is_ascii_digit()) {
        return None;
    }
    Some((id.to_string(), file))
}

fn field<'a>(m: &'a Value, k: &str) -> Option<&'a Value> {
    m.get(k).or_else(|| m.get(k.to_lowercase().as_str()))
}

fn parse_csv(text: &str) -> Vec<Vec<String>> {
    let mut rows = Vec::new();
    let mut row = Vec::new();
    let mut cell = String::new();
    let mut quoted = false;
    let mut chars = text.chars().peekable();
    while let Some(c) = chars.next() {
        if quoted {
            if c == '"' {
                if chars.peek() == Some(&'"') {
                    cell.push('"');
                    chars.next();
                } else {
                    quoted = false;
                }
            } else {
                cell.push(c);
            }
            continue;
        }
        match c {
            '"' => quoted = true,
            ',' => row.push(std::mem::take(&mut cell)),
            '\n' => {
                row.push(std::mem::take(&mut cell));
                rows.push(std::mem::take(&mut row));
            }
            '\r' => {}
            _ => cell.push(c),
        }
    }
    if !cell.is_empty() || !row.is_empty() {
        row.push(cell);
        rows.push(row);
    }
    rows
}

fn read_package(path: &str) -> Result<HashMap<String, PkgChannel>, String> {
    let p = std::path::Path::new(path.trim().trim_matches('"'));
    let mut files: Vec<(String, String, String)> = Vec::new();

    if p.is_dir() {
        let mut stack = vec![p.to_path_buf()];
        while let Some(dir) = stack.pop() {
            for entry in std::fs::read_dir(&dir).map_err(|e| format!("Não consegui ler a pasta: {e}"))? {
                let path = entry.map_err(|e| e.to_string())?.path();
                if path.is_dir() {
                    stack.push(path);
                    continue;
                }
                let rel = path.to_string_lossy().to_string();
                if let Some((id, file)) = pkg_classify(&rel) {
                    let text = std::fs::read_to_string(&path).map_err(|e| format!("{rel}: {e}"))?;
                    files.push((id, file, text));
                }
            }
        }
    } else if p.is_file() {
        let f = std::fs::File::open(p).map_err(|e| format!("Não consegui abrir o arquivo: {e}"))?;
        let mut zip = zip::ZipArchive::new(f).map_err(|e| format!("Isso não parece um .zip válido: {e}"))?;
        for i in 0..zip.len() {
            let mut entry = zip.by_index(i).map_err(|e| e.to_string())?;
            if entry.is_dir() {
                continue;
            }
            // zip 9: nome inválido/estranho vira erro; esse arquivo só é pulado
            let Ok(name) = entry.name().map(|n| n.to_string()) else { continue };
            if let Some((id, file)) = pkg_classify(&name) {
                let mut text = String::new();
                std::io::Read::read_to_string(&mut entry, &mut text).map_err(|e| format!("{name}: {e}"))?;
                files.push((id, file, text));
            }
        }
    } else {
        return Err("Caminho não encontrado.".into());
    }

    let mut labels: HashMap<String, String> = HashMap::new();
    let mut chans: HashMap<String, PkgChannel> = HashMap::new();
    for (id, file, text) in files {
        match file.as_str() {
            "index.json" => {
                if let Ok(Value::Object(m)) = serde_json::from_str::<Value>(&text) {
                    for (k, v) in m {
                        if let Some(s) = v.as_str() {
                            labels.insert(k, s.to_string());
                        }
                    }
                }
            }
            "channel.json" => {
                let v: Value = serde_json::from_str(&text).unwrap_or(Value::Null);
                let ch = chans.entry(id).or_default();
                ch.kind = match v.get("type") {
                    Some(Value::Number(n)) => n.as_u64().unwrap_or(0) as u8,
                    Some(Value::String(s)) => match s.as_str() {
                        "DM" => 1,
                        "GROUP_DM" => 3,
                        _ => 0,
                    },
                    _ => 0,
                };
                let name = v.get("name").and_then(|x| x.as_str()).unwrap_or("");
                if let Some(g) = v.get("guild").and_then(|g| g.get("name")).and_then(|x| x.as_str()) {
                    ch.label = format!("{g} › #{name}");
                } else if !name.is_empty() {
                    ch.label = name.to_string();
                }
                if let Some(Value::Array(r)) = v.get("recipients") {
                    ch.recipients = r
                        .iter()
                        .filter_map(|x| {
                            x.as_str()
                                .map(String::from)
                                .or_else(|| x.get("id").and_then(|i| i.as_str()).map(String::from))
                        })
                        .collect();
                }
            }
            "messages.json" => {
                let v: Value =
                    serde_json::from_str(&text).map_err(|e| format!("messages.json do canal {id}: {e}"))?;
                let ch = chans.entry(id).or_default();
                if let Value::Array(arr) = v {
                    for m in arr {
                        let mid = match field(&m, "ID") {
                            Some(Value::Number(n)) => n.to_string(),
                            Some(Value::String(s)) => s.clone(),
                            _ => continue,
                        };
                        let content = field(&m, "Contents").and_then(|x| x.as_str()).unwrap_or("").to_string();
                        let has_attachments = match field(&m, "Attachments") {
                            Some(Value::String(s)) => !s.trim().is_empty(),
                            Some(Value::Array(a)) => !a.is_empty(),
                            _ => false,
                        };
                        ch.msgs.push(PkgMsg { id: mid, content, has_attachments });
                    }
                }
            }
            "messages.csv" => {
                let mut rows = parse_csv(&text).into_iter();
                let header: Vec<String> = rows
                    .next()
                    .unwrap_or_default()
                    .iter()
                    .map(|h| h.trim().trim_start_matches('\u{feff}').to_lowercase())
                    .collect();
                let col = |name: &str| header.iter().position(|h| h == name);
                let (ci, cc, ca) = (col("id").unwrap_or(0), col("contents"), col("attachments"));
                let ch = chans.entry(id).or_default();
                for r in rows {
                    let Some(mid) = r
                        .get(ci)
                        .map(|s| s.trim().to_string())
                        .filter(|s| !s.is_empty() && s.bytes().all(|b| b.is_ascii_digit()))
                    else {
                        continue;
                    };
                    let content = cc.and_then(|i| r.get(i)).cloned().unwrap_or_default();
                    let has_attachments = ca.and_then(|i| r.get(i)).map(|s| !s.trim().is_empty()).unwrap_or(false);
                    ch.msgs.push(PkgMsg { id: mid, content, has_attachments });
                }
            }
            _ => {}
        }
    }
    for (id, ch) in chans.iter_mut() {
        if let Some(l) = labels.get(id) {
            if ch.label.is_empty() || ch.kind == 1 || ch.kind == 3 {
                ch.label = l.clone();
            }
        }
        if ch.label.is_empty() {
            ch.label = format!("canal {id}");
        }
    }
    Ok(chans)
}
