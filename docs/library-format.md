# Formato de la biblioteca

Cada anaquel (vault) es una carpeta cualquiera de tu sistema de archivos. Dentro,
una subcarpeta oculta `.ananquel/` es lo único que la app gestiona:

```
mi-biblioteca/
└── .ananquel/
    ├── config.json     # tema, última vista usada, orden de anaqueles
    ├── library.json     # todos los libros y audiolibros, en un único archivo
    └── covers/          # portadas descargadas o añadidas a mano
```

`library.json` es un array de libros. El campo `id` es lo único que no debe
cambiar nunca: es lo que usa `enlaces_relacionados` para referenciar un libro
aunque se le cambie el título.

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "titulo": "El nombre del viento",
    "titulo_original": "The Name of the Wind",
    "autor": "Patrick Rothfuss",
    "autores_adicionales": [],
    "isbn": "9788401352836",
    "isbn13": "9788401352836",
    "portada": "covers/550e8400.jpg",
    "estado": "leyendo",
    "formato": "fisico",
    "genero": ["Fantasía"],
    "etiquetas": ["saga", "favorito"],
    "valoracion": 5,
    "favorito": true,
    "progreso": {
      "pagina_actual": 210,
      "paginas_totales": 662,
      "porcentaje": 31,
      "ultima_lectura": "2026-07-10"
    },
    "saga": { "nombre": "Crónica del asesino de reyes", "numero": 1, "total_libros": 3 },
    "fechas": { "añadido": "2026-06-01", "inicio_lectura": "2026-06-20", "fin_lectura": null },
    "ubicacion_fisica": "Estantería salón, balda 2",
    "prestado_a": null,
    "prestado_fecha_devolucion": null,
    "ediciones": [],
    "enlaces_relacionados": [],
    "anaqueles": ["Fantasía"],
    "notas": "Notas y citas libres en texto para este libro."
  }
]
```

## Notas de diseño

- **Todos los campos son opcionales excepto `id`, `titulo` y `autor`.**
- **`estado` no depende de `formato`**: un audiolibro puede estar `quiero_leer`
  antes de empezarlo. `audiolibro` como estado es el filtro rápido de "lo que
  estoy escuchando ahora mismo" (equivalente a `leyendo` pero para audio).
- **Por qué un único `library.json` y no un `.md` por libro**: es más simple de
  mantener consistente (una sola escritura atómica por cambio) y no necesita un
  índice/caché aparte para que la búsqueda sea instantánea, a costa de que el
  archivo no se pueda editar libro a libro fuera de la app tan cómodamente como
  notas individuales de Obsidian.
- **`ediciones`** registra formatos adicionales del mismo libro (p. ej. tienes
  el físico Y el audiolibro):
  ```json
  "ediciones": [{ "formato": "audiolibro", "editorial": "Audible", "duracion_min": 970 }]
  ```
- **Multi-vault / multi-dispositivo**: como todo es texto plano, dos vaults se
  sincronizan con cualquier herramienta de archivos (Git, Syncthing, Dropbox...).
  Al abrir la misma carpeta en otro ordenador, `config.json` hace que la app se
  vea igual (mismo tema, misma vista) y `library.json` trae todos los libros.

La struct Rust equivalente vive en
[`src-tauri/src/library.rs`](../src-tauri/src/library.rs) y el tipo TypeScript
en [`src/types/book.ts`](../src/types/book.ts); ambos deben mantenerse en
sincronía con este documento.
