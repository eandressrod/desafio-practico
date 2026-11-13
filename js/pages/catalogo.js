// js/pages/catalogo.js — catálogo público generado desde Firestore
import { listarProductos } from '../services/productos.js';
import { mostrarCarga, mostrarVacio, mostrarAviso } from '../ui/ui.js';
import { formatearPrecio } from '../utils/formato.js';

const lista = document.querySelector('#lista-productos');
const buscador = document.querySelector('#buscar');
const filtroLinea = document.querySelector('#filtro-linea');
const orden = document.querySelector('#orden');
const resumen = document.querySelector('#resumen');

let productos = []; // copia local: solo los productos activos

// Formas de ordenar: cada opción del <select> tiene su función de comparación.
const COMPARAR = {
    'nombre': (a, b) => a.nombre.localeCompare(b.nombre),
    'precio-asc': (a, b) => a.precio - b.precio,
    'precio-desc': (a, b) => b.precio - a.precio,
};

// Patrón 1: cargar con estados (carga → datos / vacío / error)
async function cargarProductos() {
    mostrarCarga(lista, 'Cargando la colección…');

    const respuesta = await listarProductos();
    if (!respuesta.ok) {
        mostrarVacio(lista, 'No pudimos cargar el catálogo. Intenta más tarde.');
        mostrarAviso(respuesta.error, 'error');
        return;
    }

    productos = respuesta.data.filter((producto) => producto.activo);
    llenarLineas();
    pintarProductos();
}

// Opciones del filtro "Línea" sacadas de los mismos productos (sin repetir).
function llenarLineas() {
    const lineas = [];
    for (const producto of productos) {
        if (!lineas.includes(producto.linea)) lineas.push(producto.linea);
    }

    const opciones = lineas.sort().map((linea) => {
        const opcion = document.createElement('option');
        opcion.value = linea;
        opcion.textContent = linea;
        return opcion;
    });
    filtroLinea.append(...opciones); // "Todas" ya está en el HTML
}

// Patrón 5: búsqueda por nombre o material + filtro por línea + orden
function aplicarFiltros() {
    const texto = buscador.value.trim().toLowerCase();
    const linea = filtroLinea.value;

    const resultado = productos.filter((p) =>
        (linea === '' || p.linea === linea)
        && `${p.nombre} ${p.materiales}`.toLowerCase().includes(texto));

    return resultado.sort(COMPARAR[orden.value]);
}

// Patrón 2: dibujar con el DOM
function crearDetalle(etiqueta, valor) {
    const titulo = document.createElement('strong');
    titulo.textContent = `${etiqueta}: `;

    const elemento = document.createElement('li');
    elemento.append(titulo, valor);
    return elemento;
}

function crearTarjeta(producto) {
    const imagen = document.createElement('img');
    imagen.src = producto.imagen;
    imagen.alt = producto.nombre;
    imagen.loading = 'lazy';

    const linea = document.createElement('p');
    linea.className = 'etiqueta-linea';
    linea.textContent = `Línea ${producto.linea}`;

    const nombre = document.createElement('h3');
    nombre.textContent = producto.nombre;

    const descripcion = document.createElement('p');
    descripcion.className = 'descripcion';
    descripcion.textContent = producto.descripcion;

    const precio = document.createElement('p');
    precio.className = 'precio';
    precio.textContent = formatearPrecio(producto.precio);

    const detalles = document.createElement('ul');
    detalles.className = 'detalles';
    detalles.append(
        crearDetalle('Materiales', producto.materiales),
        crearDetalle('Variantes', producto.variantes.join(', ') || '—'),
        crearDetalle('Existencias', producto.stock),
    );

    // Con stock se puede pedir; sin stock el botón queda desactivado.
    const accion = document.createElement('a');
    accion.className = 'boton boton-principal';
    if (producto.stock > 0) {
        accion.href = `pedido.html?id=${producto.id}`;
        accion.textContent = 'Pedir';
    } else {
        accion.textContent = 'Agotado';
        accion.setAttribute('aria-disabled', 'true');
    }

    const informacion = document.createElement('div');
    informacion.className = 'info-producto';
    informacion.append(linea, nombre, descripcion, precio, detalles, accion);

    const tarjeta = document.createElement('article');
    tarjeta.className = 'tarjeta-producto';
    tarjeta.append(imagen, informacion);
    return tarjeta;
}

function pintarProductos() {
    const visibles = aplicarFiltros();
    resumen.textContent = `${visibles.length} de ${productos.length} productos`;

    if (productos.length === 0) {
        mostrarVacio(lista, 'Aún no hay productos.');
        return;
    }
    if (visibles.length === 0) {
        mostrarVacio(lista, 'Ningún bolso coincide con tu búsqueda.');
        return;
    }

    lista.replaceChildren(...visibles.map(crearTarjeta));
}

buscador.addEventListener('input', pintarProductos);
filtroLinea.addEventListener('change', pintarProductos);
orden.addEventListener('change', pintarProductos);
document.querySelector('#filtros').addEventListener('submit', (e) => e.preventDefault());

await cargarProductos();
