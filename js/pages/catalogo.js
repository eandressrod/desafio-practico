
/* =========================================
   MIAH - CATÁLOGO DINÁMICO
   Responsable: Pablo
========================================= */

// Servicios de Eandress.
import { listarProductos } from '../services/productos.js';

// Utilidades compartidas de DMoralGar.
import {
    mostrarCarga,
    mostrarVacio,
    mostrarAviso
} from '../ui/ui.js';

// Formato de precios de Pablo.
import { formatearPrecio } from '../utils/formato.js';


// =========================================
// ELEMENTOS DEL HTML
// =========================================

const contenedor = document.querySelector('#lista-productos');
const buscador = document.querySelector('#buscar');
const filtroLinea = document.querySelector('#filtro-linea');
const orden = document.querySelector('#orden');
const resumen = document.querySelector('#resumen');
const formularioFiltros = document.querySelector('#filtros');

// Copia local de los productos activos.
let productos = [];


// =========================================
// ESTADOS DEL CATÁLOGO
// =========================================

function aplicarEstiloEstado() {

    const elemento = contenedor.firstElementChild;

    if (elemento) {
        elemento.classList.add('estado-catalogo');
    }

}

function mostrarCargaCatalogo(texto) {

    mostrarCarga(contenedor, texto);

    aplicarEstiloEstado();

}

function mostrarVacioCatalogo(texto) {

    mostrarVacio(contenedor, texto);

    aplicarEstiloEstado();

}


// =========================================
// CARGAR PRODUCTOS DESDE FIRESTORE
// =========================================

async function cargarProductos() {

    mostrarCargaCatalogo('Cargando la colección...');

    resumen.textContent = 'Cargando productos...';

    try {

        const respuesta = await listarProductos();

        if (!respuesta.ok) {

            productos = [];

            resumen.textContent = 'No se pudo cargar el catálogo.';

            mostrarVacioCatalogo(
                'No pudimos cargar el catálogo. Intenta más tarde.'
            );

            mostrarAviso(respuesta.error, 'error');

            return;
        }

        // Solamente mostramos productos activos.
        productos = respuesta.data.filter(
            (producto) => producto.activo
        );

        llenarLineas();

        pintarProductos();

    } catch (error) {

        console.error('Error al cargar productos:', error);

        productos = [];

        resumen.textContent = 'Error al cargar el catálogo.';

        mostrarVacioCatalogo(
            'No pudimos cargar los productos. Intenta más tarde.'
        );

        mostrarAviso(
            'Ocurrió un error al cargar el catálogo.',
            'error'
        );

    }

}


// =========================================
// GENERAR OPCIONES DE LÍNEA
// =========================================

function llenarLineas() {

    const opcionTodas = document.createElement('option');

    opcionTodas.value = '';
    opcionTodas.textContent = 'Todas';

    filtroLinea.replaceChildren(opcionTodas);

    const lineas = [
        ...new Set(
            productos
                .map((producto) => producto.linea)
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b));

    for (const linea of lineas) {

        const opcion = document.createElement('option');

        opcion.value = linea;
        opcion.textContent = linea;

        filtroLinea.append(opcion);

    }

}


// =========================================
// BÚSQUEDA, FILTRO Y ORDEN
// =========================================

function aplicarFiltros() {

    const texto = buscador.value.trim().toLowerCase();

    const linea = filtroLinea.value;

    const resultado = productos.filter((producto) => {

        const nombre = (producto.nombre || '').toLowerCase();

        const materiales = (producto.materiales || '').toLowerCase();

        const coincideTexto =
            nombre.includes(texto) ||
            materiales.includes(texto);

        const coincideLinea =
            linea === '' || producto.linea === linea;

        return coincideTexto && coincideLinea;

    });

    // Orden por precio ascendente.
    if (orden.value === 'precio-asc') {

        resultado.sort(
            (a, b) => a.precio - b.precio
        );

    }

    // Orden por precio descendente.
    if (orden.value === 'precio-desc') {

        resultado.sort(
            (a, b) => b.precio - a.precio
        );

    }

    // Orden alfabético.
    if (orden.value === 'nombre') {

        resultado.sort(
            (a, b) => a.nombre.localeCompare(b.nombre)
        );

    }

    return resultado;

}


