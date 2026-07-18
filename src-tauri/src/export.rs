use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use rust_xlsxwriter::{
    ConditionalFormatDataBar, ConditionalFormatText, ConditionalFormatTextRule,
    ConditionalFormatType, ExcelDateTime, Format, FormatAlign, FormatBorder, Table, TableColumn,
    TableStyle, Workbook,
};

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

/// Mismo color que `--status-<estado>` de theme.css, para que la columna
/// Estado del Excel se lea igual que el StatusPill de la app.
fn status_color(is_light: bool, estado: &EstadoLectura) -> &'static str {
    match estado {
        EstadoLectura::Leyendo => {
            if is_light {
                "#3768C2"
            } else {
                "#4C86E0"
            }
        }
        EstadoLectura::Leido => {
            if is_light {
                "#2F8A5C"
            } else {
                "#4FA876"
            }
        }
        EstadoLectura::QuieroLeer => {
            if is_light {
                "#B47620"
            } else {
                "#D99A3F"
            }
        }
        EstadoLectura::Pospuesto => {
            if is_light {
                "#5A7187"
            } else {
                "#7C93A8"
            }
        }
        EstadoLectura::Audiolibro => {
            if is_light {
                "#7C5CCA"
            } else {
                "#9C7FE0"
            }
        }
        EstadoLectura::Abandonado => {
            if is_light {
                "#6E675A"
            } else {
                "#8A8378"
            }
        }
    }
}

fn hex_channels(hex: &str) -> (f32, f32, f32) {
    let h = hex.trim_start_matches('#');
    let chan = |slice: Option<&str>| u8::from_str_radix(slice.unwrap_or("00"), 16).unwrap_or(0) as f32;
    (chan(h.get(0..2)), chan(h.get(2..4)), chan(h.get(4..6)))
}

/// Mezcla `fg` sobre `bg` con la opacidad `alpha` (0..1), igual que hace
/// `color-mix()`/`rgba()` en theme.css, para derivar tintes sin tener que
/// guardar una segunda paleta de colores "-bg" a mano.
fn blend(fg: &str, bg: &str, alpha: f32) -> String {
    let (fr, fg_g, fb) = hex_channels(fg);
    let (br, bg_g, bb) = hex_channels(bg);
    let mix = |f: f32, b: f32| ((f * alpha) + (b * (1.0 - alpha))).round() as u32;
    format!("#{:02X}{:02X}{:02X}", mix(fr, br), mix(fg_g, bg_g), mix(fb, bb))
}

/// Paleta del documento, calcada de las variables `--bg`/`--accent`/... de
/// theme.css, resuelta según el tema y el color de acento activos en la app.
struct Palette {
    bg: String,
    bg_elevated: String,
    border: String,
    text: String,
    text_muted: String,
    accent: String,
    accent_text: String,
    is_light: bool,
}

impl Palette {
    fn new(theme: &str, accent_color: Option<&str>) -> Palette {
        let is_light = theme == "light";
        let bg = if is_light { "#FAF7F2" } else { "#1E1E1E" };
        let bg_elevated = if is_light { "#FFFFFF" } else { "#252525" };
        let text = if is_light { "#211C15" } else { "#DCDCDC" };
        let text_muted = if is_light { "#756D5F" } else { "#9A9A9A" };
        let default_accent = if is_light { "#C2700C" } else { "#FE9D16" };
        let border = if is_light {
            blend(text, bg, 0.10)
        } else {
            blend("#FFFFFF", bg, 0.08)
        };
        let accent = accent_color
            .filter(|c| !c.is_empty())
            .unwrap_or(default_accent)
            .to_string();

        Palette {
            bg: bg.to_string(),
            bg_elevated: bg_elevated.to_string(),
            border,
            text: text.to_string(),
            text_muted: text_muted.to_string(),
            accent,
            accent_text: "#1F1710".to_string(),
            is_light,
        }
    }
}

/// El papel visual de cada columna: decide alineación, color base y formato
/// numérico de sus celdas de datos (ver [`cell_format`]).
#[derive(Clone, Copy)]
enum Role {
    Title,
    Text,
    Muted,
    Estado,
    Number,
    Rating,
    YesNo,
    Date,
}

