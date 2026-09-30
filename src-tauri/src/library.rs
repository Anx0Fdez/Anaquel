use std::fs;
use std::path::Path;

use rusqlite::{params, Connection, OptionalExtension, TransactionBehavior};
use serde::{Deserialize, Serialize};

const ANANQUEL_DIR: &str = ".ananquel";
const DATABASE_FILE: &str = "library.sqlite3";
const LIBRARY_FILE: &str = "mybooks.json";
const AUDIOBOOKS_FILE: &str = "myaudiobooks.json";
const LEGACY_LIBRARY_FILE: &str = "library.json";
const LEGACY_AUDIOBOOKS_FILE: &str = "audiobooks.json";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum EstadoLectura {
    #[serde(alias = "quiero_leer", alias = "pospuesto")]
    Pendiente,
    Leido,
    Abandonado,
    #[serde(other)]
    Leyendo,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum FormatoLibro {
    #[serde(alias = "fisico", alias = "ebook", alias = "comprar")]
    Libro,
    Audiolibro,
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
    #[serde(default, deserialize_with = "deserialize_valoracion")]
    pub valoracion: Option<u8>,
    #[serde(default)]
    pub comprar_fisico: bool,
    #[serde(default)]
    pub relectura: bool,
    #[serde(default)]
    pub comentarios: Option<String>,
    pub fechas: Fechas,
}

fn deserialize_valoracion<'de, D>(deserializer: D) -> Result<Option<u8>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let raw = Option::<f64>::deserialize(deserializer)?;
    Ok(raw.map(|v| v.round().clamp(0.0, 255.0) as u8))
}

const COLUMNS: &str = "id, position, titulo, autor, isbn, portada, estado, formato, valoracion,
    comprar_fisico, relectura, comentarios, anadido, inicio_lectura, fin_lectura";
const SCHEMA: &str = "
    id TEXT PRIMARY KEY NOT NULL, position INTEGER NOT NULL,
    titulo TEXT NOT NULL, autor TEXT NOT NULL, isbn TEXT, portada TEXT,
    estado TEXT NOT NULL CHECK(estado IN ('pendiente','leyendo','leido','abandonado')),
    formato TEXT NOT NULL CHECK(formato IN ('libro','audiolibro')),
    valoracion INTEGER CHECK(valoracion BETWEEN 1 AND 10),
    comprar_fisico INTEGER NOT NULL, relectura INTEGER NOT NULL,
    comentarios TEXT, anadido TEXT NOT NULL, inicio_lectura TEXT, fin_lectura TEXT";

fn has_column(conn: &Connection, table: &str, column: &str) -> Result<bool, String> {
    let mut stmt = conn
        .prepare(&format!("PRAGMA table_info({table})"))
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|e| e.to_string())?;
    for row in rows {
        if row.map_err(|e| e.to_string())? == column {
            return Ok(true);
        }
    }
    Ok(false)
}

