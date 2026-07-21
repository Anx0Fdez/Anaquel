<p align="center">
  <img src="public/logo.png" alt="Anaquel" width="120" />
</p>

<h1 align="center">Anaquel</h1>

<p align="center">
  Catálogo de biblioteca personal para escritorio — libros y audiolibros, sin cuentas, sin nube, sin servidor.
</p>

## Descripción

Anaquel es una aplicación de escritorio (Windows y Linux) para catalogar tu biblioteca personal de libros y audiolibros. Toda tu información vive en texto plano dentro de una carpeta que tú eliges — un **anaquel** — de la misma forma en que un vault de Obsidian guarda tus notas: sin cuenta, sin sincronización obligatoria en la nube y sin ningún servidor de por medio. Si quieres sincronizarla entre dispositivos, basta con meter esa carpeta en Dropbox, Syncthing o Git, como harías con cualquier otra carpeta de archivos.

## Características principales

- **Anaquel = carpeta.** Cualquier carpeta de tu sistema de archivos puede convertirse en tu biblioteca; los datos se guardan como JSON legible en texto plano.
- **Libros y audiolibros como dos bibliotecas independientes**, con estados de lectura adaptados a cada una (Leyendo/Escuchando, Quiero leer/Quiero escuchar...) y su propio diálogo de "Añadir".
- **Autocompletado por ISBN**: busca en Open Library y, si no encuentra nada, en Google Books, probando tanto el ISBN-13 como el ISBN-10 de la misma edición. Rellena título, autor, editorial, páginas y portada sin pisar lo que ya hayas escrito a mano.
- **Autocompletado de Autor, Editorial y Colección/saga**: sugiere, mientras escribes, valores ya usados en el resto de tu biblioteca (navegable con flechas y Enter), sin dejar de admitir texto libre.
- **Aviso de posibles duplicados**: al añadir un libro, avisa si ya existe uno con el mismo ISBN o un título y autor muy parecidos.
- **Portadas**: descargadas automáticamente por ISBN o añadidas a mano desde una imagen local (la anterior se borra sola al reemplazarla).
- **Estados de lectura completos**: quiero leer, leyendo, pospuesto, leído, abandonado — con marcas adicionales de relectura y de "comprar en físico" para audiolibros ya escuchados, y un formato "Comprar" para libros que aún no tienes.
- **Comentarios libres por libro**, editados desde una ventana flotante propia en la ficha de detalle.
- **Búsqueda** (`Ctrl+F`) por título, autor o saga, y **ordenación** por título, autor, saga, valoración, estado, favoritos o páginas/duración.
- **Agrupación automática en secciones** al ordenar por autor, saga o estado, en cuadrícula y en tabla.
- **Vistas de cuadrícula (tres tamaños) y de tabla**, con filtros por estado, favoritos o año de lectura/escucha.
- **Exportación a Excel** (`.xlsx`) con libros y audiolibros en hojas separadas.
- **Tema claro/oscuro y color de acento personalizable**, con selector de fechas y de opciones diseñados a medida en vez de controles nativos genéricos.
- **Multi-dispositivo sin backend**: el mismo anaquel abierto en otro ordenador recuerda el tema, la vista y el resto de preferencias.
- **Aviso discreto de nuevas versiones**: comprueba en segundo plano contra los Releases de GitHub y muestra un icono junto al que abrir la página de descarga, sin interrumpir ni forzar nada si no hay conexión.

## Capturas

> _Pendiente de añadir capturas de pantalla._

<!--
![Vista de cuadrícula](docs/screenshots/grid-view.png)
![Ficha de detalle](docs/screenshots/book-detail.png)
![Tema claro](docs/screenshots/light-theme.png)
-->

## Instalación