struct ColSpec {
    header: &'static str,
    width: f64,
    role: Role,
}

const COLS: [ColSpec; 13] = [
    ColSpec { header: "Título", width: 34.0, role: Role::Title },
    ColSpec { header: "Autor", width: 22.0, role: Role::Text },
    ColSpec { header: "Saga", width: 20.0, role: Role::Muted },
    ColSpec { header: "Estado", width: 15.0, role: Role::Estado },
    ColSpec { header: "Formato", width: 12.0, role: Role::Muted },
    ColSpec { header: "Editorial", width: 20.0, role: Role::Muted },
    ColSpec { header: "Páginas", width: 10.0, role: Role::Number },
    ColSpec { header: "Valoración", width: 13.0, role: Role::Rating },
    ColSpec { header: "Favorito", width: 10.0, role: Role::YesNo },
    ColSpec { header: "Relectura", width: 10.0, role: Role::YesNo },
    ColSpec { header: "Inicio lectura", width: 15.0, role: Role::Date },
    ColSpec { header: "Fin lectura", width: 15.0, role: Role::Date },
    ColSpec { header: "ISBN", width: 16.0, role: Role::Muted },
];

const COL_ESTADO: u16 = 3;
const COL_PAGINAS: u16 = 6;
const COL_VALORACION: u16 = 7;
const COL_FAVORITO: u16 = 8;
const COL_RELECTURA: u16 = 9;
const COL_INICIO: u16 = 10;
const COL_FIN: u16 = 11;
const LAST_COL: u16 = 12;

const ROW_TITLE: u32 = 0;
const ROW_SUBTITLE: u32 = 1;
const ROW_SPACER: u32 = 2;
const ROW_HEADER: u32 = 3;
const FIRST_DATA_ROW: u32 = ROW_HEADER + 1;

/// Formato base (banda + color + alineación + formato numérico) para una
/// celda de datos. `banded` alterna entre `bg` y `bg_elevated` fila a fila,
/// igual que el listado hace con CSS puro; el formato condicional se añade
/// encima para Estado/Favorito/Relectura/Valoración.
fn cell_format(pal: &Palette, role: Role, banded: bool) -> Format {
    let band_bg = if banded { pal.bg_elevated.as_str() } else { pal.bg.as_str() };
    let mut fmt = Format::new()
        .set_background_color(band_bg)
        .set_border_bottom(FormatBorder::Thin)
        .set_border_bottom_color(pal.border.as_str())
        .set_align(FormatAlign::VerticalCenter);

    fmt = match role {
        Role::Title => fmt.set_font_color(pal.text.as_str()).set_bold().set_align(FormatAlign::Left),
        Role::Text | Role::Estado => fmt.set_font_color(pal.text.as_str()).set_align(FormatAlign::Left),
        Role::Muted => fmt.set_font_color(pal.text_muted.as_str()).set_align(FormatAlign::Left),
        Role::Number => fmt
            .set_font_color(pal.text_muted.as_str())
            .set_align(FormatAlign::Right)
            .set_num_format("#,##0"),
        Role::Rating => fmt.set_font_color(pal.text.as_str()).set_align(FormatAlign::Center),
        Role::YesNo => fmt.set_font_color(pal.text_muted.as_str()).set_align(FormatAlign::Center),
        Role::Date => fmt
            .set_font_color(pal.text_muted.as_str())
            .set_align(FormatAlign::Center)
            .set_num_format("dd/mm/yyyy"),
    };

    fmt
}

