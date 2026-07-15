# Contribuir a Anaquel

Gracias por tu interés en el proyecto. Esta guía resume el flujo de trabajo que sigue este repositorio.

## Flujo de trabajo

1. **Crea una rama descriptiva** a partir de `main`, con un nombre que indique de qué trata el cambio (por ejemplo `feat/filtro-por-anio`, `fix/portada-no-se-actualiza`).
2. **Implementa el cambio** en esa rama.
3. **Haz commits pequeños y descriptivos.** Cada commit debe representar un paso con sentido por sí mismo (evita mensajes genéricos como "update" o "fix"; describe *qué* cambia y, si no es obvio, *por qué*).
4. **Abre una Pull Request** hacia `main`.
5. Una vez aprobada, se integra mediante **Squash & Merge** (todos los commits de la rama se combinan en uno solo sobre `main`).
6. **Borra la rama** una vez fusionada.

## Estilo de commits

- Modo imperativo: "Añade filtro por año" en vez de "Añadido filtro por año".
- Un commit, un cambio lógico. Si estás resolviendo dos cosas distintas, sepáralas en dos commits.
- El cuerpo del commit (si hace falta) explica el motivo del cambio, no repite el diff.

## Antes de abrir una PR

- `npx tsc --noEmit` sin errores.
- `cargo check` (dentro de `src-tauri/`) sin errores.
- Si el cambio se ve o se usa desde la interfaz, pruébalo en la app real (`npm run tauri dev`), no solo en el código.

## Reportar bugs o proponer mejoras

Abre un issue describiendo el comportamiento actual, el esperado, y cómo reproducirlo si aplica.
