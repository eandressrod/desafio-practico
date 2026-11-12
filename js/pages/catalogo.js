
 // js/pages/catalogo.js

// Importamos los servicios y utilidades existentes.
import { listarProductos } from '../services/productos.js';
import { formatearPrecio } from '../utils/formato.js';

// Elementos del HTML.
const contenedor = document.querySelector('#lista-productos');
const buscador = document.querySelector('#buscar');
const filtroLinea = document.querySelector('#filtro-linea');
const orden = document.querySelector('#orden');
const resumen = document.querySelector('#resumen');
const formularioFiltros = document.querySelector('#filtros');

// Copia local de los productos activos.
let productos = [];

// Muestra mensajes de carga, error o ausencia de resultados.
function mostrarEstado(mensaje, tipo = 'vacio') {
  const estado = document.createElement('p');

  estado.className = `estado-catalogo estado-${tipo}`;
  estado.textContent = mensaje;
  estado.setAttribute('role', 'status');

  contenedor.replaceChildren(estado);
}

// Carga los productos desde el servicio de Firebase.
async function cargarProductos() {
  mostrarEstado('Cargando la colección...', 'carga');
  resumen.textContent = 'Cargando productos...';

  try {
    const respuesta = await listarProductos();

    // Comprobamos si el servicio devolvió un error.
    if (!respuesta.ok) {
      productos = [];
      resumen.textContent = 'No se pudo cargar el catálogo.';
      mostrarEstado(respuesta.error, 'error');
      return;
    }

    // Guardamos únicamente los productos activos.
    productos = respuesta.data.filter((producto) => producto.activo);

    llenarLineas();
    pintarProductos();

  } catch (error) {
    console.error('Error inesperado al cargar productos:', error);

    productos = [];
    resumen.textContent = 'Error al cargar el catálogo.';
    mostrarEstado('No pudimos cargar los productos. Intenta más tarde.', 'error');
  }
}

// Genera las opciones de línea a partir de los productos.
function llenarLineas() {
  const opcionTodas = document.createElement('option');

  opcionTodas.value = '';
  opcionTodas.textContent = 'Todas';

  filtroLinea.replaceChildren(opcionTodas);

  const lineas = [
    ...new Set(productos.map((producto) => producto.linea).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  for (const linea of lineas) {
    const opcion = document.createElement('option');

    opcion.value = linea;
    opcion.textContent = linea;

    filtroLinea.append(opcion);
  }
}

// Combina búsqueda, filtro por línea y ordenamiento.
function aplicarFiltros() {
  const texto = buscador.value.trim().toLowerCase();
  const linea = filtroLinea.value;

  const resultado = productos.filter((producto) => {
    const nombre = (producto.nombre || '').toLowerCase();
    const materiales = (producto.materiales || '').toLowerCase();

    const coincideTexto =
      nombre.includes(texto) || materiales.includes(texto);

    const coincideLinea =
      linea === '' || producto.linea === linea;

    return coincideTexto && coincideLinea;
  });

  // Ordenamos una copia para no modificar el arreglo original.
  if (orden.value === 'precio-asc') {
    resultado.sort((a, b) => a.precio - b.precio);
  }

  if (orden.value === 'precio-desc') {
    resultado.sort((a, b) => b.precio - a.precio);
  }

  if (orden.value === 'nombre') {
    resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  return resultado;
}

// Crea un elemento de lista para los detalles técnicos.
function crearDetalle(etiqueta, valor) {
  const elemento = document.createElement('li');
  const titulo = document.createElement('strong');

  titulo.textContent = `${etiqueta}:`;
  elemento.append(titulo, document.createTextNode(` ${valor}`));

  return elemento;
}

// Construye una tarjeta de producto utilizando el DOM.
function crearTarjeta(producto) {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'tarjeta-producto';

  // Imagen.
  const contenedorImagen = document.createElement('div');
  contenedorImagen.className = 'imagen-contenedor';

  const imagen = document.createElement('img');
  imagen.src = producto.imagen;
  imagen.alt = producto.nombre;
  imagen.loading = 'lazy';

  contenedorImagen.append(imagen);

  // Información.
  const informacion = document.createElement('div');
  informacion.className = 'info-producto';

  const etiqueta = document.createElement('span');
  etiqueta.className = 'etiqueta-categoria';
  etiqueta.textContent = `Línea ${producto.linea}`;

  const titulo = document.createElement('h3');
  titulo.textContent = producto.nombre;

  const descripcion = document.createElement('p');
  descripcion.className = 'descripcion';
  descripcion.textContent = producto.descripcion;

  // Precio.
  const precio = document.createElement('p');
  precio.className = 'precio';
  precio.textContent = formatearPrecio(producto.precio);

  // Detalles técnicos.
  const detalles = document.createElement('ul');
  detalles.className = 'detalles-tecnicos';

  const variantes = Array.isArray(producto.variantes)
    ? producto.variantes.join(', ')
    : '';

  detalles.append(
    crearDetalle('Materiales', producto.materiales || 'No especificados'),
    crearDetalle('Variantes', variantes || 'No especificadas'),
    crearDetalle('Existencias', producto.stock)
  );

  // Botón para realizar un pedido.
  const accion = document.createElement('a');
  accion.className = 'boton-accion';

  if (producto.stock > 0) {
    accion.href = `pedido.html?id=${encodeURIComponent(producto.id)}`;
    accion.textContent = 'Pedir';
  } else {
    accion.textContent = 'Agotado';
    accion.classList.add('boton-desactivado');
    accion.setAttribute('aria-disabled', 'true');
    accion.setAttribute('tabindex', '-1');
  }

  informacion.append(
    etiqueta,
    titulo,
    descripcion,
    precio,
    detalles,
    accion
  );

  tarjeta.append(contenedorImagen, informacion);

  return tarjeta;
}

// Dibuja los productos que coinciden con los filtros.
function pintarProductos() {
  const visibles = aplicarFiltros();

  resumen.textContent =
    `${visibles.length} de ${productos.length} productos`;

  if (visibles.length === 0) {
    mostrarEstado(
      'Ningún bolso coincide con tu búsqueda.',
      'vacio'
    );
    return;
  }

  const tarjetas = visibles.map(crearTarjeta);

  contenedor.replaceChildren(...tarjetas);
}

// Eventos de búsqueda, filtro y ordenamiento.
buscador.addEventListener('input', pintarProductos);

filtroLinea.addEventListener('change', pintarProductos);

orden.addEventListener('change', pintarProductos);

formularioFiltros.addEventListener('submit', (evento) => {
  evento.preventDefault();
});

// Cargamos el catálogo al entrar.
cargarProductos();