fn write_date_cell(
    sheet: &mut rust_xlsxwriter::Worksheet,
    row: u32,
    col: u16,
    iso: Option<&str>,
    format: &Format,
) -> Result<(), String> {
    let Some(iso) = iso else {
        return sheet.write_blank(row, col, format).map(|_| ()).map_err(|e| e.to_string());
    };
    let parts: Vec<&str> = iso.split('-').collect();
    let parsed = match parts.as_slice() {
        [y, m, d] => y.parse::<u16>().ok().zip(m.parse::<u8>().ok()).zip(d.parse::<u8>().ok()),
        _ => None,
    };
    let Some(((y, m), d)) = parsed else {
        return sheet.write_blank(row, col, format).map(|_| ()).map_err(|e| e.to_string());
    };
    let Ok(date) = ExcelDateTime::from_ymd(y, m, d) else {
        return sheet.write_blank(row, col, format).map(|_| ()).map_err(|e| e.to_string());
    };
    sheet
        .write_date_with_format(row, col, date, format)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

const CANCELLED: &str = "cancelado";

fn write_sheet(
    workbook: &mut Workbook,
    name: &str,
    title: &str,
    books: &[Book],
    pal: &Palette,
    cancelled: &AtomicBool,
) -> Result<(), String> {
    let sheet = workbook.add_worksheet();
    sheet.set_name(name).map_err(|e| e.to_string())?;
    sheet.set_screen_gridlines(false);
    sheet.set_tab_color(pal.accent.as_str());

    for (i, col) in COLS.iter().enumerate() {
        sheet.set_column_width(i as u16, col.width).map_err(|e| e.to_string())?;
    }

    // Banner: título + subtítulo, con el fondo del tema para que el bloque
    // entero se sienta como una "tarjeta" coherente con la app.
    let title_fmt = Format::new()
        .set_background_color(pal.accent.as_str())
        .set_font_color(pal.accent_text.as_str())
        .set_bold()
        .set_font_size(15)
        .set_align(FormatAlign::Left)
        .set_align(FormatAlign::VerticalCenter)
        .set_indent(1);
    sheet
        .merge_range(ROW_TITLE, 0, ROW_TITLE, LAST_COL, title, &title_fmt)
        .map_err(|e| e.to_string())?;
    sheet.set_row_height(ROW_TITLE, 30).map_err(|e| e.to_string())?;

    let subtitle = match books.len() {
        0 => "Sin ejemplares todavía".to_string(),
        1 => "1 ejemplar en tu Anaquel".to_string(),
        n => format!("{n} ejemplares en tu Anaquel"),
    };
    let subtitle_fmt = Format::new()
        .set_background_color(pal.bg_elevated.as_str())
        .set_font_color(pal.text_muted.as_str())
        .set_align(FormatAlign::Left)
        .set_align(FormatAlign::VerticalCenter)
        .set_indent(1);
    sheet
        .merge_range(ROW_SUBTITLE, 0, ROW_SUBTITLE, LAST_COL, &subtitle, &subtitle_fmt)
        .map_err(|e| e.to_string())?;
    sheet.set_row_height(ROW_SUBTITLE, 20).map_err(|e| e.to_string())?;

    let spacer_fmt = Format::new().set_background_color(pal.bg.as_str());
    sheet
        .merge_range(ROW_SPACER, 0, ROW_SPACER, LAST_COL, "", &spacer_fmt)
        .map_err(|e| e.to_string())?;
    sheet.set_row_height(ROW_SPACER, 8).map_err(|e| e.to_string())?;

    let header_fmt_left = Format::new()
        .set_background_color(pal.accent.as_str())
        .set_font_color(pal.accent_text.as_str())
        .set_bold()
        .set_align(FormatAlign::Left)
        .set_align(FormatAlign::VerticalCenter)
        .set_border_bottom(FormatBorder::Medium)
        .set_border_bottom_color(pal.accent_text.as_str());
    let header_fmt_center = header_fmt_left.clone().set_align(FormatAlign::Center);

    if books.is_empty() {
        for (i, col) in COLS.iter().enumerate() {
            let fmt = match col.role {
                Role::Number | Role::Rating | Role::YesNo | Role::Date => &header_fmt_center,
                _ => &header_fmt_left,
            };
            sheet
                .write_string_with_format(ROW_HEADER, i as u16, col.header, fmt)
                .map_err(|e| e.to_string())?;
        }
        sheet.set_freeze_panes(FIRST_DATA_ROW, 1).map_err(|e| e.to_string())?;
        return Ok(());
    }

    for (i, book) in books.iter().enumerate() {
        if cancelled.load(Ordering::SeqCst) {
            return Err(CANCELLED.to_string());
        }
        let row = FIRST_DATA_ROW + i as u32;
        let banded = i % 2 == 1;
        let saga = book
            .saga
            .as_ref()
            .map(|s| format!("{} #{}", s.nombre, s.numero))
            .unwrap_or_default();

        sheet
            .write_string_with_format(row, 0, &book.titulo, &cell_format(pal, Role::Title, banded))
            .map_err(|e| e.to_string())?;
        sheet
            .write_string_with_format(row, 1, &book.autor, &cell_format(pal, Role::Text, banded))
            .map_err(|e| e.to_string())?;
        sheet
            .write_string_with_format(row, 2, &saga, &cell_format(pal, Role::Muted, banded))
            .map_err(|e| e.to_string())?;
        sheet
            .write_string_with_format(row, COL_ESTADO, estado_label(&book.estado), &cell_format(pal, Role::Estado, banded))
            .map_err(|e| e.to_string())?;
        sheet
            .write_string_with_format(row, 4, formato_label(&book.formato), &cell_format(pal, Role::Muted, banded))
            .map_err(|e| e.to_string())?;
        sheet
            .write_string_with_format(row, 5, book.editorial.as_deref().unwrap_or(""), &cell_format(pal, Role::Muted, banded))
            .map_err(|e| e.to_string())?;

        let number_fmt = cell_format(pal, Role::Number, banded);
        match book.progreso.paginas_totales {
            Some(p) => sheet.write_number_with_format(row, COL_PAGINAS, p as f64, &number_fmt),
            None => sheet.write_blank(row, COL_PAGINAS, &number_fmt),
        }
        .map_err(|e| e.to_string())?;

        let rating_fmt = cell_format(pal, Role::Rating, banded);
        match book.valoracion {
            Some(v) => sheet.write_number_with_format(row, COL_VALORACION, v as f64, &rating_fmt),
            None => sheet.write_blank(row, COL_VALORACION, &rating_fmt),
        }
        .map_err(|e| e.to_string())?;

        sheet
            .write_string_with_format(
                row,
                COL_FAVORITO,
                if book.favorito { "Sí" } else { "No" },
                &cell_format(pal, Role::YesNo, banded),
            )
            .map_err(|e| e.to_string())?;
        sheet
            .write_string_with_format(
                row,
                COL_RELECTURA,
                if book.relectura { "Sí" } else { "No" },
                &cell_format(pal, Role::YesNo, banded),
            )
            .map_err(|e| e.to_string())?;

        let date_fmt = cell_format(pal, Role::Date, banded);
        write_date_cell(sheet, row, COL_INICIO, book.fechas.inicio_lectura.as_deref(), &date_fmt)?;
        write_date_cell(sheet, row, COL_FIN, book.fechas.fin_lectura.as_deref(), &date_fmt)?;

        sheet
            .write_string_with_format(row, LAST_COL, book.isbn.as_deref().unwrap_or(""), &cell_format(pal, Role::Muted, banded))
            .map_err(|e| e.to_string())?;
    }

    let last_row = FIRST_DATA_ROW + books.len() as u32 - 1;

    let columns: Vec<TableColumn> = COLS
        .iter()
        .map(|col| {
            let header_fmt = match col.role {
                Role::Number | Role::Rating | Role::YesNo | Role::Date => header_fmt_center.clone(),
                _ => header_fmt_left.clone(),
            };
            TableColumn::new().set_header(col.header).set_header_format(header_fmt)
        })
        .collect();

    let table = Table::new()
        .set_name(name)
        .set_columns(&columns)
        .set_style(TableStyle::None)
        .set_banded_rows(false)
        .set_autofilter(true);
    sheet
        .add_table(ROW_HEADER, 0, last_row, LAST_COL, &table)
        .map_err(|e| e.to_string())?;

    // Formato condicional: colorea Estado/Favorito/Relectura como los
    // indicadores de la app, y añade una barra de progreso a Valoración.
    for estado in [
        EstadoLectura::QuieroLeer,
        EstadoLectura::Leyendo,
        EstadoLectura::Pospuesto,
        EstadoLectura::Leido,
        EstadoLectura::Abandonado,
        EstadoLectura::Audiolibro,
    ] {
        let color = status_color(pal.is_light, &estado);
        let tint = blend(color, pal.bg_elevated.as_str(), 0.16);
        let cf = ConditionalFormatText::new()
            .set_rule(ConditionalFormatTextRule::BeginsWith(estado_label(&estado).to_string()))
            .set_format(Format::new().set_font_color(color).set_background_color(tint.as_str()).set_bold());
        sheet
            .add_conditional_format(FIRST_DATA_ROW, COL_ESTADO, last_row, COL_ESTADO, &cf)
            .map_err(|e| e.to_string())?;
    }

    let yes_tint = blend(pal.accent.as_str(), pal.bg_elevated.as_str(), 0.18);
    let yes_fmt = Format::new().set_font_color(pal.accent.as_str()).set_background_color(yes_tint.as_str()).set_bold();
    for col in [COL_FAVORITO, COL_RELECTURA] {
        let cf = ConditionalFormatText::new()
            .set_rule(ConditionalFormatTextRule::BeginsWith("Sí".to_string()))
            .set_format(yes_fmt.clone());
        sheet
            .add_conditional_format(FIRST_DATA_ROW, col, last_row, col, &cf)
            .map_err(|e| e.to_string())?;
    }

    let data_bar = ConditionalFormatDataBar::new()
        .set_minimum(ConditionalFormatType::Number, 0)
        .set_maximum(ConditionalFormatType::Number, 10)
        .set_fill_color(pal.accent.as_str())
        .set_solid_fill(true)
        .set_border_off(true);
    sheet
        .add_conditional_format(FIRST_DATA_ROW, COL_VALORACION, last_row, COL_VALORACION, &data_bar)
        .map_err(|e| e.to_string())?;

    sheet.set_freeze_panes(FIRST_DATA_ROW, 1).map_err(|e| e.to_string())?;

    Ok(())
}

/// Genera un único `.xlsx` con los libros en una hoja y los audiolibros en
/// otra, y lo escribe directamente en `target_path` (sin zip intermedio).
/// Reparte el array completo que manda el frontend por `formato`, igual que
/// hace `save_books` — el frontend sigue mandando siempre el estado completo
/// en memoria. Si se cancela a medias (bandera `ExportState`), no se llega a
/// escribir ningún archivo: se aborta antes del `fs::write` final.
///
/// `theme`/`accent_color` reflejan las preferencias visuales activas en la
/// app (ver `VaultConfig`) para que el Excel generado se sienta a juego con
/// el tema claro/oscuro y el color de acento del vault. Ningún dato exportado
/// depende de ellos: solo cambian el aspecto del documento.
#[tauri::command]
pub fn export_library(
    target_path: String,
    books: Vec<Book>,
    theme: String,
    accent_color: Option<String>,
    state: tauri::State<ExportState>,
) -> Result<(), String> {
    state.0.store(false, Ordering::SeqCst);
    let cancelled = state.0.as_ref();
    let pal = Palette::new(&theme, accent_color.as_deref());

    let (audiolibros, libros): (Vec<Book>, Vec<Book>) =
        books.into_iter().partition(|b| b.formato == FormatoLibro::Audiolibro);

    let mut workbook = Workbook::new();
    write_sheet(&mut workbook, "Libros", "Anaquel · Biblioteca de libros", &libros, &pal, cancelled)?;
    write_sheet(&mut workbook, "Audiolibros", "Anaquel · Biblioteca de audiolibros", &audiolibros, &pal, cancelled)?;

    if cancelled.load(Ordering::SeqCst) {
        return Err(CANCELLED.to_string());
    }

    let xlsx_bytes = workbook.save_to_buffer().map_err(|e| e.to_string())?;
    std::fs::write(Path::new(&target_path), xlsx_bytes).map_err(|e| e.to_string())
}
