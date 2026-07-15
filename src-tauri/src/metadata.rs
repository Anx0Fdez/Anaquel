use std::path::Path;
use std::time::Duration;

use base64::Engine;
use serde::Serialize;
use serde_json::Value;

#[derive(Debug, Clone, Default, Serialize)]
pub struct BookMetadata {
    pub titulo: Option<String>,
    pub subtitulo: Option<String>,
    pub autor: Option<String>,
    pub autores_adicionales: Vec<String>,
    pub editorial: Option<String>,
    pub fecha_publicacion: Option<String>,
    pub paginas_totales: Option<u32>,
    pub idioma: Option<String>,
    pub descripcion: Option<String>,
    pub isbn13: Option<String>,
    pub portada: Option<String>,
}

/// Se queda solo con dígitos/X (mayúscula) y exige longitud 10 o 13. Se usa
/// tanto para construir la consulta como para el nombre de archivo de la
/// portada, así que nunca debe confiar en que el frontend ya validó el ISBN:
/// `invoke()` es una superficie atacable directamente.
fn sanitize_isbn(raw: &str) -> Option<String> {
    let cleaned: String = raw
        .chars()
        .filter(|c| c.is_ascii_digit() || *c == 'x' || *c == 'X')
        .map(|c| c.to_ascii_uppercase())
        .collect();
    if cleaned.len() == 10 || cleaned.len() == 13 {
        Some(cleaned)
    } else {
        None
    }
}

/// Solo acepta fechas que ya vienen en forma YYYY, YYYY-MM o YYYY-MM-DD
/// (comprobación manual, sin `chrono` ni `regex`). Cualquier otra cosa —p. ej.
/// el texto libre "March 27, 2007" que a veces devuelve Open Library— se
/// descarta en vez de guardar una fecha no-ISO que `<input type="date">`
/// no sabría mostrar.
fn normalize_date(raw: &str) -> Option<String> {
    let raw = raw.trim();
    let all_digits = |s: &str| !s.is_empty() && s.chars().all(|c| c.is_ascii_digit());
    let parts: Vec<&str> = raw.split('-').collect();
    match parts.as_slice() {
        [y] if y.len() == 4 && all_digits(y) => Some(format!("{y}-01-01")),
        [y, m] if y.len() == 4 && m.len() == 2 && all_digits(y) && all_digits(m) => {
            Some(format!("{y}-{m}-01"))
        }
        [y, m, d]
            if y.len() == 4
                && m.len() == 2
                && d.len() == 2
                && all_digits(y)
                && all_digits(m)
                && all_digits(d) =>
        {
            Some(raw.to_string())
        }
        _ => None,
    }
}

fn build_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(8))
        .user_agent("Anaquel/0.1 (+https://github.com/Anx0Fdez/ananquel)")
        .build()
        .map_err(|e| e.to_string())
}

fn first_str(value: &Value, key: &str) -> Option<String> {
    value.get(key).and_then(Value::as_str).map(String::from)
}

async fn fetch_open_library(client: &reqwest::Client, isbn: &str) -> Option<(BookMetadata, Option<String>)> {
    let url = format!("https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&jscmd=data&format=json");
    let res = client.get(&url).send().await.ok()?;
    if !res.status().is_success() {
        return None;
    }
    let body: Value = res.json().await.ok()?;
    let entry = body.get(format!("ISBN:{isbn}").as_str())?;

    let titulo = first_str(entry, "title");
    let subtitulo = first_str(entry, "subtitle");

    let mut autores: Vec<String> = entry
        .get("authors")
        .and_then(Value::as_array)
        .map(|arr| {
            arr.iter()
                .filter_map(|a| a.get("name").and_then(Value::as_str).map(String::from))
                .collect()
        })
        .unwrap_or_default();
    let autor = if autores.is_empty() { None } else { Some(autores.remove(0)) };

    let editorial = entry
        .get("publishers")
        .and_then(Value::as_array)
        .and_then(|arr| arr.first())
        .and_then(|p| first_str(p, "name"));

    let fecha_publicacion = entry.get("publish_date").and_then(Value::as_str).and_then(normalize_date);

    let paginas_totales = entry.get("number_of_pages").and_then(Value::as_u64).map(|n| n as u32);

    let cover_url = entry
        .get("cover")
        .and_then(|c| c.get("large").or_else(|| c.get("medium")).or_else(|| c.get("small")))
        .and_then(Value::as_str)
        .map(String::from);

    if titulo.is_none() && autor.is_none() && cover_url.is_none() {
        return None;
    }

    let meta = BookMetadata {
        titulo,
        subtitulo,
        autor,
        autores_adicionales: autores,
        editorial,
        fecha_publicacion,
        paginas_totales,
        idioma: None,
        descripcion: None,
        isbn13: None,
        portada: None,
    };

    Some((meta, cover_url))
}

