// js/pages/admin-productos.js — CRUD de productos e indicadores de inventario (solo admin)
import { exigirSesion } from '../services/auth.js';
import { listarProductos, crearProducto, actualizarProducto, eliminarProducto } from '../services/productos.js';
import { cargarSemilla } from '../services/semilla.js';
import {
    mostrarCarga, mostrarVacio, mostrarAviso, botonOcupado, confirmar, crearCelda,
} from '../ui/ui.js';
import { formatearPrecio } from '../utils/formato.js';

await exigirSesion('admin'); // comodidad: la protección real está en firestore.rules

const formulario = document.querySelector('#form-producto');
const campos = formulario.elements;
const tituloFormulario = document.querySelector('#titulo-formulario');
const botonGuardar = formulario.querySelector('button[type="submit"]');
const botonCancelar = document.querySelector('#btn-cancelar');
const botonSemilla = document.querySelector('#btn-semilla');
const estadoProductos = document.querySelector('#estado-productos');
const tabla = document.querySelector('#tabla-productos');
const cuerpoTabla = document.querySelector('#cuerpo-tabla');

const STOCK_BAJO = 2; // con 2 unidades o menos hay que reponer

let productos = []; // copia local de todos los productos (activos e inactivos)

// Patrón 1: cargar con estados (carga → datos / vacío / error)
async function cargarProductos() {
    tabla.hidden = true;
    mostrarCarga(estadoProductos, 'Cargando productos…');

    const respuesta = await listarProductos();
    if (!respuesta.ok) {
        mostrarVacio(estadoProductos, 'No pudimos cargar los productos.');
        mostrarAviso(respuesta.error, 'error');
        return;
    }

    productos = respuesta.data;
    botonSemilla.hidden = productos.length > 0; // la carga inicial solo se ofrece con la base vacía
    pintarIndicadores();
    pintarTabla();
}

function tieneStockBajo(producto) {
    return producto.activo && producto.stock <= STOCK_BAJO;
}

// Indicadores: valor del inventario, unidades y productos por reponer.
function pintarIndicadores() {
    const valor = productos.reduce((suma, p) => suma + p.precio * p.stock, 0);
    const unidades = productos.reduce((suma, p) => suma + p.stock, 0);
    const porReponer = productos.filter(tieneStockBajo);

    document.querySelector('#ind-valor').textContent = formatearPrecio(valor);
    document.querySelector('#ind-unidades').textContent = unidades;
    document.querySelector('#ind-stock-bajo').textContent = porReponer.length;

    const nombres = porReponer.map((p) => `${p.nombre} (${p.stock})`).join(', ');
    document.querySelector('#detalle-stock-bajo').textContent = porReponer.length === 0
        ? 'Ningún producto visible tiene stock bajo.'
        : `Por reponer: ${nombres}.`;
}

// Patrón 2: dibujar con el DOM
function textoEstado(producto) {
    if (!producto.activo) return 'Oculto';
    if (producto.stock === 0) return 'Agotado';
    if (producto.stock <= STOCK_BAJO) return 'Stock bajo';
    return 'Disponible';
}

function crearBoton(texto, clase, accion, id) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = `boton ${clase}`;
    boton.textContent = texto;
    boton.dataset.accion = accion;
    boton.dataset.id = id;
    return boton;
}

function crearFila(producto) {
    const acciones = crearCelda('');
    acciones.append(
        crearBoton('Editar', 'boton-claro', 'editar', producto.id),
        crearBoton('Eliminar', 'boton-peligro', 'eliminar', producto.id),
    );

    const fila = document.createElement('tr');
    if (tieneStockBajo(producto)) fila.className = 'stock-bajo';
    fila.append(
        crearCelda(producto.nombre),
        crearCelda(producto.linea),
        crearCelda(formatearPrecio(producto.precio)),
        crearCelda(producto.stock),
        crearCelda(textoEstado(producto)),
        acciones,
    );
    return fila;
}

function pintarTabla() {
    if (productos.length === 0) {
        mostrarVacio(estadoProductos, 'Todavía no hay productos. Carga los datos iniciales o registra uno.');
        return;
    }

    estadoProductos.replaceChildren();
    tabla.hidden = false;
    cuerpoTabla.replaceChildren(...productos.map(crearFila));
}

