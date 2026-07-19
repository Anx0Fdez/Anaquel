use std::collections::HashMap;
use std::fs;
use std::path::Path;

use serde::{Deserialize, Serialize};

const ANANQUEL_DIR: &str = ".ananquel";
const LIBRARY_FILE: &str = "mybooks.json";
const LIBRARY_FILE_LEGACY: &str = "library.json";
const AUDIOBOOKS_FILE: &str = "myaudiobooks.json";
const AUDIOBOOKS_FILE_LEGACY: &str = "audiobooks.json";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum EstadoLectura {
    QuieroLeer,
    Pospuesto,
    Leido,
    Abandonado,
    /// `#[serde(other)]` hace de red de seguridad al leer un vault antiguo:
    /// el estado "audiolibro" (el filtro rápido de "lo que estoy escuchando
    /// ahora", de antes de separar Libros/Audiolibros en dos bibliotecas) ya
    /// no es un estado válido, así que cualquier valor que no reconozcamos
    /// cae aquí en vez de que falle la carga de toda la biblioteca.
    #[serde(other)]
    Leyendo,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum FormatoLibro {
    Fisico,
    Ebook,
    Audiolibro,
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
pub struct Book {
    pub id: String,
    pub titulo: String,
    pub autor: String,
    pub isbn: Option<String>,
    pub portada: Option<String>,
    pub estado: EstadoLectura,
    pub formato: FormatoLibro,
    #[serde(default)]
    pub editorial: Option<String>,
    pub valoracion: Option<f32>,
    #[serde(default)]
    pub favorito: bool,
    /// Solo tiene sentido cuando `formato == Audiolibro` y `estado == Leido`:
    /// marca que se quiere comprar la edición física en el futuro.
    #[serde(default)]
    pub comprar_fisico: bool,
    /// Marca un libro (no audiolibro) para volver a leerlo en el futuro.
    #[serde(default)]
    pub relectura: bool,
    #[serde(default)]
    pub paginas_totales: Option<u32>,
    pub saga: Option<Saga>,
    pub fechas: Fechas,
}

fn ananquel_dir(vault_path: &str) -> std::path::PathBuf {
    Path::new(vault_path).join(ANANQUEL_DIR)
}

/// Renombra un archivo con el nombre antiguo al nuevo si el nuevo todavía no
/// existe. `rename` en el mismo directorio es atómico, así que esto nunca
/// puede dejar el archivo a medias ni duplicar datos.
fn migrate_legacy_filename(dir: &Path, legacy: &str, current: &str) {
    let legacy_path = dir.join(legacy);
    let current_path = dir.join(current);
    if legacy_path.exists() && !current_path.exists() {
        let _ = fs::rename(&legacy_path, &current_path);
    }
}

/// Mueve `filename` de `old_dir` a `new_dir` si todavía está en la ubicación
/// antigua y la nueva no existe ya. `rename` es atómico incluso entre
/// carpetas del mismo volumen, así que esto no puede perder ni duplicar nada.
fn migrate_file_dir(old_dir: &Path, new_dir: &Path, filename: &str) {
    let old_path = old_dir.join(filename);
    let new_path = new_dir.join(filename);
    if old_path.exists() && !new_path.exists() {
        let _ = fs::rename(&old_path, &new_path);
    }
}

/// Lee un archivo de libros. Si todavía no existe (vault recién creado,
/// primera vez que se separan los audiolibros...), devuelve una lista
/// vacía en vez de un error: no tener el archivo es un estado válido.
fn read_books_file(file: &Path) -> Result<Vec<Book>, String> {
    if !file.exists() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(file).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw).map_err(|e| format!("{} no es válido: {e}", file.display()))
}

/// Escribe a un archivo temporal y renombra: un corte a mitad de escritura
/// (disco lleno, corte de luz) deja el archivo original intacto en vez de
/// truncado, porque `rename` en el mismo directorio es atómico.
fn write_books_file(file: &Path, books: &[Book]) -> Result<(), String> {
    let raw = serde_json::to_string_pretty(books).map_err(|e| e.to_string())?;
    let tmp = file.with_extension("json.tmp");
    fs::write(&tmp, raw).map_err(|e| e.to_string())?;
    fs::rename(&tmp, file).map_err(|e| e.to_string())
}

/// Lee `mybooks.json` y `myaudiobooks.json` y devuelve la unión, igual que si
/// siempre hubiera sido un único array — el frontend no sabe ni le importa
/// que estén repartidos en dos archivos.
///
/// Si todavía existen los nombres antiguos (`library.json`/`audiobooks.json`,
/// de antes de renombrarlos) y los nuevos no, se renombran ya mismo — un
/// `rename` es atómico, así que esto no puede perder ni duplicar nada.
///
/// Ambos archivos viven en la raíz del vault, no dentro de `.ananquel/`: son
/// "tus" datos (como las notas de un vault de Obsidian), mientras que
/// `.ananquel/` se reserva para lo que gestiona la app internamente
/// (`config.json`, `covers/`). Si todavía están dentro de `.ananquel/` (de
/// antes de este cambio), se mueven ya mismo a la raíz.
///
/// Si `mybooks.json` todavía tiene audiolibros sueltos (de antes de que
/// existiera `myaudiobooks.json`), se migran ya mismo: se fusionan por `id`
/// con lo que hubiera en `myaudiobooks.json` (para que reintentar tras un
/// fallo a medias no duplique nada) y se escribe primero el archivo que
/// *añade* datos y solo después el que *quita* — así un fallo entre medias
/// deja como mucho un duplicado recuperable, nunca una pérdida.
#[tauri::command]
pub fn load_books(path: String) -> Result<Vec<Book>, String> {
    let vault_dir = Path::new(&path);
    let dir = ananquel_dir(&path);
    migrate_legacy_filename(&dir, LIBRARY_FILE_LEGACY, LIBRARY_FILE);
    migrate_legacy_filename(&dir, AUDIOBOOKS_FILE_LEGACY, AUDIOBOOKS_FILE);
    migrate_file_dir(&dir, vault_dir, LIBRARY_FILE);
    migrate_file_dir(&dir, vault_dir, AUDIOBOOKS_FILE);

    let library_file = vault_dir.join(LIBRARY_FILE);
    let audiobooks_file = vault_dir.join(AUDIOBOOKS_FILE);

    let libros_raw = read_books_file(&library_file)?;
    let audiolibros_raw = read_books_file(&audiobooks_file)?;

    let (mezclados, libros): (Vec<Book>, Vec<Book>) =
        libros_raw.into_iter().partition(|b| b.formato == FormatoLibro::Audiolibro);

    if mezclados.is_empty() {
        let mut result = libros;
        result.extend(audiolibros_raw);
        return Ok(result);
    }

    let mut by_id: HashMap<String, Book> = HashMap::new();
    for b in audiolibros_raw {
        by_id.insert(b.id.clone(), b);
    }
    for b in mezclados {
        by_id.insert(b.id.clone(), b);
    }
    let mut audiolibros: Vec<Book> = by_id.into_values().collect();
    audiolibros.sort_by(|a, b| a.id.cmp(&b.id));

    write_books_file(&audiobooks_file, &audiolibros)?;
    write_books_file(&library_file, &libros)?;

    let mut result = libros;
    result.extend(audiolibros);
    Ok(result)
}

/// Sobrescribe `mybooks.json` y `myaudiobooks.json` con la lista completa
/// que manda el frontend, repartida por `formato`. El frontend es quien
/// mantiene el array en memoria; aquí solo persistimos el estado que nos
/// manda, sin fusionar ni deducir nada más allá de a qué archivo va cada
/// libro.
#[tauri::command]
pub fn save_books(path: String, books: Vec<Book>) -> Result<(), String> {
    let vault_dir = Path::new(&path);

    let (audiolibros, libros): (Vec<Book>, Vec<Book>) =
        books.into_iter().partition(|b| b.formato == FormatoLibro::Audiolibro);

    write_books_file(&vault_dir.join(AUDIOBOOKS_FILE), &audiolibros)?;
    write_books_file(&vault_dir.join(LIBRARY_FILE), &libros)
}
