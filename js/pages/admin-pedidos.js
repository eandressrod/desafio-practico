// js/pages/admin-pedidos.js — gestión de pedidos e indicadores (solo admin)
import { exigirSesion } from '../services/auth.js';
import { listarPedidos, cambiarEstadoPedido } from '../services/pedidos.js';
import {
    mostrarCarga, mostrarVacio, mostrarAviso, botonOcupado, confirmar, crearCelda, crearInsignia,
} from '../ui/ui.js';
import { formatearPrecio, formatearFecha } from '../utils/formato.js';

await exigirSesion('admin'); // comodidad: la protección real está en firestore.rules

const estadoPedidos = document.querySelector('#estado-pedidos');
const tabla = document.querySelector('#tabla-pedidos');
const cuerpoTabla = document.querySelector('#cuerpo-tabla');
const buscador = document.querySelector('#buscar');
const filtroEstado = document.querySelector('#filtro-estado');
const orden = document.querySelector('#orden');
const resumen = document.querySelector('#resumen');

// Regla del negocio: qué botones se muestran según el estado actual del pedido.
const ACCIONES = {
    pendiente: [{ estado: 'confirmado', texto: 'Confirmar' }, { estado: 'cancelado', texto: 'Cancelar' }],
    confirmado: [{ estado: 'entregado', texto: 'Marcar entregado' }],
    entregado: [],
    cancelado: [],
};

let pedidos = []; // copia local de todos los pedidos (vienen del más reciente al más antiguo)

// Patrón 1: cargar con estados (carga → datos / vacío / error)
async function cargarPedidos() {
    tabla.hidden = true;
    mostrarCarga(estadoPedidos, 'Cargando pedidos…');

    const respuesta = await listarPedidos();
    if (!respuesta.ok) {
        mostrarVacio(estadoPedidos, 'No pudimos cargar los pedidos.');
        mostrarAviso(respuesta.error, 'error');
        return;
    }

    pedidos = respuesta.data;
    pintarIndicadores();
    pintarPedidos();
}

// Patrón 5: búsqueda por cliente o producto + filtro por estado + orden por fecha
function aplicarFiltros() {
    const texto = buscador.value.trim().toLowerCase();
    const estado = filtroEstado.value;

    const resultado = pedidos.filter((p) =>
        (estado === '' || p.estado === estado)
        && `${p.clienteNombre} ${p.productoNombre}`.toLowerCase().includes(texto));

    // filter devuelve un arreglo nuevo, así que reverse no altera "pedidos".
    return orden.value === 'antiguos' ? resultado.reverse() : resultado;
}

// Cuenta elementos por grupo: { pendiente: 3, confirmado: 1, … }
function contarPor(lista, obtenerGrupo, obtenerCantidad = () => 1) {
    return lista.reduce((grupos, item) => {
        const grupo = obtenerGrupo(item);
        grupos[grupo] = (grupos[grupo] || 0) + obtenerCantidad(item);
        return grupos;
    }, {});
}

// Indicadores: pedidos por estado, ingresos confirmados y producto más pedido.
function pintarIndicadores() {
    const porEstado = contarPor(pedidos, (p) => p.estado);
    for (const estado of Object.keys(ACCIONES)) {
        document.querySelector(`#ind-${estado}`).textContent = porEstado[estado] || 0;
    }

    const ingresos = pedidos
        .filter((p) => p.estado === 'confirmado' || p.estado === 'entregado')
        .reduce((suma, p) => suma + p.total, 0);
    document.querySelector('#ind-ingresos').textContent = formatearPrecio(ingresos);

    const vigentes = pedidos.filter((p) => p.estado !== 'cancelado');
    const unidades = contarPor(vigentes, (p) => p.productoNombre, (p) => p.cantidad);
    const [masPedido] = Object.entries(unidades).sort((a, b) => b[1] - a[1]);
    document.querySelector('#ind-producto-top').textContent =
        masPedido ? `${masPedido[0]} (${masPedido[1]} u.)` : '—';
}

// Patrón 2: dibujar con el DOM
function crearBotonesAccion(pedido) {
    return ACCIONES[pedido.estado].map(({ estado, texto }) => {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = estado === 'cancelado' ? 'boton boton-peligro' : 'boton boton-principal';
        boton.textContent = texto;
        boton.dataset.id = pedido.id;
        boton.dataset.estado = estado;
        return boton;
    });
}

function crearFila(pedido) {
    const acciones = crearCelda('');
    acciones.append(...crearBotonesAccion(pedido));

    const fila = document.createElement('tr');
    fila.append(
        crearCelda(pedido.clienteNombre),
        crearCelda(pedido.productoNombre),
        crearCelda(pedido.cantidad),
        crearCelda(formatearPrecio(pedido.total)),
        crearCelda(formatearFecha(pedido.creadoEn)),
        crearCelda(crearInsignia(pedido.estado)),
        acciones,
    );
    return fila;
}

function pintarPedidos() {
    const visibles = aplicarFiltros();
    resumen.textContent = `${visibles.length} de ${pedidos.length} pedidos`;

    if (visibles.length === 0) {
        tabla.hidden = true;
        mostrarVacio(estadoPedidos, pedidos.length === 0
            ? 'Todavía no hay pedidos.'
            : 'Ningún pedido coincide con la búsqueda.');
        return;
    }

    estadoPedidos.replaceChildren();
    tabla.hidden = false;
    cuerpoTabla.replaceChildren(...visibles.map(crearFila));
}

// Patrón 3: un solo listener para todos los botones de la tabla (delegación)
cuerpoTabla.addEventListener('click', async (evento) => {
    const boton = evento.target.closest('button[data-estado]');
    if (!boton) return;

    const { id, estado } = boton.dataset;
    const seguro = await confirmar(`¿Cambiar el pedido a "${estado}"?`);
    if (!seguro) return;

    botonOcupado(boton, true, 'Actualizando…');
    const respuesta = await cambiarEstadoPedido(id, estado);
    if (!respuesta.ok) {
        mostrarAviso(respuesta.error, 'error'); // ej. "No hay stock suficiente…"
        botonOcupado(boton, false);
        return;
    }

    mostrarAviso('Pedido actualizado.', 'exito');
    await cargarPedidos(); // volver a leer de Firestore (stock e indicadores cambian)
});

buscador.addEventListener('input', pintarPedidos);
filtroEstado.addEventListener('change', pintarPedidos);
orden.addEventListener('change', pintarPedidos);
document.querySelector('#filtros').addEventListener('submit', (e) => e.preventDefault());

await cargarPedidos();
