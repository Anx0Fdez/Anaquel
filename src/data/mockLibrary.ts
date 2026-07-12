import type { Book } from "../types/book";

// Datos de ejemplo para desarrollar la interfaz sin un vault real todavía.
// Cuando exista el backend de Rust, esto se sustituye por el resultado
// de leer el índice SQLite (que a su vez se reconstruye desde los .md).

function book(partial: Partial<Book> & Pick<Book, "id" | "titulo" | "autor">): Book {
  return {
    titulo_original: null,
    autores_adicionales: [],
    isbn: null,
    isbn13: null,
    portada: null,
    estado: "quiero_leer",
    formato: "fisico",
    genero: [],
    etiquetas: [],
    valoracion: null,
    favorito: false,
    progreso: { pagina_actual: null, paginas_totales: null, porcentaje: null, ultima_lectura: null },
    saga: null,
    fechas: { añadido: "2026-01-01", inicio_lectura: null, fin_lectura: null },
    ubicacion_fisica: null,
    prestado_a: null,
    prestado_fecha_devolucion: null,
    ediciones: [],
    enlaces_relacionados: [],
    anaqueles: [],
    notas: "",
    ruta: `${partial.titulo?.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`,
    ...partial,
  };
}

export const mockLibrary: Book[] = [
  book({
    id: "1", titulo: "El nombre del viento", autor: "Patrick Rothfuss",
    genero: ["Fantasía"], anaqueles: ["Fantasía"], estado: "leyendo", favorito: true,
    valoracion: 5,
    progreso: { pagina_actual: 210, paginas_totales: 662, porcentaje: 31, ultima_lectura: "2026-07-10" },
    saga: { nombre: "Crónica del asesino de reyes", numero: 1, total_libros: 3 },
    fechas: { añadido: "2026-06-01", inicio_lectura: "2026-06-20", fin_lectura: null },
    ubicacion_fisica: "Estantería salón, balda 2",
  }),
  book({
    id: "2", titulo: "Sapiens", autor: "Yuval Noah Harari",
    genero: ["Ensayo"], anaqueles: ["Ensayo"], estado: "leido", valoracion: 4.5,
    progreso: { pagina_actual: 496, paginas_totales: 496, porcentaje: 100, ultima_lectura: "2026-02-10" },
    fechas: { añadido: "2026-01-15", inicio_lectura: "2026-01-20", fin_lectura: "2026-02-10" },
  }),
  book({
    id: "3", titulo: "Dune", autor: "Frank Herbert",
    genero: ["Fantasía"], anaqueles: ["Fantasía"], estado: "quiero_leer",
    fechas: { añadido: "2026-05-03", inicio_lectura: null, fin_lectura: null },
  }),
  book({
    id: "4", titulo: "Cien años de soledad", autor: "Gabriel García Márquez",
    genero: ["Clásicos"], anaqueles: ["Clásicos"], estado: "leido", favorito: true, valoracion: 5,
    progreso: { pagina_actual: 471, paginas_totales: 471, porcentaje: 100, ultima_lectura: "2026-01-05" },
    fechas: { añadido: "2025-12-10", inicio_lectura: "2025-12-15", fin_lectura: "2026-01-05" },
  }),
  book({
    id: "5", titulo: "Project Hail Mary", autor: "Andy Weir",
    genero: ["Ciencia ficción"], anaqueles: ["Ciencia ficción"], estado: "audiolibro", formato: "audiolibro",
    valoracion: 5,
    progreso: { pagina_actual: null, paginas_totales: null, porcentaje: 64, ultima_lectura: "2026-07-08" },
    ediciones: [{ formato: "audiolibro", editorial: "Audible", duracion_min: 970 }],
    fechas: { añadido: "2026-06-15", inicio_lectura: "2026-06-16", fin_lectura: null },
  }),
  book({
    id: "6", titulo: "El palacio de la luna", autor: "Paul Auster",
    genero: ["Clásicos"], anaqueles: ["Clásicos"], estado: "quiero_leer",
    fechas: { añadido: "2026-04-22", inicio_lectura: null, fin_lectura: null },
  }),
  book({
    id: "7", titulo: "Homo Deus", autor: "Yuval Noah Harari",
    genero: ["Ensayo"], anaqueles: ["Ensayo"], estado: "leyendo",
    progreso: { pagina_actual: 140, paginas_totales: 448, porcentaje: 31, ultima_lectura: "2026-07-09" },
    fechas: { añadido: "2026-06-25", inicio_lectura: "2026-07-01", fin_lectura: null },
  }),
  book({
    id: "8", titulo: "La biblioteca de la medianoche", autor: "Matt Haig",
    genero: ["Fantasía"], anaqueles: ["Fantasía"], estado: "audiolibro", formato: "audiolibro", favorito: true,
    valoracion: 4,
    progreso: { pagina_actual: null, paginas_totales: null, porcentaje: 88, ultima_lectura: "2026-07-05" },
    fechas: { añadido: "2026-05-30", inicio_lectura: "2026-06-01", fin_lectura: null },
  }),
  book({
    id: "9", titulo: "Némesis", autor: "Isaac Asimov",
    genero: ["Ciencia ficción"], anaqueles: ["Ciencia ficción"], estado: "leido", valoracion: 4,
    progreso: { pagina_actual: 400, paginas_totales: 400, porcentaje: 100, ultima_lectura: "2026-03-02" },
    fechas: { añadido: "2026-02-01", inicio_lectura: "2026-02-10", fin_lectura: "2026-03-02" },
  }),
  book({
    id: "10", titulo: "La sombra del viento", autor: "Carlos Ruiz Zafón",
    genero: ["Clásicos"], anaqueles: ["Clásicos"], estado: "leido", favorito: true, valoracion: 5,
    progreso: { pagina_actual: 565, paginas_totales: 565, porcentaje: 100, ultima_lectura: "2026-04-18" },
    fechas: { añadido: "2026-03-20", inicio_lectura: "2026-04-01", fin_lectura: "2026-04-18" },
  }),
  book({
    id: "11", titulo: "Circe", autor: "Madeline Miller",
    genero: ["Fantasía"], anaqueles: ["Fantasía"], estado: "leido", valoracion: 4.5,
    progreso: { pagina_actual: 393, paginas_totales: 393, porcentaje: 100, ultima_lectura: "2026-05-01" },
    fechas: { añadido: "2026-04-10", inicio_lectura: "2026-04-20", fin_lectura: "2026-05-01" },
  }),
  book({
    id: "12", titulo: "Meditaciones", autor: "Marco Aurelio",
    genero: ["Ensayo"], anaqueles: ["Ensayo"], estado: "leido", valoracion: 4,
    progreso: { pagina_actual: 254, paginas_totales: 254, porcentaje: 100, ultima_lectura: "2025-12-20" },
    fechas: { añadido: "2025-11-01", inicio_lectura: "2025-11-15", fin_lectura: "2025-12-20" },
  }),
  book({
    id: "13", titulo: "El problema de los tres cuerpos", autor: "Liu Cixin",
    genero: ["Ciencia ficción"], anaqueles: ["Ciencia ficción"], estado: "leyendo",
    progreso: { pagina_actual: 88, paginas_totales: 407, porcentaje: 22, ultima_lectura: "2026-07-11" },
    fechas: { añadido: "2026-07-01", inicio_lectura: "2026-07-04", fin_lectura: null },
  }),
  book({
    id: "14", titulo: "Persuasión", autor: "Jane Austen",
    genero: ["Clásicos"], anaqueles: ["Clásicos"], estado: "quiero_leer",
    fechas: { añadido: "2026-06-30", inicio_lectura: null, fin_lectura: null },
  }),
  book({
    id: "15", titulo: "21 lecciones para el siglo XXI", autor: "Yuval Noah Harari",
    genero: ["Ensayo"], anaqueles: ["Ensayo"], estado: "quiero_leer",
    fechas: { añadido: "2026-06-18", inicio_lectura: null, fin_lectura: null },
  }),
  book({
    id: "16", titulo: "Mistborn: El imperio final", autor: "Brandon Sanderson",
    genero: ["Fantasía"], anaqueles: ["Fantasía"], estado: "leido", favorito: true, valoracion: 5,
    progreso: { pagina_actual: 541, paginas_totales: 541, porcentaje: 100, ultima_lectura: "2026-06-11" },
    saga: { nombre: "Nacidos de la bruma", numero: 1, total_libros: 3 },
    fechas: { añadido: "2026-05-15", inicio_lectura: "2026-05-20", fin_lectura: "2026-06-11" },
  }),
  book({
    id: "17", titulo: "Una educación", autor: "Tara Westover",
    genero: ["Ensayo"], anaqueles: ["Ensayo"], estado: "leido", valoracion: 4.5,
    progreso: { pagina_actual: 380, paginas_totales: 380, porcentaje: 100, ultima_lectura: "2026-06-25" },
    fechas: { añadido: "2026-06-01", inicio_lectura: "2026-06-10", fin_lectura: "2026-06-25" },
  }),
  book({
    id: "18", titulo: "El asesinato de Roger Ackroyd", autor: "Agatha Christie",
    genero: ["Clásicos"], anaqueles: ["Clásicos"], estado: "audiolibro", formato: "audiolibro",
    progreso: { pagina_actual: null, paginas_totales: null, porcentaje: 15, ultima_lectura: "2026-07-06" },
    ediciones: [{ formato: "audiolibro", editorial: "Storytel", duracion_min: 420 }],
    fechas: { añadido: "2026-07-02", inicio_lectura: "2026-07-03", fin_lectura: null },
  }),
  book({
    id: "19", titulo: "La invención de Morel", autor: "Adolfo Bioy Casares",
    genero: ["Clásicos"], anaqueles: ["Clásicos"], estado: "abandonado",
    progreso: { pagina_actual: 40, paginas_totales: 128, porcentaje: 31, ultima_lectura: "2026-03-15" },
    fechas: { añadido: "2026-03-01", inicio_lectura: "2026-03-05", fin_lectura: null },
  }),
];
