use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

const ANANQUEL_DIR: &str = ".ananquel";
const CONFIG_FILE: &str = "config.json";
const COVERS_DIR: &str = "covers";
const REGISTRY_FILE: &str = "vaults.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultConfig {
    pub theme: String,
    pub last_view: String,
    #[serde(default)]
    pub anaquel_order: Vec<String>,
    /// Tamaño de ventana preferido, en píxeles lógicos. Vive en el config.json
    /// del vault (no en un archivo local de la máquina) a propósito: así viaja
    /// con el vault si se sincroniza entre dispositivos, igual que el tema.
    #[serde(default)]
    pub window_width: Option<f64>,
    #[serde(default)]
    pub window_height: Option<f64>,
    /// Color de acento personalizado (hex, p. ej. "#4c86e0"). `None` usa el
    /// naranja por defecto de `theme.css`. Vive aquí junto al resto de
    /// preferencias visuales porque también debe viajar con el vault.
    #[serde(default)]
    pub accent_color: Option<String>,
    /// Orden por defecto de la biblioteca al abrir el vault (mismos valores
    /// que `SortKey` en el frontend, p. ej. "titulo"). `None` usa "titulo".
    #[serde(default)]
    pub default_sort_key: Option<String>,
    /// Última biblioteca activa ("libros" o "audiolibros"), para recordarla
    /// al volver a abrir el vault.
    #[serde(default)]
    pub last_library_kind: Option<String>,
    /// Tamaño de las portadas en la vista de cuadrícula ("grande" | "mediano"
    /// | "pequeno"). `None` usa "mediano".
    #[serde(default)]
    pub grid_card_size: Option<String>,
    /// API key propia de Google Books, para el respaldo del autocompletado
    /// por ISBN cuando Open Library no encuentra nada. Sin ella, Google
    /// Books limita las peticiones anónimas a una cuota diaria de 0 — la key
    /// es gratuita y se saca en la Google Cloud Console.
    #[serde(default)]
    pub google_books_api_key: Option<String>,
}

impl Default for VaultConfig {
    fn default() -> Self {
        Self {
            theme: "dark".into(),
            last_view: "table".into(),
            anaquel_order: Vec::new(),
            window_width: None,
            window_height: None,
            accent_color: None,
            default_sort_key: None,
            last_library_kind: None,
            grid_card_size: None,
            google_books_api_key: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultInfo {
    pub path: String,
    pub name: String,
    pub config: VaultConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentVault {
    pub path: String,
    pub name: String,
    pub last_opened: u64,
}

fn now_millis() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn registry_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("No se pudo resolver el directorio de datos de la app: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(REGISTRY_FILE))
}

fn read_registry(app: &AppHandle) -> Result<Vec<RecentVault>, String> {
    let path = registry_path(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    Ok(serde_json::from_str(&raw).unwrap_or_default())
}

fn write_registry(app: &AppHandle, entries: &[RecentVault]) -> Result<(), String> {
    let path = registry_path(app)?;
    let raw = serde_json::to_string_pretty(entries).map_err(|e| e.to_string())?;
    fs::write(&path, raw).map_err(|e| e.to_string())
}

fn touch_recent(app: &AppHandle, path: &str, name: &str) -> Result<(), String> {
    let mut entries = read_registry(app)?;
    entries.retain(|e| e.path != path);
    entries.insert(
        0,
        RecentVault {
            path: path.to_string(),
            name: name.to_string(),
            last_opened: now_millis(),
        },
    );
    entries.truncate(10);
    write_registry(app, &entries)
}

fn vault_name_from_path(path: &Path) -> String {
    path.file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| path.to_string_lossy().to_string())
}

fn load_or_init_config(ananquel_dir: &Path) -> Result<VaultConfig, String> {
    let config_path = ananquel_dir.join(CONFIG_FILE);
    if config_path.exists() {
        let raw = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
        return Ok(serde_json::from_str(&raw).unwrap_or_default());
    }
    let config = VaultConfig::default();
    let raw = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(&config_path, raw).map_err(|e| e.to_string())?;
    Ok(config)
}

/// Prepara `path` como vault de anaquel: crea `.ananquel/` y `.ananquel/covers/`
/// si no existen, y un `config.json` por defecto si falta. Nunca toca archivos
/// que ya existan, así que abrir una carpeta cualquiera (o un vault de Obsidian
/// ya existente) es seguro y no destructivo.
fn ensure_vault_structure(path: &Path) -> Result<VaultConfig, String> {
    let ananquel_dir = path.join(ANANQUEL_DIR);
    fs::create_dir_all(ananquel_dir.join(COVERS_DIR)).map_err(|e| e.to_string())?;
    load_or_init_config(&ananquel_dir)
}

#[tauri::command]
pub fn list_recent_vaults(app: AppHandle) -> Result<Vec<RecentVault>, String> {
    let entries = read_registry(&app)?;
    let valid: Vec<RecentVault> = entries
        .into_iter()
        .filter(|e| Path::new(&e.path).is_dir())
        .collect();
    write_registry(&app, &valid)?;
    Ok(valid)
}

#[tauri::command]
pub fn create_vault(
    app: AppHandle,
    parent_dir: String,
    name: String,
) -> Result<VaultInfo, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("El nombre no puede estar vacío.".into());
    }
    if trimmed.contains(['/', '\\']) {
        return Err("El nombre no puede contener separadores de carpetas.".into());
    }
    let path = Path::new(&parent_dir).join(trimmed);
    if path.exists() {
        return Err(format!("Ya existe una carpeta llamada \"{trimmed}\" ahí."));
    }
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    let config = ensure_vault_structure(&path)?;
    let path_str = path.to_string_lossy().to_string();
    touch_recent(&app, &path_str, trimmed)?;
    Ok(VaultInfo {
        path: path_str,
        name: trimmed.to_string(),
        config,
    })
}

#[tauri::command]
pub fn open_vault(app: AppHandle, path: String) -> Result<VaultInfo, String> {
    let dir = Path::new(&path);
    if !dir.is_dir() {
        return Err("Esa carpeta no existe.".into());
    }
    let config = ensure_vault_structure(dir)?;
    let name = vault_name_from_path(dir);
    touch_recent(&app, &path, &name)?;
    Ok(VaultInfo { path, name, config })
}

#[tauri::command]
pub fn save_vault_config(path: String, config: VaultConfig) -> Result<(), String> {
    let config_path = Path::new(&path).join(ANANQUEL_DIR).join(CONFIG_FILE);
    let raw = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(&config_path, raw).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_recent_vault(app: AppHandle, path: String) -> Result<Vec<RecentVault>, String> {
    let mut entries = read_registry(&app)?;
    entries.retain(|e| e.path != path);
    write_registry(&app, &entries)?;
    Ok(entries)
}
