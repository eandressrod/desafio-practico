// Carga de datos iniciales (solo administrador, con la base de productos vacía).
// Los datos están en js/data/datos-iniciales.js:
//   productosIniciales: productos reales de MIAH
//   pedidosIniciales:   pedidos de ejemplo, relacionados por nombre de producto y correo del cliente
// Los clientes de los pedidos deben haberse registrado antes; si no, ese pedido se omite.

import {
  collection, doc, getDocs, query, limit, writeBatch, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
import { db } from '../firebase.js';
import { exito, fallo, errorNegocio } from './respuestas.js';
import { productosIniciales, pedidosIniciales } from '../data/datos-iniciales.js';

export async function cargarSemilla() {
  try {
    const yaHayProductos = await getDocs(query(collection(db, 'productos'), limit(1)));
    if (!yaHayProductos.empty) {
      throw errorNegocio('Ya hay productos cargados. La carga inicial solo se hace con la base vacía.');
    }

    // Un lote (batch) guarda todo junto: o se guarda todo, o nada.
    const lote = writeBatch(db);

    const productoPorNombre = {};
    for (const producto of productosIniciales) {
      const referencia = doc(collection(db, 'productos'));
      lote.set(referencia, { ...producto, creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp() });
      productoPorNombre[producto.nombre] = { id: referencia.id, ...producto };
    }

    const usuarios = await getDocs(collection(db, 'usuarios'));
    const clientePorCorreo = {};
    usuarios.forEach((usuario) => {
      clientePorCorreo[usuario.data().correo] = { id: usuario.id, ...usuario.data() };
    });

    let pedidosCargados = 0;
    for (const pedido of pedidosIniciales) {
      const producto = productoPorNombre[pedido.productoNombre];
      const cliente = clientePorCorreo[pedido.clienteCorreo];
      if (!producto || !cliente) continue; // sin producto o sin cliente registrado: se omite
      lote.set(doc(collection(db, 'pedidos')), {
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        productoId: producto.id,
        productoNombre: producto.nombre,
        cantidad: pedido.cantidad,
        precioUnitario: producto.precio,
        total: pedido.cantidad * producto.precio,
        estado: pedido.estado,
        nota: pedido.nota || '',
        creadoEn: serverTimestamp(),
      });
      pedidosCargados++;
    }

    await lote.commit();
    return exito({
      productos: productosIniciales.length,
      pedidos: pedidosCargados,
      omitidos: pedidosIniciales.length - pedidosCargados,
    });
  } catch (error) {
    return fallo(error);
  }
}
