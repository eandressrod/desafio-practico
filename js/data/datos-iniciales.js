
// js/data/datos-iniciales.js
// Datos iniciales de MIAH para cargar la primera vez.
// Estos datos los utiliza cargarSemilla() desde Firebase.

// IMPORTANTE:
// Los precios y existencias de este ejemplo son provisionales.
// Deben sustituirse por los valores comerciales reales de MIAH.

export const productosIniciales = [
  {
    nombre: 'Bolso Eva',
    linea: 'Eva',
    descripcion: 'Versátil y espacioso, hecho a mano en El Salvador con fibras plásticas recicladas y cuero. Incluye asas largas para hombro y correa ajustable. Forrado internamente con bolsillo pequeño.',
    materiales: 'Plástico reciclado y cuero',
    variantes: ['Clásica'],
    precio: 55,
    stock: 5,
    imagen: 'img/bolso-eva-cherry-hombro.jpg',
    activo: true,
  },
  {
    nombre: 'Bolso Olivia Clásica',
    linea: 'Olivia',
    descripcion: 'Elaborado cuidadosamente en tule de agua y detalles en cuero genuino. Su correa ajustable permite llevarlo cómodamente en la mano o al hombro.',
    materiales: 'Tule de agua y cuero genuino',
    variantes: ['Clásica'],
    precio: 65,
    stock: 2,
    imagen: 'img/bolso-olivia-clasica.jpg',
    activo: true,
  },
  {
    nombre: 'Bolso Olivia Mini',
    linea: 'Olivia',
    descripcion: 'Versión Mini de la línea Olivia, elaborada en tule de agua y detalles en cuero genuino.',
    materiales: 'Tule de agua y cuero genuino',
    variantes: ['Mini'],
    precio: 48,
    stock: 0,
    imagen: 'img/bolso-olivia-clasica.jpg',
    activo: true,
  },
  {
    nombre: 'Bolso Lupita',
    linea: 'Lupita',
    descripcion: 'Tejido a mano con fibra de plástico reciclado y finos detalles en eco cuero. Incluye una correa ajustable que le otorga máxima versatilidad para cualquier ocasión.',
    materiales: 'Plástico reciclado y eco cuero',
    variantes: ['Clásica'],
    precio: 58,
    stock: 1,
    imagen: 'img/bolso-lupita-negro.jpg',
    activo: true,
  },
  {
    nombre: 'Bolso Lupita Mini',
    linea: 'Lupita',
    descripcion: 'Versión Mini de la línea Lupita, tejida a mano con fibra de plástico reciclado y detalles en eco cuero.',
    materiales: 'Plástico reciclado y eco cuero',
    variantes: ['Mini'],
    precio: 45,
    stock: 7,
    imagen: 'img/bolso-lupita-negro.jpg',
    activo: true,
  },
  {
    nombre: 'Bolso Isabela',
    linea: 'Isabela',
    descripcion: 'Combina tradición y diseño en una pieza única elaborada en mimbre, enriquecida con elegantes detalles en cuero y madera. Incluye correa ajustable para mayor estilo.',
    materiales: 'Mimbre, cuero y madera',
    variantes: ['Isabela', 'Rachel'],
    precio: 72,
    stock: 4,
    imagen: 'img/bolso-bucket-isabela.jpg',
    activo: true,
  },
  {
    nombre: 'Bolso Paloma',
    linea: 'Paloma',
    descripcion: 'Una combinación perfecta de arte, funcionalidad y encanto atemporal. Elaborado en mimbre artesanal y cuero genuino con correa ajustable.',
    materiales: 'Mimbre y cuero genuino',
    variantes: ['Clásica'],
    precio: 68,
    stock: 0,
    imagen: 'img/bolso-mini-mimbre-cuero.jpg',
    activo: true,
  },
  {
    nombre: 'Bolso Paloma Mini',
    linea: 'Paloma',
    descripcion: 'Versión Mini de la línea Paloma, elaborada en mimbre artesanal y cuero genuino.',
    materiales: 'Mimbre y cuero genuino',
    variantes: ['Mini'],
    precio: 52,
    stock: 3,
    imagen: 'img/bolso-mini-mimbre-cuero.jpg',
    activo: false,
  },
];

// Los pedidos se relacionan por nombre del producto
// y correo del cliente. cargarSemilla() convierte esos
// datos a identificadores de Firebase.

export const pedidosIniciales = [
  // 2 pedidos pendientes
  {
    productoNombre: 'Bolso Eva',
    clienteCorreo: 'cliente1@miah.test',
    cantidad: 1,
    estado: 'pendiente',
    nota: 'Para regalo.',
  },
  {
    productoNombre: 'Bolso Lupita Mini',
    clienteCorreo: 'cliente2@miah.test',
    cantidad: 1,
    estado: 'pendiente',
    nota: 'Consultar disponibilidad de colores.',
  },

  // 2 pedidos confirmados
  {
    productoNombre: 'Bolso Olivia Clásica',
    clienteCorreo: 'cliente1@miah.test',
    cantidad: 1,
    estado: 'confirmado',
    nota: 'Entrega a coordinar.',
  },
  {
    productoNombre: 'Bolso Isabela',
    clienteCorreo: 'cliente2@miah.test',
    cantidad: 1,
    estado: 'confirmado',
    nota: 'Pedido confirmado.',
  },

  // 1 pedido entregado
  {
    productoNombre: 'Bolso Lupita',
    clienteCorreo: 'cliente1@miah.test',
    cantidad: 1,
    estado: 'entregado',
    nota: 'Pedido entregado correctamente.',
  },

  // 1 pedido cancelado
  {
    productoNombre: 'Bolso Eva',
    clienteCorreo: 'cliente2@miah.test',
    cantidad: 1,
    estado: 'cancelado',
    nota: 'El cliente decidió cancelar.',
  },
];
