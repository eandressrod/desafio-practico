export function mostrarCarga(contenedor, texto = 'Cargando…') {
const mensaje = document.createElement('p');
mensaje.className = 'estado estado-carga';
mensaje.setAttribute('role', 'status');
mensaje.textContent = texto;
contenedor.replaceChildren(mensaje);
}

export function mostrarVacio(contenedor, texto) {
const mensaje = document.createElement('p');
mensaje.className = 'estado estado-vacio';
mensaje.textContent = texto;
contenedor.replaceChildren(mensaje);
}
export function mostrarAviso(texto, tipo = 'info') {
let zona = document.querySelector('#avisos');
if (!zona) { // se crea una sola vez por página
zona = document.createElement('div');
zona.id = 'avisos';
zona.setAttribute('aria-live', 'polite'); // los lectores de pantalla lo leen
document.body.append(zona);
}
const aviso = document.createElement('p');
aviso.className = `aviso aviso-${tipo}`;
aviso.textContent = texto;
zona.append(aviso);
setTimeout(() => aviso.remove(), 4000); // desaparece a los 4 s
}
export function botonOcupado(boton, ocupado, texto = 'Procesando…') {
if (ocupado) {
boton.dataset.textoOriginal = boton.textContent;
boton.textContent = texto;
boton.disabled = true;
} else {
boton.textContent = boton.dataset.textoOriginal ?? boton.textContent;
boton.disabled = false;
}
}
export function confirmar(mensaje) {
// Versión simple. Si hay tiempo, se puede cambiar por un <dialog> con el diseño MIAH
// sin que las páginas cambien, porque siguen recibiendo una promesa.
return Promise.resolve(window.confirm(mensaje));
}
