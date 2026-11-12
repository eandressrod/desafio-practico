import { exigirSesion } from '../services/auth.js';
import { obtenerProducto } from '../services/productos.js';
import { crearPedido } from '../services/pedidos.js';
import { mostrarCarga, mostrarVacio, mostrarAviso, botonOcupado } from '../ui/ui.js';
import { formatearPrecio } from '../utils/formato.js';

const productoId = new URLSearchParams(location.search).get('id');
await exigirSesion(); // sin sesión → login.html

const zona = document.querySelector('#detalle-producto');
const formulario = document.querySelector('#form-pedido');
const campoCantidad = formulario.elements.cantidad;
const total = document.querySelector('#total');

mostrarCarga(zona, 'Cargando producto…');
const respuesta = await obtenerProducto(productoId);
if (!respuesta.ok || !respuesta.data.activo) {
    mostrarVacio(zona, 'Este producto no está disponible.');
    formulario.hidden = true;
} else {
    const producto = respuesta.data;
    pintarProducto(producto); // nombre, foto, precio, stock
    campoCantidad.max = producto.stock; // validación HTML
    campoCantidad.addEventListener('input', () => {
        const cantidad = Number(campoCantidad.value) || 0;
        total.textContent = formatearPrecio(cantidad * producto.precio);
    });

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const cantidad = Number(campoCantidad.value);
        if (!Number.isInteger(cantidad) || cantidad < 1) {
            mostrarAviso('La cantidad debe ser un número entero mayor que 0.', 'error'); return;
        }
        if (cantidad > producto.stock) { // regla del negocio
            mostrarAviso(`Solo hay ${producto.stock} unidad(es) disponibles.`, 'error'); return;
        }
        const boton = formulario.querySelector('button[type="submit"]');
        botonOcupado(boton, true, 'Enviando pedido…');
        try {
            const r = await crearPedido({ productoId, cantidad,
                nota: formulario.elements.nota.value.trim() });
            if (!r.ok) { mostrarAviso(r.error, 'error'); return; }
            location.href = 'mis-pedidos.html?nuevo=1'; // allí se muestra "Pedido enviado"
        } finally {
            botonOcupado(boton, false);
        }
    });
}
