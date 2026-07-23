# Formato de la biblioteca

Cada anaquel (vault) es una carpeta cualquiera de tu sistema de archivos.
`mybooks.json` y `myaudiobooks.json` viven en la **raíz** del vault, visibles
igual que las notas de un vault de Obsidian — son tus datos. La subcarpeta
oculta `.ananquel/` se reserva solo para lo que la app gestiona internamente
(ajustes y portadas descargadas):

```
mi-biblioteca/
├── mybooks.json       # libros: físicos, ebooks y pendientes de comprar
├── myaudiobooks.json  # audiolibros (formato: "audiolibro")
└── .ananquel/
    ├── config.json    # tema, última vista, orden de anaqueles, tamaño de ventana, color
    │                  # de acento, orden de biblioteca por defecto, última biblioteca activa,
    │                  # tamaño de portada en cuadrícula, API key de Google Books
    └── covers/        # portadas descargadas automáticamente por ISBN, o añadidas a mano
```

Si el vault viene de una versión anterior de Anaquel con `mybooks.json`/
`myaudiobooks.json` todavía dentro de `.ananquel/`, la app los mueve a la raíz
automáticamente la primera vez que abre ese vault (un `rename`, no un
copiado, así que no puede duplicar ni perder nada).

`mybooks.json` y `myaudiobooks.json` tienen el mismo formato (un array de
libros) — el `formato` de cada libro decide a cuál de los dos archivos va, de
forma transparente para el frontend, que sigue viéndolos como un único array
unificado (la separación por archivo vive solo en `src-tauri/src/library.rs`).
El campo `id` es lo único que no debe cambiar nunca: identifica al libro de
forma estable aunque se le cambie el título.

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "titulo": "El nombre del viento",
    "autor": "Patrick Rothfuss",
    "isbn": "9788401352836",
    "portada": "covers/550e8400.jpg",
    "estado": "leyendo",
    "formato": "fisico",
    "editorial": "Plaza & Janés",
    "valoracion": 4,
    "favorito": true,
    "comprar_fisico": false,
    "relectura": false,
    "paginas_totales": 662,
    "duracion_min": null,
    "comentarios": null,
    "saga": { "nombre": "Crónica del asesino de reyes", "numero": 1, "total_libros": 3 },
    "fechas": { "añadido": "2026-06-01", "inicio_lectura": "2026-06-20", "fin_lectura": null }
  }
]
```

## Notas de diseño

- **Todos los campos son opcionales excepto `id`, `titulo` y `autor`.**
- **`estado` no depende de `formato`**: un audiolibro puede estar `quiero_leer`
  antes de empezarlo. `estado` no tiene un valor propio para audiolibros — usa
  los mismos cinco valores que un libro, solo que la interfaz les cambia la
  etiqueta ("Escuchando" en vez de "Leyendo", etc.) vía `estadoLabel()` en
  `src/types/book.ts`.
- **`formato: "comprar"`** marca un libro (no audiolibro) que todavía no se
  tiene, pendiente de comprar — a efectos de esquema es un formato más, sin
  ningún campo adicional asociado.
- **Por qué `mybooks.json`/`myaudiobooks.json` y no un `.md` por libro**: es más simple de
  mantener consistente (una sola escritura atómica por cambio) y no necesita un
  índice/caché aparte para que la búsqueda sea instantánea, a costa de que el
  archivo no se pueda editar libro a libro fuera de la app tan cómodamente como
  notas individuales de Obsidian.
- **`comprar_fisico`** solo tiene sentido cuando `formato` es `audiolibro` y
  `estado` es `leido` — la interfaz solo muestra su casilla en ese caso, pero
  el campo existe siempre (con `false` por defecto) para no complicar el
  esquema con condicionales.
- **`relectura`** marca un libro (no audiolibro) para retomarlo en el futuro;
  no depende de ningún otro campo.
- **`paginas_totales`** se muestra en la ficha del libro, es columna
  ordenable en la tabla y sale en el Excel exportado — un único campo, sin
  anidar, para que no haya dos sitios que puedan desincronizarse.
- **`duracion_min`** es el equivalente a `paginas_totales` para audiolibros
  (duración en minutos): la ficha muestra uno u otro campo según `formato`,
  nunca los dos a la vez. Solo se rellena a mano — ni Open Library ni Google
  Books devuelven duración de audiolibro, así que el autocompletado por ISBN
  no lo toca.
- **`valoracion` va de 1 a 5 estrellas enteras** (sin medias estrellas) y se
  edita pulsando una estrella (`StarRatingField`); la interfaz nunca la
  muestra como número, solo como estrellas (`StarRatingDisplay` en las
  vistas de solo lectura). `null` significa que el libro no tiene
  valoración todavía.
  - **Migración desde la escala antigua**: antes de este cambio la escala
    era 0-10 (medio punto de estrella por unidad, p. ej. `9` = 4.5★). Al
    abrir un vault creado con una versión anterior, `load_books` convierte
    automáticamente cada valor dividiéndolo entre 2 y redondeando a la
    unidad más cercana (p. ej. `9` → `5`, `7` → `4`, `1` → `1`), una única
    vez por vault — controlado por `VaultConfig.rating_migrated` en
    `config.json`, que `save_vault_config` preserva siempre desde disco para
    que ningún guardado de preferencias normal lo resetee sin querer.
- **`comentarios`** es texto libre sin formato, editado desde una ventana
  flotante propia en el panel de detalles (apartado "Comentarios"); `null`
  cuando está vacío.
- **Autocompletado por ISBN**: al escribir un ISBN válido (10 o 13 dígitos) en
  el diálogo de añadir libro o en la ficha de un libro existente, la app
  prueba primero el ISBN-13 (convirtiendo un ISBN-10 al equivalente en 13 si
  hace falta) y, si no hay resultado, cae al ISBN-10 equivalente antes de
  darlo por no encontrado — así una edición indexada solo bajo uno de los dos
  formatos igual se encuentra. Para cada candidato consulta Open Library y,
  si no encuentra nada, Google Books como respaldo (requiere una API key
  propia — ver la sección correspondiente en el [README](../README.md)),
  ambos desde `src-tauri/src/metadata.rs`. Rellena título, autor, editorial,
  páginas y portada — solo los campos que estén vacíos, nunca pisa datos que
  el usuario ya haya escrito a mano. La portada encontrada se descarga y se
  guarda en `covers/`, nunca como URL externa: si falla la búsqueda o no hay
  conexión, no pasa nada visible, simplemente no se rellena nada.
- **Multi-vault / multi-dispositivo**: como todo es texto plano, dos vaults se
  sincronizan con cualquier herramienta de archivos (Git, Syncthing, Dropbox...).
  Al abrir la misma carpeta en otro ordenador, `config.json` hace que la app se
  vea igual (mismo tema, misma vista, mismo tamaño de ventana, mismo color de
  acento) y `mybooks.json`/`myaudiobooks.json` traen todos los libros y
  audiolibros.
- **No hay campo de género**: los "anaqueles" del sidebar no son una
  categoría manual ni un género — son un filtro por año de lectura, derivado
  de `fechas.inicio_lectura` (o `fechas.fin_lectura` si no hay fecha de
  inicio). No es un campo propio del esquema, así que nunca puede
  desincronizarse.

La struct Rust equivalente vive en
[`src-tauri/src/library.rs`](../src-tauri/src/library.rs) y el tipo TypeScript
en [`src/types/book.ts`](../src/types/book.ts); ambos deben mantenerse en
sincronía con este documento.