// Formulario: el mismo sirve para crear (sin id) y para editar (con id).
function leerFormulario() {
    return {
        nombre: campos.nombre.value.trim(),
        linea: campos.linea.value.trim(),
        precio: Number(campos.precio.value),
        stock: Number(campos.stock.value),
        materiales: campos.materiales.value.trim(),
        variantes: campos.variantes.value.split(',').map((v) => v.trim()).filter((v) => v !== ''),
        imagen: campos.imagen.value.trim(),
        descripcion: campos.descripcion.value.trim(),
        activo: campos.activo.checked,
    };
}

function llenarFormulario(producto) {
    campos.productoId.value = producto.id;
    campos.nombre.value = producto.nombre;
    campos.linea.value = producto.linea;
    campos.precio.value = producto.precio;
    campos.stock.value = producto.stock;
    campos.materiales.value = producto.materiales;
    campos.variantes.value = producto.variantes.join(', ');
    campos.imagen.value = producto.imagen;
    campos.descripcion.value = producto.descripcion;
    campos.activo.checked = producto.activo;

    tituloFormulario.textContent = `Editar: ${producto.nombre}`;
    botonCancelar.hidden = false;
    formulario.scrollIntoView({ behavior: 'smooth' });
    campos.nombre.focus();
}

function limpiarFormulario() {
    formulario.reset();
    campos.productoId.value = '';
    tituloFormulario.textContent = 'Nuevo producto';
    botonCancelar.hidden = true;
}

// Patrón 4: formulario con validación (HTML + reglas del negocio)
formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!formulario.checkValidity()) {
        formulario.reportValidity();
        return;
    }

    const id = campos.productoId.value;
    const datos = leerFormulario();

    // Regla del negocio: no puede haber dos productos con el mismo nombre.
    const repetido = productos.some((p) => p.id !== id && p.nombre.toLowerCase() === datos.nombre.toLowerCase());
    if (repetido) {
        mostrarAviso('Ya existe un producto con ese nombre.', 'error');
        return;
    }

    botonOcupado(botonGuardar, true, 'Guardando…');
    try {
        const respuesta = id ? await actualizarProducto(id, datos) : await crearProducto(datos);
        if (!respuesta.ok) {
            mostrarAviso(respuesta.error, 'error'); // ej. "El precio debe ser mayor que $0."
            return;
        }
        mostrarAviso(id ? 'Producto actualizado.' : 'Producto creado.', 'exito');
        limpiarFormulario();
        await cargarProductos(); // volver a leer de Firestore
    } finally {
        botonOcupado(botonGuardar, false);
    }
});

botonCancelar.addEventListener('click', limpiarFormulario);

// Patrón 3: un solo listener para los botones de la tabla (delegación)
cuerpoTabla.addEventListener('click', async (evento) => {
    const boton = evento.target.closest('button[data-accion]');
    if (!boton) return;

    const producto = productos.find((p) => p.id === boton.dataset.id);
    if (boton.dataset.accion === 'editar') {
        llenarFormulario(producto);
        return;
    }

    const seguro = await confirmar(`¿Eliminar "${producto.nombre}"? No se puede deshacer.`);
    if (!seguro) return;

    botonOcupado(boton, true, 'Eliminando…');
    const respuesta = await eliminarProducto(producto.id);
    if (!respuesta.ok) {
        mostrarAviso(respuesta.error, 'error');
        botonOcupado(boton, false);
        return;
    }

    mostrarAviso('Producto eliminado.', 'exito');
    if (campos.productoId.value === producto.id) limpiarFormulario(); // se estaba editando
    await cargarProductos();
});

// Carga inicial: sube los productos y pedidos de js/data/datos-iniciales.js
botonSemilla.addEventListener('click', async () => {
    botonOcupado(botonSemilla, true, 'Cargando datos…');
    try {
        const respuesta = await cargarSemilla();
        if (!respuesta.ok) {
            mostrarAviso(respuesta.error, 'error');
            return;
        }

        const { productos: cantidadProductos, pedidos, omitidos } = respuesta.data;
        mostrarAviso(`Datos cargados: ${cantidadProductos} productos y ${pedidos} pedidos.`, 'exito');
        if (omitidos > 0) {
            mostrarAviso(`${omitidos} pedido(s) omitidos: sus clientes aún no se han registrado.`, 'info');
        }
        await cargarProductos();
    } finally {
        botonOcupado(botonSemilla, false);
    }
});

await cargarProductos();
