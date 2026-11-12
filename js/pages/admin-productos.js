
// ================================================
// MIAH - ADMINISTRACIÓN DE PRODUCTOS
// Responsable: Pablo
// Proceso P1: Catálogo e inventario
// ================================================

// Servicios existentes de Eandress.
import { exigirSesion } from '../services/auth.js';

import {
    listarProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto
} from '../services/productos.js';

import { cargarSemilla } from '../services/semilla.js';

// Utilidades compartidas de DMoralGar.
import {
    mostrarCarga,
    mostrarVacio,
    mostrarAviso,
    botonOcupado,
    confirmar
} from '../ui/ui.js';

// Utilidad de formato de Pablo.
import { formatearPrecio } from '../utils/formato.js';


// ================================================
// ELEMENTOS DEL HTML
// ================================================

const formulario = document.querySelector('#form-producto');

const botonGuardar = document.querySelector('#btn-guardar');

const botonCancelarEdicion = document.querySelector(
    '#btn-cancelar-edicion'
);

const botonSemilla = document.querySelector('#btn-semilla');

const estadoProductos = document.querySelector('#estado-productos');

const cuerpoTabla = document.querySelector('#cuerpo-productos');

const indicadorValor = document.querySelector('#indicador-valor');

const indicadorUnidades = document.querySelector(
    '#indicador-unidades'
);

const indicadorStockBajo = document.querySelector(
    '#indicador-stock-bajo'
);

const listaStockBajo = document.querySelector(
    '#lista-stock-bajo'
);


// Productos obtenidos desde Firestore.
let productos = [];

// Cantidad máxima para considerar stock bajo.
const STOCK_MINIMO = 2;


// ================================================
// LEER FORMULARIO
// ================================================

function leerFormulario() {

    const f = formulario.elements;

    return {
        nombre: f.nombre.value.trim(),

        linea: f.linea.value.trim(),

        descripcion: f.descripcion.value.trim(),

        materiales: f.materiales.value.trim(),

        variantes: f.variantes.value
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean),

        precio: Number(f.precio.value),

        stock: Number(f.stock.value),

        imagen: f.imagen.value.trim(),

        activo: f.activo.checked
    };
}


// ================================================
// VALIDAR PRODUCTO
// ================================================

function validarProducto(producto) {

    if (producto.nombre.length < 3) {
        return 'El nombre debe tener al menos 3 caracteres.';
    }

    if (!(producto.precio > 0)) {
        return 'El precio debe ser mayor que $0.';
    }

    if (
        !Number.isInteger(producto.stock) ||
        producto.stock < 0
    ) {
        return 'El stock debe ser un entero, 0 o mayor.';
    }

    // Comprobar que no exista otro producto con el mismo nombre.
    const idActual = formulario.elements.productoId.value;

    const repetido = productos.some((otro) =>
        otro.nombre.toLowerCase() === producto.nombre.toLowerCase()
        && otro.id !== idActual
    );

    if (repetido) {
        return 'Ya existe un producto con ese nombre.';
    }

    return null;
}


// ================================================
// LIMPIAR FORMULARIO
// ================================================

function limpiarFormulario() {

    formulario.reset();

    formulario.elements.productoId.value = '';

    botonCancelarEdicion.hidden = true;

    botonGuardar.textContent = 'Guardar producto';
}


// ================================================
// CREAR O ACTUALIZAR PRODUCTO
// ================================================

formulario.addEventListener('submit', async (evento) => {

    evento.preventDefault();

    // Validar los campos HTML.
    if (!formulario.checkValidity()) {
        formulario.reportValidity();
        return;
    }

    const datos = leerFormulario();

    // Validar las reglas del negocio.
    const error = validarProducto(datos);

    if (error) {
        mostrarAviso(error, 'error');
        return;
    }

    const id = formulario.elements.productoId.value;

    botonOcupado(botonGuardar, true, 'Guardando…');

    try {

        // Si existe ID, actualizar.
        // Si no existe, crear.
        const respuesta = id
            ? await actualizarProducto(id, datos)
            : await crearProducto(datos);

        if (!respuesta.ok) {
            mostrarAviso(respuesta.error, 'error');
            return;
        }

        mostrarAviso(
            id
                ? 'Producto actualizado.'
                : 'Producto creado.',
            'exito'
        );

        limpiarFormulario();

        // Volver a leer los productos desde Firestore.
        await cargarProductos();

    } catch (error) {

        console.error('Error al guardar el producto:', error);

        mostrarAviso(
            'Ocurrió un error al guardar el producto.',
            'error'
        );

    } finally {

        botonOcupado(botonGuardar, false);

    }

});


