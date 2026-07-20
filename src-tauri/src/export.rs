use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use rust_xlsxwriter::{Format, Workbook};

use crate::library::{Book, EstadoLectura, FormatoLibro};

/// Bandera compartida para cancelar una exportación en curso desde el
/// frontend. Un `Vec::iter` de miles de libros nunca tarda mucho, pero
/// comprobarla en cada fila evita escribir el .xlsx si el usuario ya canceló.
pub struct ExportState(pub Arc<AtomicBool>);

impl Default for ExportState {
    fn default() -> Self {
        Self(Arc::new(AtomicBool::new(false)))
    }
}

#[tauri::command]
pub fn cancel_export(state: tauri::State<ExportState>) {
    state.0.store(true, Ordering::SeqCst);
}

fn estado_label(estado: &EstadoLectura) -> &'static str {
    match estado {
        EstadoLectura::QuieroLeer => "Quiero leer",
        EstadoLectura::Leyendo => "Leyendo",
        EstadoLectura::Pospuesto => "Pospuesto",
        EstadoLectura::Leido => "Leído",
        EstadoLectura::Abandonado => "Abandonado",
    }
}

fn formato_label(formato: &FormatoLibro) -> &'static str {
    match formato {
        FormatoLibro::Fisico => "Físico",
        FormatoLibro::Ebook => "Ebook",
        FormatoLibro::Comprar => "Comprar",
        FormatoLibro::Audiolibro => "Audiolibro",
    }
}

const CANCELLED: &str = "cancelado";

/// "Relectura" no aplica a audiolibros (la app ya no deja marcarla ahí), así
/// que la hoja de Audiolibros se genera sin esa columna.
fn headers_for(audio: bool) -> Vec<&'static str> {
    let mut headers = vec!["Título", "Autor", "Saga", "Estado", "Formato", "Editorial", "Páginas", "Valoración", "Favorito"];
    if !audio {
        headers.push("Relectura");
    }
    headers.push("Inicio lectura");
    headers.push("Fin lectura");
    headers.push("ISBN");
    headers
}

fn write_sheet(
    workbook: &mut Workbook,
    name: &str,
    books: &[Book],
    audio: bool,
    cancelled: &AtomicBool,
) -> Result<(), String> {
    let sheet = workbook.add_worksheet();
    sheet.set_name(name).map_err(|e| e.to_string())?;

    let header_format = Format::new().set_bold();
    for (col, h) in headers_for(audio).iter().enumerate() {
        sheet
            .write_string_with_format(0, col as u16, *h, &header_format)
            .map_err(|e| e.to_string())?;
    }

    for (i, book) in books.iter().enumerate() {
        if cancelled.load(Ordering::SeqCst) {
            return Err(CANCELLED.to_string());
        }
        let row = (i + 1) as u32;
        let saga = book
            .saga
            .as_ref()
            .map(|s| format!("{} #{}", s.nombre, s.numero))
            .unwrap_or_default();

        let mut col: u16 = 0;
        sheet.write_string(row, col, &book.titulo).map_err(|e| e.to_string())?;
        col += 1;
        sheet.write_string(row, col, &book.autor).map_err(|e| e.to_string())?;
        col += 1;
        sheet.write_string(row, col, &saga).map_err(|e| e.to_string())?;
        col += 1;
        sheet.write_string(row, col, estado_label(&book.estado)).map_err(|e| e.to_string())?;
        col += 1;
        sheet.write_string(row, col, formato_label(&book.formato)).map_err(|e| e.to_string())?;
        col += 1;
        sheet
            .write_string(row, col, book.editorial.as_deref().unwrap_or(""))
            .map_err(|e| e.to_string())?;
        col += 1;
        if let Some(p) = book.paginas_totales {
            sheet.write_number(row, col, p as f64).map_err(|e| e.to_string())?;
        }
        col += 1;
        if let Some(v) = book.valoracion {
            sheet.write_number(row, col, v as f64).map_err(|e| e.to_string())?;
        }
        col += 1;
        sheet
            .write_string(row, col, if book.favorito { "Sí" } else { "No" })
            .map_err(|e| e.to_string())?;
        col += 1;
        if !audio {
            sheet
                .write_string(row, col, if book.relectura { "Sí" } else { "No" })
                .map_err(|e| e.to_string())?;
            col += 1;
        }
        sheet
            .write_string(row, col, book.fechas.inicio_lectura.as_deref().unwrap_or(""))
            .map_err(|e| e.to_string())?;
        col += 1;
        sheet
            .write_string(row, col, book.fechas.fin_lectura.as_deref().unwrap_or(""))
            .map_err(|e| e.to_string())?;
        col += 1;
        sheet
            .write_string(row, col, book.isbn.as_deref().unwrap_or(""))
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Genera un único `.xlsx` con los libros en una hoja y los audiolibros en
/// otra, y lo escribe directamente en `target_path` (sin zip intermedio).
/// Reparte el array completo que manda el frontend por `formato`, igual que
/// hace `save_books` — el frontend sigue mandando siempre el estado completo
/// en memoria. Si se cancela a medias (bandera `ExportState`), no se llega a
/// escribir ningún archivo: se aborta antes del `fs::write` final.
#[tauri::command]
pub fn export_library(
    target_path: String,
    books: Vec<Book>,
    state: tauri::State<ExportState>,
) -> Result<(), String> {
    state.0.store(false, Ordering::SeqCst);
    let cancelled = state.0.as_ref();

    let (audiolibros, libros): (Vec<Book>, Vec<Book>) =
        books.into_iter().partition(|b| b.formato == FormatoLibro::Audiolibro);

    let mut workbook = Workbook::new();
    write_sheet(&mut workbook, "Libros", &libros, false, cancelled)?;
    write_sheet(&mut workbook, "Audiolibros", &audiolibros, true, cancelled)?;

    if cancelled.load(Ordering::SeqCst) {
        return Err(CANCELLED.to_string());
    }

    let xlsx_bytes = workbook.save_to_buffer().map_err(|e| e.to_string())?;
    std::fs::write(Path::new(&target_path), xlsx_bytes).map_err(|e| e.to_string())
}
