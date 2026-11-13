// Servicio de sesión y roles (Firebase Authentication + colección "usuarios").

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
import { auth, db } from '../firebase.js';
import { exito, fallo } from './respuestas.js';

// Junta la cuenta de Firebase con su documento usuarios/{uid} (nombre y rol).
async function leerPerfil(usuarioFirebase) {
  let perfil = {};
  try {
    const documento = await getDoc(doc(db, 'usuarios', usuarioFirebase.uid));
    if (documento.exists()) perfil = documento.data();
  } catch (error) {
    console.error('No se pudo leer el perfil', error);
  }
  return {
    uid: usuarioFirebase.uid,
    nombre: perfil.nombre || usuarioFirebase.email,
    correo: usuarioFirebase.email,
    rol: perfil.rol || 'cliente', // sin documento, se trata como cliente
  };
}

// Crea la cuenta y su documento con rol "cliente". Deja la sesión iniciada.
export async function registrar({ nombre, correo, clave }) {
  try {
    const credencial = await createUserWithEmailAndPassword(auth, correo.trim().toLowerCase(), clave);
    const perfil = {
      nombre: nombre.trim(),
      correo: credencial.user.email,
      rol: 'cliente', // las reglas solo permiten crear este rol
      creadoEn: serverTimestamp(),
    };
    await setDoc(doc(db, 'usuarios', credencial.user.uid), perfil);
    return exito({ uid: credencial.user.uid, nombre: perfil.nombre, correo: perfil.correo, rol: perfil.rol });
  } catch (error) {
    return fallo(error);
  }
}

// Inicia sesión y devuelve el usuario con su rol.
export async function iniciarSesion(correo, clave) {
  try {
    const credencial = await signInWithEmailAndPassword(auth, correo.trim().toLowerCase(), clave);
    return exito(await leerPerfil(credencial.user));
  } catch (error) {
    return fallo(error);
  }
}

export async function cerrarSesion() {
  try {
    await signOut(auth);
    return exito();
  } catch (error) {
    return fallo(error);
  }
}

// Llama a callback(usuario) al cargar la página y cada vez que cambia la sesión.
// usuario = { uid, nombre, correo, rol } o null si no hay sesión.
// Devuelve una función para dejar de escuchar.
export function observarSesion(callback) {
  return onAuthStateChanged(auth, async (usuarioFirebase) => {
    callback(usuarioFirebase ? await leerPerfil(usuarioFirebase) : null);
  });
}

// Para páginas privadas: espera a saber si hay sesión y devuelve el usuario.
// - Sin sesión: redirige a login.html (y luego regresa a esta página).
// - Con un rol distinto al pedido: redirige a index.html.
// Al redirigir, la promesa queda sin resolver a propósito: así el resto del código
// de la página (que está después del await) no se ejecuta.
// OJO: esto es comodidad, no seguridad. La protección real está en firestore.rules.
export function exigirSesion(rol) {
  return new Promise((resolve) => {
    const dejarDeEscuchar = onAuthStateChanged(auth, async (usuarioFirebase) => {
      dejarDeEscuchar();
      if (!usuarioFirebase) {
        const paginaActual = location.pathname.split('/').pop() + location.search;
        location.href = `login.html?volver=${encodeURIComponent(paginaActual)}`;
        return;
      }
      const usuario = await leerPerfil(usuarioFirebase);
      if (rol && usuario.rol !== rol) {
        location.href = 'index.html';
        return;
      }
      resolve(usuario);
    });
  });
}
