// js/utils/formato.js — formatos para mostrar precios y fechas

// Moneda de El Salvador (dólar).
const moneda = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: 'USD',
});

// Fecha y hora de El Salvador.
const fecha = new Intl.DateTimeFormat('es-SV', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

// 55 → "$55.00"
export function formatearPrecio(numero) {
  return moneda.format(numero);
}

// Date → "12 nov 2026, 7:30 p. m." (o "—" si no hay fecha)
export function formatearFecha(valor) {
  return valor ? fecha.format(valor) : '—';
}
