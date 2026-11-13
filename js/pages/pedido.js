// js/pages/pedido.js — formulario para pedir un producto (pedido.html?id=…)
import { exigirSesion } from '../services/auth.js';
import { obtenerProducto } from '../services/productos.js';
import { crearPedido } from '../services/pedidos.js';
import { mostrarCarga, mostrarVacio, mostrarAviso, botonOcupado } from '../ui/ui.js';
import { formatearPrecio } from '../utils/formato.js';

await exigirSesion(); // sin sesión → login.html, y después regresa aquí

const productoId = new URLSearchParams(location.search).get('id');
const zona = document.querySelector('#detalle-producto');
const formulario = document.querySelector('#form-pedido');
const { cantidad, nota } = formulario.elements;
const total = document.querySelector('#total');
const boton = formulario.querySelector('button[type="submit"]');

// Dibuja la ficha del producto: foto, nombre, precio y unidades disponibles.
function pintarProducto(producto) {
    const imagen = document.createElement('img');
    imagen.src = producto.imagen;
    imagen.alt = producto.nombre;

    const nombre = document.createElement('h2');
    nombre.textContent = producto.nombre;

    const precio = document.createElement('p');
    precio.className = 'precio';
    precio.textContent = formatearPrecio(producto.precio);

    const disponibles = document.createElement('p');
    disponibles.textContent = `Disponibles: ${producto.stock}`;

    const ficha = document.createElement('article');
    ficha.className = 'ficha-producto';
    ficha.append(imagen, nombre, precio, disponibles);
    zona.replaceChildren(ficha);
}

mostrarCarga(zona, 'Cargando producto…');
const respuesta = await obtenerProducto(productoId);
const producto = respuesta.data;

if (!respuesta.ok || !producto.activo || producto.stock === 0) {
    mostrarVacio(zona, 'Este producto no está disponible por ahora.');
    formulario.hidden = true;
} else {
    pintarProducto(producto);
    cantidad.max = producto.stock; // validación HTML

    // Total en vivo mientras se escribe la cantidad.
    const actualizarTotal = () => {
        total.textContent = formatearPrecio((Number(cantidad.value) || 0) * producto.precio);
    };
    actualizarTotal();
    cantidad.addEventListener('input', actualizarTotal);

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const unidades = Number(cantidad.value);

        // Reglas del negocio (la API y las reglas de Firestore las vuelven a revisar).
        if (!Number.isInteger(unidades) || unidades < 1) {
            mostrarAviso('La cantidad debe ser un número entero mayor que 0.', 'error');
            return;
        }
        if (unidades > producto.stock) {
            mostrarAviso(`Solo hay ${producto.stock} unidad(es) disponibles.`, 'error');
            return;
        }

        botonOcupado(boton, true, 'Enviando pedido…');
        try {
            const resultado = await crearPedido({ productoId, cantidad: unidades, nota: nota.value });
            if (!resultado.ok) {
                mostrarAviso(resultado.error, 'error');
                return;
            }
            location.href = 'mis-pedidos.html?nuevo=1'; // allí se muestra "Pedido enviado"
        } finally {
            botonOcupado(boton, false);
        }
    });
}