// ================================================
// CALCULAR INDICADORES
// ================================================

function calcularIndicadores(lista) {

    // Valor total: precio multiplicado por stock.
    const valorInventario = lista.reduce(
        (suma, p) => suma + p.precio * p.stock,
        0
    );

    // Sumar todas las unidades.
    const unidades = lista.reduce(
        (suma, p) => suma + p.stock,
        0
    );

    // Productos activos con stock igual o menor a 2.
    const stockBajo = lista.filter(
        (p) => p.activo && p.stock <= STOCK_MINIMO
    );

    // Contar productos por línea.
    const porLinea = lista.reduce((grupos, p) => {

        grupos[p.linea] = (grupos[p.linea] || 0) + 1;

        return grupos;

    }, {});

    return {
        valorInventario,
        unidades,
        stockBajo,
        porLinea
    };
}


// ================================================
// MOSTRAR INDICADORES
// ================================================

function pintarIndicadores() {

    const {
        valorInventario,
        unidades,
        stockBajo
    } = calcularIndicadores(productos);

    // Actualizar las tarjetas.
    indicadorValor.textContent =
        formatearPrecio(valorInventario);

    indicadorUnidades.textContent = unidades;

    indicadorStockBajo.textContent = stockBajo.length;

    // Mostrar productos con stock bajo.
    if (stockBajo.length === 0) {

        const mensaje = document.createElement('li');

        mensaje.textContent =
            'No hay productos activos con stock bajo.';

        listaStockBajo.replaceChildren(mensaje);

        return;
    }

    const elementos = stockBajo.map((producto) => {

        const li = document.createElement('li');

        li.textContent =
            `${producto.nombre}: ${producto.stock} unidad(es)`;

        return li;

    });

    listaStockBajo.replaceChildren(...elementos);
}


// ================================================
// CREAR CELDA DE TABLA
// ================================================

function crearCelda(texto) {

    const celda = document.createElement('td');

    celda.textContent = texto;

    return celda;
}


// ================================================
// CREAR FILA DE PRODUCTO
// ================================================

function crearFila(producto) {

    const fila = document.createElement('tr');

    let estado;

    if (!producto.activo) {
        estado = 'Inactivo';
    } else if (producto.stock === 0) {
        estado = 'Agotado';
    } else if (producto.stock <= STOCK_MINIMO) {
        estado = 'Stock bajo';
    } else {
        estado = 'Disponible';
    }

    // Resaltar los productos activos con stock bajo.
    if (producto.activo && producto.stock <= STOCK_MINIMO) {
        fila.classList.add('stock-bajo');
    }

    fila.append(
        crearCelda(producto.nombre),
        crearCelda(producto.linea),
        crearCelda(formatearPrecio(producto.precio)),
        crearCelda(producto.stock),
        crearCelda(estado)
    );

    // Columna de acciones.
    const celdaAcciones = document.createElement('td');

    const botonEditar = document.createElement('button');

    botonEditar.type = 'button';
    botonEditar.textContent = 'Editar';
    botonEditar.dataset.accion = 'editar';
    botonEditar.dataset.id = producto.id;

    const botonEliminar = document.createElement('button');

    botonEliminar.type = 'button';
    botonEliminar.textContent = 'Eliminar';
    botonEliminar.dataset.accion = 'eliminar';
    botonEliminar.dataset.id = producto.id;

    celdaAcciones.append(botonEditar, botonEliminar);

    fila.append(celdaAcciones);

    return fila;
}


// ================================================
// PINTAR TABLA
// ================================================

function pintarTabla() {

    if (productos.length === 0) {

        mostrarVacio(
            estadoProductos,
            'No hay productos registrados.'
        );

        cuerpoTabla.replaceChildren();

        return;
    }

    estadoProductos.replaceChildren();

    const filas = productos.map(crearFila);

    cuerpoTabla.replaceChildren(...filas);
}


// ================================================
// CARGAR PRODUCTOS DESDE FIRESTORE
// ================================================

