// Herramientas comunes de los servicios.
// Todas las funciones de la API responden con la misma forma:
//   { ok: true, data }   cuando todo salió bien
//   { ok: false, error } cuando algo falló (error = mensaje en español para mostrar)
// Así las páginas nunca reciben excepciones y siempre saben qué mostrar.

// Mensajes en español para los códigos de error de Firebase.
const MENSAJES = {
  'auth/email-already-in-use': 'Ese correo ya tiene una cuenta. Inicia sesión.',
  'auth/invalid-email': 'El correo electrónico no es válido.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/missing-password': 'Escribe tu contraseña.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet e intenta de nuevo.',
  'permission-denied': 'No tienes permiso para realizar esta acción.',
  'unavailable': 'No hay conexión con el servidor. Intenta de nuevo.',
  'not-found': 'El registro ya no existe.',
  'failed-precondition': 'La operación no se pudo completar. Recarga la página e intenta de nuevo.',
};

const MENSAJE_GENERICO = 'Ocurrió un error inesperado. Intenta de nuevo.';

// Respuesta exitosa.
export function exito(data = null) {
  return { ok: true, data };
}

// Respuesta fallida: convierte cualquier error en un mensaje legible.
export function fallo(error) {
  console.error(error); // el detalle técnico queda en la consola para depurar
  if (error?.code === 'negocio') {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: MENSAJES[error?.code] ?? MENSAJE_GENERICO };
}

// Crea un error de regla de negocio (ej. "No hay stock suficiente").
// Su mensaje se muestra tal cual al usuario.
export function errorNegocio(mensaje) {
  const error = new Error(mensaje);
  error.code = 'negocio';
  return error;
}

// Convierte un documento de Firestore en un objeto simple:
// agrega su id y transforma las fechas (Timestamp) en Date de JavaScript.
export function convertirDoc(documento) {
  const datos = documento.data();
  for (const [campo, valor] of Object.entries(datos)) {
    if (valor && typeof valor.toDate === 'function') {
      datos[campo] = valor.toDate();
    }
  }
  return { id: documento.id, ...datos };
}
