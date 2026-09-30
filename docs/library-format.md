# Almacenamiento de la biblioteca

La fuente principal es `.ananquel/library.sqlite3` dentro del anaquel.
Contiene dos tablas: `books` (libros) y `audiobooks` (audiolibros).
Cada dato se lee y escribe en su columna; no se guardan documentos JSON en SQLite.

| Columnas | Contenido |
|---|---|
| id, position | Identificador estable y orden |
| titulo, autor | Texto obligatorio |
| isbn, portada | ISBN y ruta relativa de portada; pueden ser NULL |
| estado | pendiente, leyendo, leido o abandonado |
| formato | libro en books; audiolibro en audiobooks |
| valoracion | Entero entre 1 y 10; NULL significa sin valorar |
| comprar_fisico, relectura | Indicadores booleanos |
| duracion_min | Duración de audiolibros en minutos; opcional |
| comentarios | Texto libre opcional |
| anadido, inicio_lectura, fin_lectura | Fechas YYYY-MM-DD; inicio y fin opcionales |

La interfaz muestra «Escuchando» y «Escuchado» para los audiolibros.
«Pendiente» tiene el mismo nombre para ambos tipos. La búsqueda usa título y autor;
la ordenación usa título, autor, valoración y estado. El Excel contiene hojas
separadas para libros y audiolibros con puntuación numérica.

## Migración y respaldo

El esquema simplificado usa `PRAGMA user_version = 3`. La migración es transaccional:
convierte los datos y actualiza su versión en la misma operación.
Antes de migrar una base existente se crea un respaldo SQLite consistente en
`.ananquel/backups/before-simplification-<marca temporal>.sqlite3`.

- Las notas anteriores de 1–5 se multiplican por dos (4 pasa a 8); NULL sigue siendo NULL.
- Los estados antiguos «quiero_leer» y «pospuesto» pasan a «pendiente».
- Los tipos antiguos físico, ebook y comprar pasan a libro.
- Se eliminan del esquema activo saga, favorito, editorial y páginas.
- Se admite importar la primera versión SQLite que guardaba una columna JSON.
- Los JSON anteriores se importan una sola vez y se conservan como respaldo.
  El marcador histórico `ratingMigrated` permite distinguir su escala 1–5 de la escala antigua 0–10.

Los JSON de libros son copias históricas, no se actualizan al editar la biblioteca.
La tabla `metadata` guarda marcadores internos de migración.
La configuración visual y la clave de Google Books continúan en `.ananquel/config.json`.
Las portadas permanecen en `.ananquel/covers/`.

Para copiar o sincronizar una biblioteca, cierra la aplicación en ambos dispositivos
y copia el anaquel completo. No edites la misma biblioteca simultáneamente desde dos equipos.

## Comprobación y recuperación de la actualización 0.5.0

Antes de instalar, ejecutar `npm run build` y `cargo test --lib` desde `src-tauri`.
Tras abrir la versión nueva, comprobar que se mantienen los recuentos de libros y
audiolibros, que `PRAGMA integrity_check` devuelve `ok` y que existe el respaldo.
Las pruebas cubren migración JSON y SQLite, conversión de notas una sola vez,
guardado, cambio de tipo, borrado y reversión de una migración fallida.

Si falla la carga o no coinciden los registros, cerrar la app y conservar una copia
de todo el anaquel antes de intentar recuperar nada. No abrir la base de esquema 3
con versiones antiguas. Recuperar el respaldo anterior en una carpeta nueva y usar
la versión compatible con ese respaldo. La versión 0.4.0 publicada usaba JSON:
volver a ella requiere los JSON históricos y no incluirá las ediciones posteriores
hechas en SQLite. No sobrescribir el único ejemplar de la biblioteca para retroceder.
