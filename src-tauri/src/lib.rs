mod export;
mod library;
mod metadata;
mod updater;
mod vault;

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
            metadata::read_cover_image,
            metadata::set_manual_cover,
            export::export_library,
            export::cancel_export,
            updater::check_for_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
