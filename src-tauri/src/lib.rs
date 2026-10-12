mod export;
mod library;
mod metadata;
mod updater;
mod vault;

use tauri::Manager;

/// Plataforma del proceso ("windows" | "macos" | "linux" | ...), para que el
/// frontend sepa si debe dibujar sus propios controles de ventana o dejar que
/// el sistema operativo dibuje los suyos (macOS, vía titleBarStyle Overlay).
#[tauri::command]
fn get_platform() -> &'static str {
    std::env::consts::OS
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                if let Ok(Some(monitor)) = window.current_monitor() {
                    let work_area = monitor.work_area();
                    let scale = monitor.scale_factor();
                    let width = (f64::from(work_area.size.width) / scale * 0.90).round();
                    let height = (f64::from(work_area.size.height) / scale * 0.90).round();
                    window.set_size(tauri::LogicalSize::new(width, height))?;
                    window.center()?;
                }
            }
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(export::ExportState::default())
        .invoke_handler(tauri::generate_handler![
            get_platform,
            vault::list_recent_vaults,
            vault::create_vault,
            vault::open_vault,
            vault::save_vault_config,
            vault::remove_recent_vault,
            library::load_books,
            library::save_books,
            metadata::lookup_isbn,
            metadata::validate_google_books_api_key,
            metadata::read_cover_image,
            metadata::set_manual_cover,
            export::export_library,
            export::cancel_export,
            updater::check_for_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
