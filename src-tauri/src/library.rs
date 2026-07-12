use std::fs;
use std::path::Path;

use serde::{Deserialize, Serialize};

const ANANQUEL_DIR: &str = ".ananquel";
const LIBRARY_FILE: &str = "library.json";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum EstadoLectura {
    QuieroLeer,
    Leyendo,
    Leido,
    Abandonado,
    Audiolibro,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum FormatoLibro {
    Fisico,
    Ebook,
    Audiolibro,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Progreso {
    pub pagina_actual: Option<u32>,
    pub paginas_totales: Option<u32>,
    pub porcentaje: Option<f32>,
    pub ultima_lectura: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Saga {
    pub nombre: String,
    pub numero: u32,
    pub total_libros: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Fechas {
    #[serde(rename = "añadido")]
    pub anadido: String,
    pub inicio_lectura: Option<String>,
    pub fin_lectura: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EdicionAdicional {
    pub formato: FormatoLibro,
    pub editorial: Option<String>,
    pub duracion_min: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Prestamo {
    pub persona: String,
    pub fecha: Option<String>,
    pub devolucion_prevista: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Book {
    pub id: String,
    pub titulo: String,
    #[serde(default)]
    pub subtitulo: Option<String>,
    pub titulo_original: Option<String>,
    pub autor: String,
    #[serde(default)]
    pub autores_adicionales: Vec<String>,
    pub isbn: Option<String>,
    pub isbn13: Option<String>,
    pub portada: Option<String>,
    pub estado: EstadoLectura,
    pub formato: FormatoLibro,
    #[serde(default)]
    pub idioma: Option<String>,
    #[serde(default)]
    pub editorial: Option<String>,
    #[serde(default)]
    pub fecha_publicacion: Option<String>,
    #[serde(default)]
    pub genero: Vec<String>,
    #[serde(default)]
    pub etiquetas: Vec<String>,
    pub valoracion: Option<f32>,
    #[serde(default)]
    pub favorito: bool,
    #[serde(default)]
    pub progreso: Progreso,
    pub saga: Option<Saga>,
    pub fechas: Fechas,
    pub ubicacion_fisica: Option<String>,
    #[serde(default)]
    pub prestamo: Option<Prestamo>,
    #[serde(default)]
    pub ediciones: Vec<EdicionAdicional>,
    #[serde(default)]
    pub enlaces_relacionados: Vec<String>,
    #[serde(default)]
    pub anaqueles: Vec<String>,
    #[serde(default)]
    pub descripcion: Option<String>,
    #[serde(default)]
    pub notas: String,
    #[serde(default)]
    pub citas: Vec<String>,
}

fn library_path(vault_path: &str) -> std::path::PathBuf {
    Path::new(vault_path).join(ANANQUEL_DIR).join(LIBRARY_FILE)
}

/// Lee `.ananquel/library.json`. Si el archivo todavía no existe (vault recién
/// creado, o abierto por primera vez), devuelve una biblioteca vacía en vez de
/// un error: una biblioteca sin libros es un estado válido, no un fallo.
#[tauri::command]
pub fn load_books(path: String) -> Result<Vec<Book>, String> {
    let file = library_path(&path);
    if !file.exists() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&file).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw).map_err(|e| format!("library.json no es válido: {e}"))
}

/// Sobrescribe `.ananquel/library.json` con la lista completa. El frontend es
/// quien mantiene el array en memoria; aquí solo persistimos el estado que nos
/// manda, sin fusionar ni deducir nada.
#[tauri::command]
pub fn save_books(path: String, books: Vec<Book>) -> Result<(), String> {
    let ananquel_dir = Path::new(&path).join(ANANQUEL_DIR);
    fs::create_dir_all(&ananquel_dir).map_err(|e| e.to_string())?;
    let raw = serde_json::to_string_pretty(&books).map_err(|e| e.to_string())?;
    fs::write(ananquel_dir.join(LIBRARY_FILE), raw).map_err(|e| e.to_string())
}
