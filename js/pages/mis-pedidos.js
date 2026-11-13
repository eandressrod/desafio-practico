// js/pages/mis-pedidos.js
import { exigirSesion } from '../services/auth.js';
import { listarMisPedidos, cancelarPedido } from '../services/pedidos.js';
import { mostrarCarga, mostrarVacio, mostrarAviso, botonOcupado, confirmar } from '../ui/ui.js';
import { formatearPrecio, formatearFecha } from '../utils/formato.js';

await exigirSesion(); // sin sesión → login.html

const estadoPedidos = document.querySelector('#estado-pedidos');
const tabla = document.querySelector('#tabla-pedidos');
const cuerpoTabla = document.querySelector('#cuerpo-tabla');
const filtroEstado = document.querySelector('#filtro-estado');
const resumen = document.querySelector('#resumen');

let pedidos = []; // copia local de los pedidos del cliente

// Patrón 1: cargar con estados (carga → datos / vacío / error)
async function cargarPedidos() {
    tabla.hidden = true;
    mostrarCarga(estadoPedidos, 'Cargando tus pedidos…');

    const respuesta = await listarMisPedidos();
    if (!respuesta.ok) {
        mostrarVacio(estadoPedidos, 'No pudimos cargar tus pedidos.');
        mostrarAviso(respuesta.error, 'error');
        return;
    }

    pedidos = respuesta.data;
    pintarPedidos();
}

// Patrón 5: filtrar datos
function aplicarFiltros() {
    const estado = filtroEstado.value;
    return pedidos.filter((p) => estado === '' || p.estado === estado);
}

// Patrón 2: dibujar con el DOM (textContent, nunca innerHTML)
function crearCelda(texto) {
    const celda = document.createElement('td');
    celda.textContent = texto;
    return celda;
}

function crearInsignia(estado) {
    const insignia = document.createElement('span');
    insignia.className = `insignia insignia-${estado}`;
    insignia.textContent = estado;
    return insignia;
}

function crearFila(pedido) {
    const fila = document.createElement('tr');

    const celdaEstado = document.createElement('td');
    celdaEstado.append(crearInsignia(pedido.estado));

    const celdaAcciones = document.createElement('td');
    if (pedido.estado === 'pendiente') { // solo los pendientes se pueden cancelar
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.textContent = 'Cancelar';
        boton.className = 'boton boton-peligro';
        boton.dataset.accion = 'cancelar';
        boton.dataset.id = pedido.id;
        celdaAcciones.append(boton);
    }

    fila.append(
        crearCelda(formatearFecha(pedido.creadoEn)),
        crearCelda(pedido.productoNombre),
        crearCelda(pedido.cantidad),
        crearCelda(formatearPrecio(pedido.total)),
        celdaEstado,
        crearCelda(pedido.nota || '—'),
        celdaAcciones,
    );
    return fila;
}

function mostrarSinPedidos() {
    tabla.hidden = true;
    resumen.textContent = '';

    if (pedidos.length === 0) {
        mostrarVacio(estadoPedidos, 'Todavía no tienes pedidos. ');
        const enlace = document.createElement('a');
        enlace.href = 'catalogo.html';
        enlace.textContent = 'Ver el catálogo';
        estadoPedidos.firstElementChild.append(enlace);
    } else {
        mostrarVacio(estadoPedidos, 'Ningún pedido coincide con ese estado.');
    }
}

function pintarPedidos() {
    const visibles = aplicarFiltros();

    if (visibles.length === 0) {
        mostrarSinPedidos();
        return;
    }

    // Total gastado: no cuenta los cancelados
    const gastado = visibles
        .filter((p) => p.estado !== 'cancelado')
        .reduce((suma, p) => suma + p.total, 0);

    resumen.textContent = `${visibles.length} pedido(s) · total gastado ${formatearPrecio(gastado)}`;
    estadoPedidos.replaceChildren();
    tabla.hidden = false;
    cuerpoTabla.replaceChildren(...visibles.map(crearFila));
}

// Patrón 3: un solo listener para todos los botones (delegación)
cuerpoTabla.addEventListener('click', async (evento) => {
    const boton = evento.target.closest('button[data-accion]');
    if (!boton) return;

    const { accion, id } = boton.dataset;
    if (accion !== 'cancelar') return;

    const seguro = await confirmar('¿Cancelar este pedido? No se puede deshacer.');
    if (!seguro) return;

    botonOcupado(boton, true, 'Cancelando…');
    const respuesta = await cancelarPedido(id);
    if (!respuesta.ok) {
        mostrarAviso(respuesta.error, 'error');
        botonOcupado(boton, false);
        return;
    }

    mostrarAviso('Pedido cancelado.', 'exito');
    await cargarPedidos(); // volver a leer de Firestore
});

filtroEstado.addEventListener('change', pintarPedidos);
document.querySelector('#filtros').addEventListener('submit', (e) => e.preventDefault());

// Aviso que llega desde pedido.html (?nuevo=1)
if (new URLSearchParams(location.search).get('nuevo') === '1') {
    mostrarAviso('Pedido enviado. Te avisaremos cuando se confirme.', 'exito');
    history.replaceState(null, '', 'mis-pedidos.html'); // para que no se repita al recargar
}

await cargarPedidos();
