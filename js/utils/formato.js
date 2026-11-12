
 // js/utils/formato.js

// Formato de moneda para El Salvador.
const moneda = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: 'USD',
});

// Formato de fecha y hora para El Salvador.
const fecha = new Intl.DateTimeFormat('es-SV', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

// Convierte un número en precio.
export function formatearPrecio(numero) {
  return moneda.format(numero);
}

// Convierte una fecha en texto.
export function formatearFecha(valor) {
  return valor ? fecha.format(valor) : '—';
}