async fn fetch_google_books(client: &reqwest::Client, isbn: &str) -> Option<(BookMetadata, Option<String>)> {
    let url = format!("https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}");
    let res = client.get(&url).send().await.ok()?;
    if !res.status().is_success() {
        return None;
    }
    let body: Value = res.json().await.ok()?;
    let info = body.get("items")?.get(0)?.get("volumeInfo")?;

    let titulo = first_str(info, "title");
    let subtitulo = first_str(info, "subtitle");

    let mut autores: Vec<String> = info
        .get("authors")
        .and_then(Value::as_array)
        .map(|arr| arr.iter().filter_map(Value::as_str).map(String::from).collect())
        .unwrap_or_default();
    let autor = if autores.is_empty() { None } else { Some(autores.remove(0)) };

    let editorial = first_str(info, "publisher");
    let fecha_publicacion = info.get("publishedDate").and_then(Value::as_str).and_then(normalize_date);
    let paginas_totales = info.get("pageCount").and_then(Value::as_u64).map(|n| n as u32);
    let idioma = first_str(info, "language");
    let descripcion = first_str(info, "description");

    let isbn13 = info
        .get("industryIdentifiers")
        .and_then(Value::as_array)
        .and_then(|arr| arr.iter().find(|id| id.get("type").and_then(Value::as_str) == Some("ISBN_13")))
        .and_then(|id| first_str(id, "identifier"));

    let cover_url = info
        .get("imageLinks")
        .and_then(|links| links.get("thumbnail").or_else(|| links.get("smallThumbnail")))
        .and_then(Value::as_str)
        .map(|u| u.replacen("http://", "https://", 1).replace("&edge=curl", ""));

    if titulo.is_none() && autor.is_none() && cover_url.is_none() {
        return None;
    }

    let meta = BookMetadata {
        titulo,
        subtitulo,
        autor,
        autores_adicionales: autores,
        editorial,
        fecha_publicacion,
        paginas_totales,
        idioma,
        descripcion,
        isbn13,
        portada: None,
    };

    Some((meta, cover_url))
}

/// Descarga la portada y la guarda en `.ananquel/covers/{isbn}.{ext}`. Un
/// fallo aquí (red, formato inesperado, IO) nunca debe tirar todo el lookup:
/// se traga el error y devuelve `None`, dejando `portada` en null.
async fn download_cover(client: &reqwest::Client, vault_path: &str, isbn: &str, url: &str) -> Option<String> {
    let res = client.get(url).send().await.ok()?;
    if !res.status().is_success() {
        return None;
    }
    let content_type = res
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();
    let ext = match content_type.split(';').next().unwrap_or("").trim() {
        "image/png" => "png",
        "image/webp" => "webp",
        "image/gif" => "gif",
        _ => "jpg",
    };
    let bytes = res.bytes().await.ok()?;

    let covers_dir = Path::new(vault_path).join(".ananquel").join("covers");
    std::fs::create_dir_all(&covers_dir).ok()?;
    let file_path = covers_dir.join(format!("{isbn}.{ext}"));
    std::fs::write(&file_path, &bytes).ok()?;

    Some(format!("covers/{isbn}.{ext}"))
}

/// Busca metadatos por ISBN: Open Library primero, Google Books como
/// respaldo. Nunca devuelve `Err` por "no encontrado" o fallo de red —
/// solo `Ok(None)`, para que un ISBN inexistente o sin conexión sea
/// completamente silencioso en el frontend.
#[tauri::command]
pub async fn lookup_isbn(path: String, isbn: String) -> Result<Option<BookMetadata>, String> {
    let Some(clean_isbn) = sanitize_isbn(&isbn) else {
        return Ok(None);
    };

    let client = build_client()?;

    let found = match fetch_open_library(&client, &clean_isbn).await {
        Some(result) => Some(result),
        None => fetch_google_books(&client, &clean_isbn).await,
    };

    let Some((mut meta, cover_url)) = found else {
        return Ok(None);
    };

    if let Some(url) = cover_url {
        meta.portada = download_cover(&client, &path, &clean_isbn, &url).await;
    }

    Ok(Some(meta))
}

/// Copia una imagen elegida a mano por el usuario a `.ananquel/covers/`,
/// nombrada por `book_id` (no por ISBN: un libro sin ISBN también puede
/// tener portada manual). Solo acepta las mismas extensiones que ya soporta
/// el resto de la app; cualquier otra se rechaza con un error legible.
#[tauri::command]
pub fn set_manual_cover(vault_path: String, book_id: String, source_path: String) -> Result<String, String> {
    let source = Path::new(&source_path);
    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase())
        .filter(|e| matches!(e.as_str(), "jpg" | "jpeg" | "png" | "webp" | "gif"))
        .ok_or_else(|| "Formato de imagen no soportado (usa JPG, PNG, WEBP o GIF).".to_string())?;

    let covers_dir = Path::new(&vault_path).join(".ananquel").join("covers");
    std::fs::create_dir_all(&covers_dir).map_err(|e| e.to_string())?;

    let dest = covers_dir.join(format!("{book_id}.{ext}"));
    std::fs::copy(source, &dest).map_err(|e| e.to_string())?;

    Ok(format!("covers/{book_id}.{ext}"))
}

/// Lee una portada ya descargada y la devuelve como `data:` URL en base64,
/// para que el frontend pueda usarla directamente en un `<img src>` sin
/// necesitar `convertFileSrc`/`assetProtocol.scope`. `portada` viene de
/// `library.json` (editable a mano), así que nunca hay que confiar en la
/// ruta tal cual: se canonicaliza y se verifica que sigue dentro de
/// `.ananquel/covers/` antes de leer, para evitar un path traversal.
#[tauri::command]
pub fn read_cover_image(path: String, portada: String) -> Result<String, String> {
    let covers_dir = Path::new(&path).join(".ananquel").join("covers");
    let candidate = Path::new(&path).join(".ananquel").join(&portada);

    let covers_dir_canonical = covers_dir.canonicalize().map_err(|e| e.to_string())?;
    let candidate_canonical = candidate.canonicalize().map_err(|e| e.to_string())?;

    if !candidate_canonical.starts_with(&covers_dir_canonical) {
        return Err("Ruta de portada fuera de covers/".to_string());
    }

    let bytes = std::fs::read(&candidate_canonical).map_err(|e| e.to_string())?;
    let mime = match candidate_canonical.extension().and_then(|e| e.to_str()) {
        Some("png") => "image/png",
        Some("webp") => "image/webp",
        Some("gif") => "image/gif",
        _ => "image/jpeg",
    };

    let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Ok(format!("data:{mime};base64,{encoded}"))
}
