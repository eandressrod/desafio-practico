// Servicio de pedidos: colección "pedidos", relacionada con "productos" y "usuarios".
// Estados: pendiente → confirmado → entregado, o pendiente → cancelado.

import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, orderBy, runTransaction, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
import { auth, db } from '../firebase.js';
import { exito, fallo, errorNegocio, convertirDoc } from './respuestas.js';

const pedidos = collection(db, 'pedidos');

// Cambios de estado que puede hacer el administrador (las reglas exigen lo mismo).
const TRANSICIONES = {
  pendiente: ['confirmado', 'cancelado'],
  confirmado: ['entregado'],
  entregado: [],
  cancelado: [],
};

const MAXIMO_POR_PEDIDO = 20;

// CREATE: el cliente con sesión pide un producto.
// El servicio completa el resto: cliente, nombre y precio del producto, total, estado y fecha.
export async function crearPedido({ productoId, cantidad, nota = '' }) {
  try {
    const usuario = auth.currentUser;
    if (!usuario) throw errorNegocio('Inicia sesión para hacer un pedido.');
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      throw errorNegocio('La cantidad debe ser un número entero mayor que 0.');
    }
    if (cantidad > MAXIMO_POR_PEDIDO) {
      throw errorNegocio(`Puedes pedir hasta ${MAXIMO_POR_PEDIDO} unidades por pedido.`);
    }

    const documentoProducto = await getDoc(doc(db, 'productos', productoId));
    if (!documentoProducto.exists() || !documentoProducto.data().activo) {
      throw errorNegocio('Este producto ya no está disponible.');
    }
    const producto = documentoProducto.data();
    if (cantidad > producto.stock) {
      throw errorNegocio(`Solo quedan ${producto.stock} unidad(es) de ${producto.nombre}.`);
    }

    // Nombre del cliente para que el administrador lo vea en la tabla.
    const documentoPerfil = await getDoc(doc(db, 'usuarios', usuario.uid));
    const clienteNombre = documentoPerfil.exists() ? documentoPerfil.data().nombre : usuario.email;

    const referencia = await addDoc(pedidos, {
      clienteId: usuario.uid,
      clienteNombre,
      productoId,
      productoNombre: producto.nombre,
      cantidad,
      precioUnitario: producto.precio,
      total: cantidad * producto.precio,
      estado: 'pendiente',
      nota: nota.trim(),
      creadoEn: serverTimestamp(),
    });
    return exito(referencia.id);
  } catch (error) {
    return fallo(error);
  }
}

// READ: pedidos del usuario con sesión.
export async function listarMisPedidos() {
  try {
    const usuario = auth.currentUser;
    if (!usuario) throw errorNegocio('Inicia sesión para ver tus pedidos.');
    const resultado = await getDocs(query(pedidos, where('clienteId', '==', usuario.uid)));
    // Se ordena aquí (del más reciente al más antiguo) porque combinar where y orderBy
    // en Firestore obliga a crear un índice compuesto.
    const lista = resultado.docs.map(convertirDoc);
    return exito(lista.sort((a, b) => b.creadoEn - a.creadoEn));
  } catch (error) {
    return fallo(error);
  }
}

// READ: todos los pedidos (solo administrador).
export async function listarPedidos() {
  try {
    const resultado = await getDocs(query(pedidos, orderBy('creadoEn', 'desc')));
    return exito(resultado.docs.map(convertirDoc));
  } catch (error) {
    return fallo(error);
  }
}

// UPDATE (administrador): cambia el estado de un pedido.
// Al confirmar se descuenta el stock en una transacción: se lee el stock actual,
// se verifica que alcance y se actualizan pedido y producto juntos, o ninguno.
export async function cambiarEstadoPedido(id, nuevoEstado) {
  try {
    await runTransaction(db, async (transaccion) => {
      const refPedido = doc(db, 'pedidos', id);
      const documentoPedido = await transaccion.get(refPedido);
      if (!documentoPedido.exists()) throw errorNegocio('El pedido ya no existe.');

      const pedido = documentoPedido.data();
      if (!TRANSICIONES[pedido.estado].includes(nuevoEstado)) {
        throw errorNegocio(`Un pedido ${pedido.estado} no puede pasar a ${nuevoEstado}.`);
      }

      if (nuevoEstado === 'confirmado') {
        const refProducto = doc(db, 'productos', pedido.productoId);
        const documentoProducto = await transaccion.get(refProducto);
        if (!documentoProducto.exists()) throw errorNegocio('El producto de este pedido ya no existe.');
        const stock = documentoProducto.data().stock;
        if (pedido.cantidad > stock) {
          throw errorNegocio(`No hay stock suficiente: quedan ${stock} y el pedido es de ${pedido.cantidad}.`);
        }
        transaccion.update(refProducto, { stock: stock - pedido.cantidad, actualizadoEn: serverTimestamp() });
      }

      transaccion.update(refPedido, { estado: nuevoEstado, actualizadoEn: serverTimestamp() });
    });
    return exito();
  } catch (error) {
    return fallo(error);
  }
}

// UPDATE (cliente): cancela un pedido propio que siga pendiente.
export async function cancelarPedido(id) {
  try {
    const referencia = doc(db, 'pedidos', id);
    const documento = await getDoc(referencia);
    if (!documento.exists()) throw errorNegocio('El pedido ya no existe.');
    if (documento.data().estado !== 'pendiente') {
      throw errorNegocio('Solo se pueden cancelar pedidos pendientes.');
    }
    await updateDoc(referencia, { estado: 'cancelado', actualizadoEn: serverTimestamp() });
    return exito();
  } catch (error) {
    return fallo(error);
  }
}
