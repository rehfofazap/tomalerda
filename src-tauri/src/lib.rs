mod discord;

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, State};

#[derive(Default)]
struct AppState {
    cancel: Arc<AtomicBool>,
    running: Arc<AtomicBool>,
}

/// Valida o token e devolve o usuário (ou bot) dono dele.
#[tauri::command]
async fn check_token(token: String, is_bot: bool) -> Result<discord::User, String> {
    discord::Client::new(&token, is_bot, None)?.me().await
}

/// Inicia a exclusão em segundo plano. O progresso chega pelos eventos
/// `deletion-progress`, `deletion-log`, `deletion-finished` e `deletion-error`.
#[tauri::command]
async fn start_deletion(
    app: AppHandle,
    state: State<'_, AppState>,
    config: discord::Config,
) -> Result<(), String> {
    if state.running.swap(true, Ordering::SeqCst) {
        return Err("Já existe uma exclusão em andamento.".into());
    }
    state.cancel.store(false, Ordering::SeqCst);

    let cancel = state.cancel.clone();
    let running = state.running.clone();

    tauri::async_runtime::spawn(async move {
        let result = discord::run(app.clone(), config, cancel).await;
        running.store(false, Ordering::SeqCst);
        let _ = match result {
            Ok(summary) => app.emit("deletion-finished", summary),
            Err(e) => app.emit("deletion-error", e),
        };
    });

    Ok(())
}

/// Pedido avulso à API (modo ausente, HypeSquad). Devolve [status, corpo].
/// As rotas aceitas são conferidas em `discord::Client::raw`.
#[tauri::command]
async fn api_call(
    token: String,
    is_bot: bool,
    method: String,
    path: String,
    body: Option<serde_json::Value>,
) -> Result<(u16, String), String> {
    discord::Client::new(&token, is_bot, None)?.raw(&method, &path, body).await
}

#[tauri::command]
fn stop_deletion(state: State<'_, AppState>) {
    state.cancel.store(true, Ordering::SeqCst);
}

// ---------------------------------------------------------------------------
// Lembrar o token: fica no Cofre de credenciais do Windows (protegido pela
// sua conta do Windows), nunca num arquivo do app.
// ---------------------------------------------------------------------------

fn vault() -> Result<keyring::Entry, String> {
    keyring::Entry::new("tomalerda", "token").map_err(|e| e.to_string())
}

#[tauri::command]
fn save_token(token: String, is_bot: bool) -> Result<(), String> {
    let t = token.trim();
    if t.is_empty() || t.len() > 200 || !t.bytes().all(|b| b.is_ascii_graphic()) {
        return Err("Token inválido.".into());
    }
    let kind = if is_bot { "bot" } else { "user" };
    vault()?.set_password(&format!("{kind}:{t}")).map_err(|e| e.to_string())
}

/// Devolve (token, é_bot) se houver um token guardado.
#[tauri::command]
fn load_token() -> Option<(String, bool)> {
    let saved = vault().ok()?.get_password().ok()?;
    let (kind, token) = saved.split_once(':')?;
    Some((token.to_string(), kind == "bot"))
}

#[tauri::command]
fn forget_token() {
    if let Ok(v) = vault() {
        let _ = v.delete_credential();
    }
}

// ---------------------------------------------------------------------------
// Atualização: o app procura versão nova; só instala pacote assinado pela
// chave do tomalerda (a chave pública fica no tauri.conf.json).
// ---------------------------------------------------------------------------

/// Devolve a versão nova, se existir.
#[tauri::command]
async fn check_update(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_updater::UpdaterExt;
    let up = app.updater().map_err(|e| e.to_string())?.check().await.map_err(|e| e.to_string())?;
    Ok(up.map(|u| u.version))
}

/// Baixa, confere a assinatura, instala e reabre o app.
/// O progresso vai no evento `update-progress` (0–100).
#[tauri::command]
async fn install_update(app: AppHandle) -> Result<(), String> {
    use tauri_plugin_updater::UpdaterExt;
    let Some(up) = app.updater().map_err(|e| e.to_string())?.check().await.map_err(|e| e.to_string())? else {
        return Err("Você já está na versão mais nova.".into());
    };
    let mut got: u64 = 0;
    let app2 = app.clone();
    up.download_and_install(
        move |chunk, total| {
            got += chunk as u64;
            if let Some(t) = total.filter(|t| *t > 0) {
                let _ = app2.emit("update-progress", (got * 100 / t).min(100));
            }
        },
        || {},
    )
    .await
    .map_err(|e| e.to_string())?;
    app.restart();
}