async function cargarProductos() {

    mostrarCarga(
        estadoProductos,
        'Cargando productos…'
    );

    try {

        const respuesta = await listarProductos();

        if (!respuesta.ok) {

            botonSemilla.hidden = true;

            cuerpoTabla.replaceChildren();

            mostrarAviso(respuesta.error, 'error');

            const mensaje = document.createElement('p');

            mensaje.className = 'estado estado-error';
            mensaje.textContent = respuesta.error;
            mensaje.setAttribute('role', 'alert');

            estadoProductos.replaceChildren(mensaje);

            return;
        }

        // Guardar todos los productos, activos e inactivos.
        productos = respuesta.data;

        // Actualizar tabla e indicadores.
        pintarTabla();

        pintarIndicadores();

        // Mostrar carga inicial únicamente si no hay productos.
        botonSemilla.hidden = productos.length > 0;

    } catch (error) {

        console.error('Error al cargar productos:', error);

        botonSemilla.hidden = true;

        mostrarAviso(
            'No se pudieron cargar los productos.',
            'error'
        );

    }

}


// ================================================
// EDITAR Y ELIMINAR CON DELEGACIÓN DE EVENTOS
// ================================================

cuerpoTabla.addEventListener('click', async (evento) => {

    const boton = evento.target.closest('button[data-accion]');

    if (!boton) {
        return;
    }

    const id = boton.dataset.id;

    const producto = productos.find(
        (p) => p.id === id
    );

    if (!producto) {

        mostrarAviso(
            'No se encontró el producto seleccionado.',
            'error'
        );

        return;
    }

    // --------------------------------------------
    // EDITAR PRODUCTO
    // --------------------------------------------

    if (boton.dataset.accion === 'editar') {

        const f = formulario.elements;

        f.productoId.value = producto.id;

        f.nombre.value = producto.nombre;

        f.linea.value = producto.linea;

        f.precio.value = producto.precio;

        f.stock.value = producto.stock;

        f.materiales.value = producto.materiales;

        f.variantes.value = Array.isArray(producto.variantes)
            ? producto.variantes.join(', ')
            : '';

        f.imagen.value = producto.imagen;

        f.descripcion.value = producto.descripcion;

        f.activo.checked = producto.activo;

        botonCancelarEdicion.hidden = false;

        botonGuardar.textContent = 'Actualizar producto';

        f.nombre.focus();

        formulario.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        return;
    }

    // --------------------------------------------
    // ELIMINAR PRODUCTO
    // --------------------------------------------

    if (boton.dataset.accion === 'eliminar') {

        const seguro = await confirmar(
            `¿Eliminar "${producto.nombre}"? No se puede deshacer.`
        );

        if (!seguro) {
            return;
        }

        botonOcupado(boton, true, 'Eliminando…');

        try {

            const respuesta = await eliminarProducto(producto.id);

            if (!respuesta.ok) {

                mostrarAviso(respuesta.error, 'error');

                return;
            }

            mostrarAviso(
                'Producto eliminado.',
                'exito'
            );

            await cargarProductos();

        } catch (error) {

            console.error('Error al eliminar producto:', error);

            mostrarAviso(
                'No se pudo eliminar el producto.',
                'error'
            );

        } finally {

            botonOcupado(boton, false);

        }

    }

});


// ================================================
// CANCELAR EDICIÓN
// ================================================

botonCancelarEdicion.addEventListener('click', () => {

    limpiarFormulario();

});


// ================================================
// CARGAR DATOS INICIALES
// ================================================

botonSemilla.addEventListener('click', async () => {

    // Evitar cargar datos si ya existen productos.
    if (productos.length > 0) {
        botonSemilla.hidden = true;
        return;
    }

    botonOcupado(
        botonSemilla,
        true,
        'Cargando datos…'
    );

    try {

        const respuesta = await cargarSemilla();

        if (!respuesta.ok) {

            mostrarAviso(respuesta.error, 'error');

            return;
        }

        const datos = respuesta.data;

        mostrarAviso(
            `Datos iniciales cargados: ${datos.productos} productos y ${datos.pedidos} pedidos.`,
            'exito'
        );

        if (datos.omitidos > 0) {
            mostrarAviso(
                `${datos.omitidos} pedidos fueron omitidos porque no se encontraron sus clientes o productos.`,
                'info'
            );
        }

        // Volver a consultar Firestore.
        await cargarProductos();

    } catch (error) {

        console.error('Error al cargar datos iniciales:', error);

        mostrarAviso(
            'No se pudieron cargar los datos iniciales.',
            'error'
        );

    } finally {

        botonOcupado(botonSemilla, false);

    }

});


// ================================================
// INICIO Y PROTECCIÓN DE LA PÁGINA
// ================================================

// Solo puede continuar un usuario con rol administrador.
await exigirSesion('admin');

// Cargar los productos al entrar.
await cargarProductos();