fn create_tables(conn: &Connection) -> Result<(), String> {
    for (table, kind) in [("books", "libro"), ("audiobooks", "audiolibro")] {
        conn.execute_batch(&format!(
            "CREATE TABLE IF NOT EXISTS {table} ({SCHEMA},
            CHECK(formato = '{kind}'));
            CREATE INDEX IF NOT EXISTS idx_{table}_titulo ON {table}(titulo);
            CREATE INDEX IF NOT EXISTS idx_{table}_autor ON {table}(autor);"
        ))
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn estado_db(v: &EstadoLectura) -> &'static str {
    match v {
        EstadoLectura::Pendiente => "pendiente",
        EstadoLectura::Leyendo => "leyendo",
        EstadoLectura::Leido => "leido",
        EstadoLectura::Abandonado => "abandonado",
    }
}
fn formato_db(v: &FormatoLibro) -> &'static str {
    match v {
        FormatoLibro::Libro => "libro",
        FormatoLibro::Audiolibro => "audiolibro",
    }
}
fn insert_books(conn: &Connection, books: &[Book]) -> Result<(), String> {
    for (position, b) in books.iter().enumerate() {
        let table = if b.formato == FormatoLibro::Audiolibro {
            "audiobooks"
        } else {
            "books"
        };
        conn.execute(
            &format!(
            "INSERT INTO {table} ({COLUMNS})
            VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15)"
            ),
            params![
                b.id,
                position as i64,
                b.titulo,
                b.autor,
                b.isbn,
                b.portada,
                estado_db(&b.estado),
                formato_db(&b.formato),
                b.valoracion,
                b.comprar_fisico,
                b.relectura,
                b.comentarios,
                b.fechas.anadido,
                b.fechas.inicio_lectura,
                b.fechas.fin_lectura
            ],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn read_database_books(conn: &Connection) -> Result<Vec<Book>, String> {
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {COLUMNS} FROM books UNION ALL
        SELECT {COLUMNS} FROM audiobooks ORDER BY position, id"
        ))
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |r| {
            let estado: String = r.get(6)?;
            let formato: String = r.get(7)?;
            Ok(Book {
                id: r.get(0)?,
                titulo: r.get(2)?,
                autor: r.get(3)?,
                isbn: r.get(4)?,
                portada: r.get(5)?,
                estado: match estado.as_str() {
                    "pendiente" => EstadoLectura::Pendiente,
                    "leyendo" => EstadoLectura::Leyendo,
                    "leido" => EstadoLectura::Leido,
                    "abandonado" => EstadoLectura::Abandonado,
                    _ => return Err(rusqlite::Error::InvalidQuery),
                },
                formato: match formato.as_str() {
                    "libro" => FormatoLibro::Libro,
                    "audiolibro" => FormatoLibro::Audiolibro,
                    _ => return Err(rusqlite::Error::InvalidQuery),
                },
                valoracion: r.get(8)?,
                comprar_fisico: r.get(9)?,
                relectura: r.get(10)?,
                comentarios: r.get(11)?,
                fechas: Fechas {
                    anadido: r.get(12)?,
                    inicio_lectura: r.get(13)?,
                    fin_lectura: r.get(14)?,
                },
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

// Solo se leen JSON para importar bibliotecas anteriores; nunca se actualizan.
fn import_json_books(path: &str) -> Result<Vec<Book>, String> {
    let root = Path::new(path);
    let mut books = Vec::new();
    for (current, legacy) in [
        (LIBRARY_FILE, LEGACY_LIBRARY_FILE),
        (AUDIOBOOKS_FILE, LEGACY_AUDIOBOOKS_FILE),
    ] {
        let candidates = [
            root.join(current),
            root.join(ANANQUEL_DIR).join(current),
            root.join(ANANQUEL_DIR).join(legacy),
        ];
        if let Some(source) = candidates.iter().find(|p| p.exists()) {
            let raw = fs::read_to_string(source).map_err(|e| e.to_string())?;
            let imported: Vec<Book> =
                serde_json::from_str(&raw).map_err(|e| format!("{}: {e}", source.display()))?;
            let backup = root.join(ANANQUEL_DIR).join("backups");
            fs::create_dir_all(&backup).map_err(|e| e.to_string())?;
            let target = backup.join(current);
            if !target.exists() {
                fs::copy(source, target).map_err(|e| e.to_string())?;
            }
            books.extend(imported);
        }
    }
    Ok(books)
}
fn read_legacy_json_table(conn: &Connection, table: &str) -> Result<Vec<Book>, String> {
    let mut stmt = conn
        .prepare(&format!("SELECT data FROM {table} ORDER BY position, id"))
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |r| r.get::<_, String>(0))
        .map_err(|e| e.to_string())?;
    rows.map(|r| serde_json::from_str(&r.map_err(|e| e.to_string())?).map_err(|e| e.to_string()))
        .collect()
}
fn convert_ratings(books: &mut [Book], five_point: bool) {
    for b in books {
        b.valoracion = b.valoracion.map(|v| {
            if five_point {
                v.saturating_mul(2).clamp(1, 10)
            } else {
                v.clamp(1, 10)
            }
        });
    }
}

/// Todo el cambio de esquema y su marcador se confirman en una transacción.
fn migrate(conn: &mut Connection, path: &str) -> Result<(), String> {
    let version: i64 = conn
        .query_row("PRAGMA user_version", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    if version == 4 {
        return Ok(());
    }
    if version > 4 {
        return Err("Esta biblioteca requiere una versión más reciente de Anaquel.".into());
    }
    let tx = conn
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(|e| e.to_string())?;
    let version: i64 = tx
        .query_row("PRAGMA user_version", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    if version == 4 {
        return tx.commit().map_err(|e| e.to_string());
    }
    tx.execute_batch(
        "CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);",
    )
    .map_err(|e| e.to_string())?;
    let old_json = if has_column(&tx, "legacy_books_json", "data")? {
        Some("legacy_books_json")
    } else if has_column(&tx, "books", "data")? {
        Some("books")
    } else {
        None
    };
    if let Some(table) = old_json {
        let mut books = read_legacy_json_table(&tx, table)?;
        convert_ratings(&mut books, true);
        tx.execute_batch("DROP TABLE IF EXISTS books; DROP TABLE IF EXISTS audiobooks; DROP TABLE IF EXISTS legacy_books_json;")
            .map_err(|e| e.to_string())?;
        create_tables(&tx)?;
        insert_books(&tx, &books)?;
    } else if has_column(&tx, "books", "editorial")?
        || has_column(&tx, "books", "duracion_min")?
    {
        // El esquema anterior 1–5 convierte las notas; el esquema 3 ya usa 1–10.
        let rating_expr = if version == 3 {
            "CASE WHEN valoracion IS NULL THEN NULL ELSE max(1,min(10,valoracion)) END"
        } else {
            "CASE WHEN valoracion IS NULL THEN NULL ELSE max(1,min(10,valoracion*2)) END"
        };
        for table in ["books", "audiobooks"] {
            tx.execute_batch(&format!("ALTER TABLE {table} RENAME TO old_{table};"))
                .map_err(|e| e.to_string())?;
        }
        create_tables(&tx)?;
        for (table, kind) in [("books", "libro"), ("audiobooks", "audiolibro")] {
            tx.execute_batch(&format!("INSERT INTO {table} ({COLUMNS})
                SELECT id, position, titulo, autor, isbn, portada,
                    CASE WHEN estado IN ('quiero_leer','pospuesto') THEN 'pendiente' ELSE estado END,
                    '{kind}', {rating_expr},
                    comprar_fisico, relectura, comentarios, anadido, inicio_lectura, fin_lectura
                FROM old_{table};
                DROP TABLE old_{table};")).map_err(|e| e.to_string())?;
        }
        create_tables(&tx)?; // Recrea índices cuyos nombres pertenecían a las tablas antiguas.
    } else {
        create_tables(&tx)?;
        let imported: Option<String> = tx
            .query_row(
                "SELECT value FROM metadata WHERE key='json_migrated'",
                [],
                |r| r.get(0),
            )
            .optional()
            .map_err(|e| e.to_string())?;
        if imported.is_none() {
            let mut books = import_json_books(path)?;
            convert_ratings(&mut books, crate::vault::read_config(path).rating_migrated);
            insert_books(&tx, &books)?;
        }
    }
    tx.execute_batch(
        "INSERT OR REPLACE INTO metadata VALUES ('json_migrated','1'); PRAGMA user_version=4;",
    )
    .map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())
}

fn open_database(path: &str) -> Result<Connection, String> {
    let dir = Path::new(path).join(ANANQUEL_DIR);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let db = dir.join(DATABASE_FILE);
    let existed = db.exists();
    let mut conn = Connection::open(&db).map_err(|e| e.to_string())?;
    conn.busy_timeout(std::time::Duration::from_secs(5))
        .map_err(|e| e.to_string())?;
    let version: i64 = conn
        .query_row("PRAGMA user_version", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    if existed && version < 4 {
        let backup = dir.join("backups");
        fs::create_dir_all(&backup).map_err(|e| e.to_string())?;
        let backup = backup.join(format!(
            "before-simplification-{}.sqlite3",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map_err(|e| e.to_string())?
                .as_nanos()
        ));
        conn.execute("VACUUM INTO ?1", params![backup.to_string_lossy()])
            .map_err(|e| e.to_string())?;
    }
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;")
        .map_err(|e| e.to_string())?;
    migrate(&mut conn, path)?;
    Ok(conn)
}

#[tauri::command]
pub fn load_books(path: String) -> Result<Vec<Book>, String> {
    read_database_books(&open_database(&path)?)
}

#[tauri::command]
pub fn save_books(path: String, books: Vec<Book>) -> Result<(), String> {
    let mut conn = open_database(&path)?;
    let tx = conn
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(|e| e.to_string())?;
    tx.execute_batch("DELETE FROM books; DELETE FROM audiobooks;")
        .map_err(|e| e.to_string())?;
    insert_books(&tx, &books)?;
    tx.commit().map_err(|e| e.to_string())
}
#[cfg(test)]
mod tests {
    use super::*;
    const OLD_SCHEMA: &str = "\n    id TEXT PRIMARY KEY NOT NULL,\n    position INTEGER NOT NULL,\n    titulo TEXT NOT NULL,\n    autor TEXT NOT NULL,\n    isbn TEXT,\n    portada TEXT,\n    estado TEXT NOT NULL,\n    formato TEXT NOT NULL,\n    editorial TEXT,\n    valoracion INTEGER,\n    favorito INTEGER NOT NULL DEFAULT 0,\n    comprar_fisico INTEGER NOT NULL DEFAULT 0,\n    relectura INTEGER NOT NULL DEFAULT 0,\n    paginas_totales INTEGER,\n    duracion_min INTEGER,\n    comentarios TEXT,\n    saga_nombre TEXT,\n    saga_numero INTEGER,\n    saga_total_libros INTEGER,\n    anadido TEXT NOT NULL,\n    inicio_lectura TEXT,\n    fin_lectura TEXT";

    fn sample(id: &str, audio: bool) -> Book {
        Book {
            id: id.into(),
            titulo: "Título ñ".into(),
            autor: "Autor".into(),
            isbn: Some("123".into()),
            portada: Some("covers/test.jpg".into()),
            estado: EstadoLectura::Pendiente,
            formato: if audio {
                FormatoLibro::Audiolibro
            } else {
                FormatoLibro::Libro
            },
            valoracion: Some(7),
            comprar_fisico: audio,
            relectura: !audio,
            comentarios: Some("Comentario".into()),
            fechas: Fechas {
                anadido: "2026-09-30".into(),
                inicio_lectura: None,
                fin_lectura: Some("2026-10-01".into()),
            },
        }
    }
    fn old_database() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        for table in ["books", "audiobooks"] {
            conn.execute_batch(&format!("CREATE TABLE {table} ({OLD_SCHEMA});"))
                .unwrap();
        }
        conn.execute_batch(
            "CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT);
            INSERT INTO metadata VALUES ('json_migrated','1');",
        )
        .unwrap();
        conn
    }
    fn old_row(
        conn: &Connection,
        table: &str,
        id: &str,
        estado: &str,
        formato: &str,
        rating: Option<u8>,
    ) {
        conn.execute(&format!("INSERT INTO {table}
            (id,position,titulo,autor,estado,formato,valoracion,anadido,editorial,saga_nombre,favorito,paginas_totales)
            VALUES (?1,0,'Título','Autor',?2,?3,?4,'2026-01-01','Editorial','Saga',1,100)"),
            params![id,estado,formato,rating]).unwrap();
    }
    #[test]
    fn normalized_migration_converts_once_and_removes_columns() {
        let mut c = old_database();
        old_row(&c, "books", "b", "quiero_leer", "ebook", Some(4));
        old_row(&c, "audiobooks", "a", "pospuesto", "audiolibro", None);
        migrate(&mut c, "unused").unwrap();
        migrate(&mut c, "unused").unwrap();
        let books = read_database_books(&c).unwrap();
        assert_eq!(books.len(), 2);
        assert!(books.iter().all(|b| b.estado == EstadoLectura::Pendiente));
        assert_eq!(
            books.iter().find(|b| b.id == "b").unwrap().valoracion,
            Some(8)
        );
        assert_eq!(books.iter().find(|b| b.id == "a").unwrap().valoracion, None);
        assert_eq!(
            books.iter().find(|b| b.id == "b").unwrap().formato,
            FormatoLibro::Libro
        );
        for table in ["books", "audiobooks"] {
            for col in [
                "editorial",
                "favorito",
                "paginas_totales",
                "saga_nombre",
                "saga_numero",
                "saga_total_libros",
                "data",
            ] {
                assert!(!has_column(&c, table, col).unwrap());
            }
        }
    }
    #[test]
    fn migration_failure_rolls_back_schema_and_data() {
        let mut c = old_database();
        old_row(&c, "books", "b", "invalid", "fisico", Some(3));
        assert!(migrate(&mut c, "unused").is_err());
        assert!(has_column(&c, "books", "editorial").unwrap());
        let count: i64 = c
            .query_row("SELECT count(*) FROM books", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 1);
        let v: i64 = c
            .query_row("PRAGMA user_version", [], |r| r.get(0))
            .unwrap();
        assert_eq!(v, 0);
    }
    #[test]
    fn numeric_roundtrip_and_constraints() {
        let c = Connection::open_in_memory().unwrap();
        create_tables(&c).unwrap();
        let mut b = sample("b", false);
        b.valoracion = Some(1);
        let mut a = sample("a", true);
        a.valoracion = Some(10);
        let input = vec![b, a];
        insert_books(&c, &input).unwrap();
        assert_eq!(
            serde_json::to_value(read_database_books(&c).unwrap()).unwrap(),
            serde_json::to_value(&input).unwrap()
        );
        assert!(c.execute("UPDATE books SET valoracion=11", []).is_err());
        assert!(c.execute("UPDATE books SET valoracion=0", []).is_err());
        assert!(c.execute("UPDATE books SET formato='ebook'", []).is_err());
        assert!(c
            .execute("UPDATE books SET estado='pospuesto'", [])
            .is_err());
    }
    #[test]
    fn json_column_migration_preserves_latest_data() {
        let mut c = Connection::open_in_memory().unwrap();
        c.execute_batch(
            "CREATE TABLE books (id TEXT PRIMARY KEY, position INTEGER, formato TEXT, data TEXT);",
        )
        .unwrap();
        let mut b = sample("b", false);
        b.valoracion = Some(5);
        let mut value = serde_json::to_value(b).unwrap();
        value["formato"] = serde_json::json!("comprar");
        value["estado"] = serde_json::json!("pospuesto");
        c.execute(
            "INSERT INTO books VALUES ('b',0,'comprar',?1)",
            params![value.to_string()],
        )
        .unwrap();
        migrate(&mut c, "unused").unwrap();
        let result = read_database_books(&c).unwrap();
        assert_eq!(result[0].valoracion, Some(10));
        assert_eq!(result[0].formato, FormatoLibro::Libro);
        assert!(!has_column(&c, "books", "data").unwrap());
    }
    #[test]
    fn rating_conversion_preserves_historical_ten_point_scale() {
        let mut b = sample("b", false);
        b.valoracion = Some(9);
        convert_ratings(std::slice::from_mut(&mut b), false);
        assert_eq!(b.valoracion, Some(9));
    }

    struct TempVault(std::path::PathBuf);
    impl TempVault {
        fn new() -> Self {
            let p = std::env::temp_dir().join(format!(
                "anaquel-simplification-{}-{}",
                std::process::id(),
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_nanos()
            ));
            fs::create_dir_all(p.join(ANANQUEL_DIR)).unwrap();
            Self(p)
        }
        fn path(&self) -> String {
            self.0.to_string_lossy().into_owned()
        }
    }
    impl Drop for TempVault {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    #[test]
    fn fresh_json_import_save_reload_move_delete_and_backup() {
        let v = TempVault::new();
        let mut b = sample("b", false);
        b.valoracion = Some(4);
        let raw = serde_json::to_string(&vec![b]).unwrap();
        fs::write(v.0.join(LIBRARY_FILE), &raw).unwrap();
        let mut books = load_books(v.path()).unwrap();
        assert_eq!(books[0].valoracion, Some(8));
        books[0].formato = FormatoLibro::Audiolibro;
        books[0].valoracion = Some(7);
        save_books(v.path(), books).unwrap();
        assert_eq!(load_books(v.path()).unwrap()[0].valoracion, Some(7));
        assert_eq!(fs::read_to_string(v.0.join(LIBRARY_FILE)).unwrap(), raw);
        assert_eq!(
            fs::read_to_string(v.0.join(ANANQUEL_DIR).join("backups").join(LIBRARY_FILE)).unwrap(),
            raw
        );
        save_books(v.path(), vec![]).unwrap();
        assert!(load_books(v.path()).unwrap().is_empty());
    }
    #[test]
    fn sqlite_backup_contains_removed_fields() {
        let v = TempVault::new();
        let c = Connection::open(v.0.join(ANANQUEL_DIR).join(DATABASE_FILE)).unwrap();
        for t in ["books", "audiobooks"] {
            c.execute_batch(&format!("CREATE TABLE {t} ({OLD_SCHEMA});"))
                .unwrap();
        }
        old_row(&c, "books", "b", "leido", "fisico", Some(5));
        drop(c);
        assert_eq!(load_books(v.path()).unwrap()[0].valoracion, Some(10));
        let backup = fs::read_dir(v.0.join(ANANQUEL_DIR).join("backups"))
            .unwrap()
            .next()
            .unwrap()
            .unwrap()
            .path();
        let backup = Connection::open(backup).unwrap();
        assert!(has_column(&backup, "books", "editorial").unwrap());
        let score: i64 = backup
            .query_row("SELECT valoracion FROM books", [], |r| r.get(0))
            .unwrap();
        assert_eq!(score, 5);
    }
}
