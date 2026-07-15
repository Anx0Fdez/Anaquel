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
        EstadoLectura::Audiolibro => "Audiolibro",
    }
}

fn formato_label(formato: &FormatoLibro) -> &'static str {
    match formato {
        FormatoLibro::Fisico => "Físico",
        FormatoLibro::Ebook => "Ebook",
        FormatoLibro::Audiolibro => "Audiolibro",
    }
}

const HEADERS: [&str; 9] = [
    "Título", "Autor", "Estado", "Formato", "Editorial", "Páginas", "Valoración", "Favorito", "ISBN",
];

const CANCELLED: &str = "cancelado";

fn write_sheet(workbook: &mut Workbook, name: &str, books: &[Book], cancelled: &AtomicBool) -> Result<(), String> {
    let sheet = workbook.add_worksheet();
    sheet.set_name(name).map_err(|e| e.to_string())?;

    let header_format = Format::new().set_bold();
    for (col, h) in HEADERS.iter().enumerate() {
        sheet
            .write_string_with_format(0, col as u16, *h, &header_format)
            .map_err(|e| e.to_string())?;
    }

    for (i, book) in books.iter().enumerate() {
        if cancelled.load(Ordering::SeqCst) {
            return Err(CANCELLED.to_string());
        }
        let row = (i + 1) as u32;
        sheet.write_string(row, 0, &book.titulo).map_err(|e| e.to_string())?;
        sheet.write_string(row, 1, &book.autor).map_err(|e| e.to_string())?;
        sheet.write_string(row, 2, estado_label(&book.estado)).map_err(|e| e.to_string())?;
        sheet.write_string(row, 3, formato_label(&book.formato)).map_err(|e| e.to_string())?;
        sheet
            .write_string(row, 4, book.editorial.as_deref().unwrap_or(""))
            .map_err(|e| e.to_string())?;
        if let Some(p) = book.progreso.paginas_totales {
            sheet.write_number(row, 5, p as f64).map_err(|e| e.to_string())?;
        }
        if let Some(v) = book.valoracion {
            sheet.write_number(row, 6, v as f64).map_err(|e| e.to_string())?;
        }
        sheet
            .write_string(row, 7, if book.favorito { "Sí" } else { "No" })
            .map_err(|e| e.to_string())?;
        sheet
            .write_string(row, 8, book.isbn.as_deref().unwrap_or(""))
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
    write_sheet(&mut workbook, "Libros", &libros, cancelled)?;
    write_sheet(&mut workbook, "Audiolibros", &audiolibros, cancelled)?;

    if cancelled.load(Ordering::SeqCst) {
        return Err(CANCELLED.to_string());
    }

    let xlsx_bytes = workbook.save_to_buffer().map_err(|e| e.to_string())?;
    std::fs::write(Path::new(&target_path), xlsx_bytes).map_err(|e| e.to_string())
}