Descarga la última versión desde la [página de Releases](https://github.com/Anx0Fdez/Anaquel/releases):

- **Windows**: instalador `.exe` (NSIS) o `.msi`.
- **Linux**: `.AppImage` o paquete `.deb`, según lo que prefiera tu distribución.

No hace falta cuenta ni configuración adicional: al abrir la aplicación por primera vez, elige (o crea) la carpeta que quieres usar como anaquel.

## Configuración de desarrollo

Requisitos: [Node.js](https://nodejs.org/) 18+, [Rust](https://www.rust-lang.org/tools/install) estable, y las [dependencias del sistema de Tauri](https://tauri.app/start/prerequisites/) para tu plataforma.

```bash
git clone https://github.com/Anx0Fdez/Anaquel.git
cd Anaquel
npm install
npm run tauri dev
```

Esto levanta Vite y compila el backend de Rust en modo desarrollo, con recarga en caliente del frontend.

## Compilar la aplicación

```bash
npm run tauri build
```

Genera los instaladores nativos para tu plataforma en `src-tauri/target/release/bundle/`.

## Tecnologías

- **Frontend**: React 19, TypeScript, Vite
- **Backend/nativo**: [Tauri](https://tauri.app/) 2, Rust
- **Datos**: `serde` / `serde_json` para leer y escribir los JSON del anaquel
- **Metadatos por ISBN**: `reqwest` contra las APIs de Open Library y Google Books
- **Exportación**: `rust_xlsxwriter`
- **Iconos**: [lucide-react](https://lucide.dev/)

## Estructura del proyecto

```
Anaquel/
├── src/                     # Frontend React + TypeScript
│   ├── components/          # Componentes de UI (layout, biblioteca, campos)
│   ├── lib/                 # Wrappers de los comandos de Tauri, hooks, utilidades
│   ├── state/               # Lógica de filtros de la biblioteca
│   ├── styles/               # Tema y variables CSS globales
│   └── types/                 # Tipos compartidos con el backend de Rust
├── src-tauri/               # Backend nativo
│   └── src/
│       ├── library.rs        # Lectura/escritura de mybooks.json y myaudiobooks.json
│       ├── vault.rs           # Gestión del anaquel y su config.json
│       ├── metadata.rs        # Búsqueda por ISBN y portadas
│       ├── export.rs          # Exportación a Excel
│       └── updater.rs         # Comprobación de nuevas versiones vía GitHub Releases
└── docs/
    └── library-format.md    # Formato exacto de los archivos del anaquel
```

## Configuración

Cada anaquel guarda sus preferencias (tema, color de acento, tamaño de ventana, orden por defecto, API key de Google Books...) en `.ananquel/config.json`, dentro de la propia carpeta del anaquel — viajan con él si lo mueves o lo sincronizas a otro dispositivo. El formato completo de los datos de la biblioteca está documentado en [`docs/library-format.md`](docs/library-format.md).

## API key de Google Books

El autocompletado por ISBN busca primero en [Open Library](https://openlibrary.org/) y, si no encuentra el libro ahí, cae en [Google Books](https://books.google.com/) como respaldo. **Sin una API key, las peticiones anónimas a Google Books tienen una cuota diaria de 0** — es decir, el respaldo falla siempre en silencio, y solo encuentras lo que Open Library ya tenga indexado (que para libros recientes o de editoriales pequeñas en español suele ser poco o nada).

Por qué merece la pena sacarla:
- Es **gratis** — Google Cloud ofrece una cuota diaria de sobra para uso personal, sin necesidad de dar datos de facturación.
- **Sin ella, el respaldo de Google Books no funciona en la práctica** — no es una mejora opcional menor, es lo que hace que la búsqueda por ISBN realmente encuentre la mayoría de libros.
- Se configura **una sola vez** y queda guardada en tu anaquel.

Cómo conseguirla:
1. Entra en la [Google Cloud Console](https://console.cloud.google.com/) con cualquier cuenta de Google (no hace falta activar facturación).
2. Crea un proyecto nuevo (o usa uno existente).
3. Ve a **APIs y servicios → Biblioteca**, busca **"Books API"** y pulsa **Habilitar**.
4. Ve a **APIs y servicios → Credenciales → Crear credenciales → Clave de API**. Se genera al momento.
5. (Opcional, recomendado) Edita la key recién creada y en **"Restricciones de API"** limítala solo a **Books API** — así, aunque alguien la viera, no podría usarla para nada más.

Cómo usarla en Anaquel:
1. Abre el icono de engranaje (⚙) en la parte inferior de la barra lateral.
2. Pega la key en el campo **"API key de Google Books"** y pulsa **Guardar**.
3. Ya queda recordada para ese anaquel — no hace falta volver a introducirla salvo que cambies de key.

## Publicar una nueva versión

1. Actualiza el número de versión en `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` y `package.json`.
2. Crea una etiqueta con el formato `vX.Y.Z` y súbela: `git tag v1.2.0 && git push origin v1.2.0`.
3. El workflow [`release.yml`](.github/workflows/release.yml) compila Windows y Linux, y deja un Release **en borrador** en GitHub con los instaladores ya adjuntos.
4. Revisa/escribe las notas de la versión y publícalo desde la web de GitHub.

## Roadmap

- [ ] Colecciones inteligentes (filtros guardados más allá de favoritos/año/estado, p. ej. "pendientes de relectura")
- [ ] Importar biblioteca desde Goodreads/CSV

## Contribuir

Las contribuciones son bienvenidas. Antes de abrir una PR, echa un vistazo a [`CONTRIBUTING.md`](CONTRIBUTING.md) para el flujo de trabajo que sigue este repositorio.

## Licencia

Este proyecto está bajo licencia [MIT](LICENSE).

## Créditos

- [Tauri](https://tauri.app/) — el framework que hace posible una app nativa ligera con web tech.
- [Open Library](https://openlibrary.org/) y [Google Books](https://books.google.com/) — fuentes de metadatos por ISBN.
- [Lucide](https://lucide.dev/) — iconografía.