/// Recorta os cantos do ícone (raio de 24% do lado), com a borda suavizada,
/// pra ficar redondinho na barra de tarefas igual ao ícone do app.
fn rounded(img: tauri::image::Image<'_>) -> tauri::image::Image<'static> {
    let (w, h) = (img.width(), img.height());
    let mut px = img.rgba().to_vec();
    let r = w.min(h) as f32 * 0.24;
    for y in 0..h {
        for x in 0..w {
            // centro do círculo do canto mais perto (se o pixel estiver num canto)
            let (fx, fy) = (x as f32 + 0.5, y as f32 + 0.5);
            let cx = if fx < r { r } else if fx > w as f32 - r { w as f32 - r } else { continue };
            let cy = if fy < r { r } else if fy > h as f32 - r { h as f32 - r } else { continue };
            let d = ((fx - cx).powi(2) + (fy - cy).powi(2)).sqrt();
            let cover = (r - d + 0.5).clamp(0.0, 1.0);
            let a = &mut px[((y * w + x) * 4 + 3) as usize];
            *a = (*a as f32 * cover).round() as u8;
        }
    }
    tauri::image::Image::new_owned(px, w, h)
}

/// A barra de tarefas do Windows usa o ícone GRANDE da janela (WM_SETICON/ICON_BIG),
/// e o set_icon do Tauri só troca o pequeno. Aqui monta o HICON a partir do RGBA.
#[cfg(windows)]
fn set_big_icon(w: &tauri::WebviewWindow, img: &tauri::image::Image<'_>) {
    use std::sync::atomic::AtomicIsize;
    use windows_sys::Win32::Graphics::Gdi::{CreateBitmap, DeleteObject};
    use windows_sys::Win32::UI::WindowsAndMessaging::{CreateIconIndirect, DestroyIcon, SendMessageW, ICONINFO, ICON_BIG, WM_SETICON};
    static PREV: AtomicIsize = AtomicIsize::new(0);
    let Ok(hwnd) = w.hwnd() else { return };
    let (wd, ht) = (img.width() as i32, img.height() as i32);
    // RGBA -> BGRA (formato do Windows)
    let mut bgra = img.rgba().to_vec();
    for p in bgra.chunks_exact_mut(4) {
        p.swap(0, 2);
    }
    unsafe {
        let color = CreateBitmap(wd, ht, 1, 32, bgra.as_ptr() as _);
        let mask_bits = vec![0u8; (((wd + 15) / 16 * 2) * ht) as usize];
        let mask = CreateBitmap(wd, ht, 1, 1, mask_bits.as_ptr() as _);
        let info = ICONINFO { fIcon: 1, xHotspot: 0, yHotspot: 0, hbmMask: mask, hbmColor: color };
        let hicon = CreateIconIndirect(&info);
        DeleteObject(color as _);
        DeleteObject(mask as _);
        if hicon.is_null() {
            return;
        }
        SendMessageW(hwnd.0 as _, WM_SETICON, ICON_BIG as usize, hicon as isize);
        let old = PREV.swap(hicon as isize, Ordering::SeqCst);
        if old != 0 {
            DestroyIcon(old as _);
        }
    }
}

/// Monta um .ico (BMP 32 bits com transparência) a partir do RGBA.
#[cfg(windows)]
fn ico_bytes(img: &tauri::image::Image<'_>) -> Vec<u8> {
    let (w, h) = (img.width(), img.height());
    let rgba = img.rgba();
    let mask_row = ((w + 31) / 32 * 4) as usize;
    let data_len = (w * h * 4) as usize + mask_row * h as usize;
    let mut v = Vec::with_capacity(22 + 40 + data_len);
    // cabeçalho + 1 entrada
    v.extend_from_slice(&[0, 0, 1, 0, 1, 0]);
    v.push(if w >= 256 { 0 } else { w as u8 });
    v.push(if h >= 256 { 0 } else { h as u8 });
    v.extend_from_slice(&[0, 0, 1, 0, 32, 0]);
    v.extend_from_slice(&((40 + data_len) as u32).to_le_bytes());
    v.extend_from_slice(&22u32.to_le_bytes());
    // BITMAPINFOHEADER (altura dobrada = cor + máscara)
    v.extend_from_slice(&40u32.to_le_bytes());
    v.extend_from_slice(&(w as i32).to_le_bytes());
    v.extend_from_slice(&((h * 2) as i32).to_le_bytes());
    v.extend_from_slice(&1u16.to_le_bytes());
    v.extend_from_slice(&32u16.to_le_bytes());
    v.extend_from_slice(&[0u8; 4]);
    v.extend_from_slice(&(data_len as u32).to_le_bytes());
    v.extend_from_slice(&[0u8; 16]);
    // pixels de baixo pra cima, em BGRA
    for y in (0..h).rev() {
        for x in 0..w {
            let i = ((y * w + x) * 4) as usize;
            v.extend_from_slice(&[rgba[i + 2], rgba[i + 1], rgba[i], rgba[i + 3]]);
        }
    }
    v.resize(v.len() + mask_row * h as usize, 0);
    v
}

/// Se o tomalerda estiver FIXADO na barra de tarefas, o Windows mostra o ícone
/// do atalho fixado (e ignora o da janela). Então troca o ícone desse atalho também.
#[cfg(windows)]
fn update_pinned_icon(app: &AppHandle, theme: &str, icon: &tauri::image::Image<'_>) {
    let Ok(appdata) = std::env::var("APPDATA") else { return };
    let pins = std::path::Path::new(&appdata).join(r"Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar");
    let pinned = std::fs::read_dir(&pins)
        .map(|d| d.flatten().any(|e| e.file_name().to_string_lossy().to_lowercase().contains("tomalerda")))
        .unwrap_or(false);
    if !pinned {
        return;
    }
    let (Ok(dir), Ok(exe)) = (app.path().app_local_data_dir(), std::env::current_exe()) else { return };
    let dir = dir.join("icones");
    let ico = dir.join(format!("{theme}.ico"));
    if std::fs::create_dir_all(&dir).is_err() || std::fs::write(&ico, ico_bytes(icon)).is_err() {
        return;
    }
    std::thread::spawn(move || {
        use std::os::windows::process::CommandExt;
        let script = r#"$sh=New-Object -ComObject WScript.Shell;$m=0;Get-ChildItem -LiteralPath $env:TOMA_PINS -Filter *.lnk|%{$l=$sh.CreateShortcut($_.FullName);if($l.TargetPath -ieq $env:TOMA_EXE -and $l.IconLocation -ne ($env:TOMA_ICO+',0')){$l.IconLocation=$env:TOMA_ICO+',0';$l.Save();$m=1}};exit (3*$m)"#;
        let out = std::process::Command::new("powershell.exe")
            .args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script])
            .env("TOMA_PINS", &pins)
            .env("TOMA_EXE", &exe)
            .env("TOMA_ICO", &ico)
            .creation_flags(0x0800_0000) // sem janela
            .status();
        if matches!(out, Ok(s) if s.code() == Some(3)) {
            use windows_sys::Win32::UI::Shell::{SHChangeNotify, SHCNE_ASSOCCHANGED, SHCNF_IDLIST};
            unsafe { SHChangeNotify(SHCNE_ASSOCCHANGED as _, SHCNF_IDLIST, std::ptr::null(), std::ptr::null()) };
        }
    });
}