// =========================================
// CREAR DETALLES TÉCNICOS
// =========================================

function crearDetalle(etiqueta, valor) {

    const elemento = document.createElement('li');

    const titulo = document.createElement('strong');

    const texto = document.createElement('span');

    titulo.textContent = `${etiqueta}:`;

    texto.textContent = ` ${valor}`;

    elemento.append(titulo, texto);

    return elemento;

}


// =========================================
// CREAR TARJETA DE PRODUCTO
// =========================================

function crearTarjeta(producto) {

    const tarjeta = document.createElement('article');

    tarjeta.className = 'tarjeta-producto';

    // IMAGEN
    const contenedorImagen = document.createElement('div');

    contenedorImagen.className = 'imagen-contenedor';

    const imagen = document.createElement('img');

    imagen.src = producto.imagen;

    imagen.alt = producto.nombre;

    imagen.loading = 'lazy';

    contenedorImagen.append(imagen);


    // INFORMACIÓN
    const informacion = document.createElement('div');

    informacion.className = 'info-producto';


    // LÍNEA
    const etiqueta = document.createElement('span');

    etiqueta.className = 'etiqueta-categoria';

    etiqueta.textContent = `Línea ${producto.linea}`;


    // NOMBRE
    const titulo = document.createElement('h3');

    titulo.textContent = producto.nombre;


    // DESCRIPCIÓN
    const descripcion = document.createElement('p');

    descripcion.className = 'descripcion';

    descripcion.textContent = producto.descripcion;


    // PRECIO
    const precio = document.createElement('p');

    precio.className = 'precio';

    precio.textContent = formatearPrecio(producto.precio);


    // VARIANTES
    const variantes = Array.isArray(producto.variantes)
        ? producto.variantes.join(', ')
        : '';

    // DETALLES
    const detalles = document.createElement('ul');

    detalles.className = 'detalles-tecnicos';

    detalles.append(

        crearDetalle(
            'Materiales',
            producto.materiales || 'No especificados'
        ),

        crearDetalle(
            'Variantes',
            variantes || 'No especificadas'
        ),

        crearDetalle(
            'Existencias',
            producto.stock
        )

    );


    // BOTÓN PEDIR / AGOTADO
    const accion = document.createElement('a');

    accion.className = 'boton-accion';

    if (producto.stock > 0) {

        accion.href =
            `pedido.html?id=${encodeURIComponent(producto.id)}`;

        accion.textContent = 'Pedir';

    } else {

        accion.textContent = 'Agotado';

        accion.classList.add('boton-desactivado');

        accion.setAttribute('aria-disabled', 'true');

        accion.setAttribute('tabindex', '-1');

    }


    // UNIR ELEMENTOS
    informacion.append(
        etiqueta,
        titulo,
        descripcion,
        precio,
        detalles,
        accion
    );

    tarjeta.append(
        contenedorImagen,
        informacion
    );

    return tarjeta;

}


// =========================================
// MOSTRAR PRODUCTOS
// =========================================

function pintarProductos() {

    const visibles = aplicarFiltros();

    // Resumen de resultados.
    resumen.textContent =
        `${visibles.length} de ${productos.length} productos`;

    // Si no hay coincidencias.
    if (visibles.length === 0) {

        mostrarVacioCatalogo(
            'Ningún bolso coincide con tu búsqueda.'
        );

        return;
    }

    // Construir tarjetas con createElement.
    const tarjetas = visibles.map(crearTarjeta);

    contenedor.replaceChildren(...tarjetas);

}


// =========================================
// EVENTOS
// =========================================

buscador.addEventListener('input', pintarProductos);

filtroLinea.addEventListener('change', pintarProductos);

orden.addEventListener('change', pintarProductos);

formularioFiltros.addEventListener('submit', (evento) => {

    evento.preventDefault();

});


// =========================================
// INICIO
// =========================================

cargarProductos();
