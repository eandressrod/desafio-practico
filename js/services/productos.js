// Servicio de productos: CRUD completo sobre la colección "productos".
// Lectura pública; crear, editar y eliminar solo para administradores (firestore.rules).

import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
import { db } from '../firebase.js';
import { exito, fallo, errorNegocio, convertirDoc } from './respuestas.js';

const productos = collection(db, 'productos');

const CAMPOS = ['nombre', 'linea', 'descripcion', 'materiales', 'variantes', 'precio', 'stock', 'imagen', 'activo'];

// Deja solo los campos permitidos y revisa las reglas básicas del negocio.
function prepararDatos(datos) {
  const limpio = {};
  for (const campo of CAMPOS) {
    if (datos[campo] !== undefined) limpio[campo] = datos[campo];
  }
  if ('precio' in limpio && !(limpio.precio > 0)) {
    throw errorNegocio('El precio debe ser mayor que $0.');
  }
  if ('stock' in limpio && (!Number.isInteger(limpio.stock) || limpio.stock < 0)) {
    throw errorNegocio('El stock debe ser un número entero, 0 o mayor.');
  }
  return limpio;
}

// READ: todos los productos (activos e inactivos), ordenados por nombre.
export async function listarProductos() {
  try {
    const resultado = await getDocs(query(productos, orderBy('nombre')));
    return exito(resultado.docs.map(convertirDoc));
  } catch (error) {
    return fallo(error);
  }
}

// READ: un producto por su id.
export async function obtenerProducto(id) {
  try {
    if (!id) throw errorNegocio('No se indicó el producto.');
    const documento = await getDoc(doc(db, 'productos', id));
    if (!documento.exists()) throw errorNegocio('El producto no existe.');
    return exito(convertirDoc(documento));
  } catch (error) {
    return fallo(error);
  }
}

// CREATE: devuelve el id del producto nuevo.
export async function crearProducto(datos) {
  try {
    const referencia = await addDoc(productos, {
      ...prepararDatos(datos),
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    });
    return exito(referencia.id);
  } catch (error) {
    return fallo(error);
  }
}

// UPDATE: cambia solo los campos enviados.
export async function actualizarProducto(id, datos) {
  try {
    await updateDoc(doc(db, 'productos', id), {
      ...prepararDatos(datos),
      actualizadoEn: serverTimestamp(),
    });
    return exito();
  } catch (error) {
    return fallo(error);
  }
}

// DELETE: elimina el producto definitivamente.
// Los pedidos anteriores conservan el nombre y precio del producto.
export async function eliminarProducto(id) {
  try {
    await deleteDoc(doc(db, 'productos', id));
    return exito();
  } catch (error) {
    return fallo(error);
  }
}
