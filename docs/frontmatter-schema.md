# Esquema del frontmatter de un libro

Cada libro/audiolibro del vault es un archivo `.md` independiente. Los metadatos
viven en YAML frontmatter; el cuerpo del archivo es Markdown libre (notas, citas,
reseña) y puede enlazar a otros libros con `[[wikilinks]]` estilo Obsidian.

El campo `id` es lo único que no debe cambiar nunca: es lo que usan el índice
SQLite y `enlaces_relacionados` para referenciar el archivo aunque se renombre
o se mueva de carpeta.

```yaml
---
id: 550e8400-e29b-41d4-a716-446655440000
titulo: "El nombre del viento"
titulo_original: "The Name of the Wind"
autor: "Patrick Rothfuss"
autores_adicionales: []          # traductor, ilustrador, narrador del audiolibro...
isbn: "9788401352836"
isbn13: "9788401352836"
portada: covers/550e8400.jpg      # ruta relativa a .ananquel/covers/
estado: leyendo                   # quiero_leer | leyendo | leido | abandonado | audiolibro
formato: fisico                   # fisico | ebook | audiolibro
genero: [Fantasía]
etiquetas: [saga, favorito]
valoracion: 5                     # 0-5, admite decimales (.5)
favorito: true
progreso:
  pagina_actual: 210
  paginas_totales: 662
  porcentaje: 31
  ultima_lectura: 2026-07-10
saga:
  nombre: "Crónica del asesino de reyes"
  numero: 1
  total_libros: 3
fechas:
  añadido: 2026-06-01
  inicio_lectura: 2026-06-20
  fin_lectura: null
ubicacion_fisica: "Estantería salón, balda 2"
prestado_a: null                  # nombre de la persona | null
prestado_fecha_devolucion: null
ediciones: []                     # otras ediciones del mismo libro (ver más abajo)
enlaces_relacionados: []          # ids de otros libros .md relacionados
anaqueles: [Fantasía]             # estanterías personalizadas del usuario
---

Notas, citas y reseña libres en Markdown a partir de aquí.
Puedo enlazar a [[Dune]] o a cualquier otro libro del vault.
```

## Notas de diseño

- **Todos los campos son opcionales excepto `id`, `titulo` y `autor`.** Un libro
  recién añadido puede no tener más que eso; el resto se va rellenando.
- **`estado` no depende de `formato`**: un audiolibro puede estar `quiero_leer`
  antes de empezarlo. `audiolibro` como estado se usa para el filtro rápido de
  "lo que estoy escuchando ahora mismo" (equivalente a `leyendo` pero para audio).
- **`ediciones`** registra formatos adicionales del mismo libro (p. ej. tienes el
  físico Y el audiolibro). Cada entrada:
  ```yaml
  ediciones:
    - formato: audiolibro
      editorial: "Audible"
      duracion_min: 970
  ```
- **Multi-vault / multi-dispositivo**: como todo es texto plano, dos vaults se
  sincronizan con cualquier herramienta de archivos (Git, Syncthing, Dropbox...).
  El índice SQLite en `.ananquel/index.sqlite` es desechable y se reconstruye
  leyendo todos los `.md` — nunca es la fuente de verdad.
- **Compatibilidad con Obsidian**: el frontmatter usa solo tipos YAML estándar
  (strings, números, fechas ISO, listas, objetos anidados), así que el vault se
  puede abrir tal cual como vault de Obsidian para editar notas con otro cliente.

El tipo TypeScript equivalente vive en [`src/types/book.ts`](../src/types/book.ts)
y debe mantenerse en sincronía con este documento.