/// Troca o ícone da janela (barra de tarefas) e o do relógio pelo do tema.
/// Os ícones já vão embutidos no app (src/temas); tema sem ícone volta pro padrão.
#[tauri::command]
fn set_theme_icon(app: AppHandle, theme: String) -> Result<(), String> {
    if theme.is_empty() || theme.len() > 32 || !theme.chars().all(|c| c.is_ascii_lowercase()) {
        return Err("tema inválido".into());
    }
    let path = if theme == "kitty" { "kitty.png".to_string() } else { format!("temas/{theme}.png") };
    let icon = match app.asset_resolver().get(path) {
        Some(asset) => rounded(tauri::image::Image::from_bytes(&asset.bytes).map_err(|e| e.to_string())?),
        None => match app.default_window_icon() {
            Some(i) => i.clone().to_owned(),
            None => return Ok(()),
        },
    };
    if let Some(w) = app.get_webview_window("main") {
        w.set_icon(icon.clone()).map_err(|e| e.to_string())?;
        #[cfg(windows)]
        set_big_icon(&w, &icon);
    }
    #[cfg(windows)]
    update_pinned_icon(&app, &theme, &icon);
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_icon(Some(icon));
    }
    Ok(())
}

fn show_main(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // abrir de novo só traz a janela que já está aberta
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| show_main(app)))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(AppState::default())
        .setup(|app| {
            // ícone perto do relógio (usado pelo botão verde "segundo plano")
            let open = MenuItem::with_id(app, "open", "Abrir tomalerda", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &quit])?;
            let mut tray = TrayIconBuilder::with_id("main")
                .tooltip("tomalerda")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, ev| match ev.id().as_ref() {
                    "open" => show_main(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, ev| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = ev {
                        show_main(tray.app_handle());
                    }
                });
            if let Some(icon) = app.default_window_icon() {
                tray = tray.icon(icon.clone());
            }
            tray.build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_theme_icon,
            check_token,
            start_deletion,
            stop_deletion,
            api_call,
            save_token,
            load_token,
            forget_token,
            check_update,
            install_update
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o aplicativo");
}
