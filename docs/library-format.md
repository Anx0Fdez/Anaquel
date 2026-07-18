# Formato de la biblioteca

Cada anaquel (vault) es una carpeta cualquiera de tu sistema de archivos.
`mybooks.json` y `myaudiobooks.json` viven en la **raíz** del vault, visibles
igual que las notas de un vault de Obsidian — son tus datos. La subcarpeta
oculta `.ananquel/` se reserva solo para lo que la app gestiona internamente
(ajustes y portadas descargadas):

```
mi-biblioteca/
├── mybooks.json       # libros físicos y ebooks
├── myaudiobooks.json  # audiolibros (formato: "audiolibro")
└── .ananquel/
    ├── config.json    # tema, última vista, orden de anaqueles, tamaño de ventana, color
    │                  # de acento, orden de biblioteca por defecto, última biblioteca activa,
    │                  # tamaño de portada en cuadrícula
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
    "isbn13": "9788401352836",
    "portada": "covers/550e8400.jpg",
    "estado": "leyendo",
    "formato": "fisico",
    "idioma": "es",
    "editorial": "Plaza & Janés",
    "etiquetas": ["saga", "favorito"],
    "valoracion": 9,
    "favorito": true,
    "comprar_fisico": false,
    "relectura": false,
    "progreso": {
      "paginas_totales": 662
    },
    "saga": { "nombre": "Crónica del asesino de reyes", "numero": 1, "total_libros": 3 },
    "fechas": { "añadido": "2026-06-01", "inicio_lectura": "2026-06-20", "fin_lectura": null }
  }
]
```

## Notas de diseño

- **Todos los campos son opcionales excepto `id`, `titulo` y `autor`.**
- **`estado` no depende de `formato`**: un audiolibro puede estar `quiero_leer`
  antes de empezarlo. `audiolibro` como estado es el filtro rápido de "lo que
  estoy escuchando ahora mismo" (equivalente a `leyendo` pero para audio).
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
- **`progreso` solo guarda `paginas_totales`**: es el único dato de progreso
  con UI propia (se muestra en la ficha del libro, en la tabla y en el
  export), y también lo usan las estadísticas anuales — así no hay dos sitios
  que puedan desincronizarse.
- **`valoracion` va de 0 a 10 en pasos de 0.5** y se edita con un slider, no
  escribiendo el número.
- **Autocompletado por ISBN**: al escribir un ISBN válido (10 o 13 dígitos) en
  el diálogo de añadir libro o en la ficha de un libro existente, la app
  consulta Open Library y, si no encuentra nada, Google Books como respaldo
  (`src-tauri/src/metadata.rs`), y rellena los campos que estén vacíos —nunca
  pisa datos que el usuario ya haya escrito. La portada encontrada se
  descarga y se guarda en `covers/`, nunca como URL externa: si falla la
  búsqueda o no hay conexión, no pasa nada visible, simplemente no se rellena
  nada.
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
