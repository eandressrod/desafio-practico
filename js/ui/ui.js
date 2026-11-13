// js/ui/ui.js — piezas de interfaz que usan todas las páginas

// Mensaje "Cargando…" dentro de un contenedor (reemplaza lo que tenía).
export function mostrarCarga(contenedor, texto = 'Cargando…') {
    const mensaje = document.createElement('p');
    mensaje.className = 'estado';
    mensaje.setAttribute('role', 'status');
    mensaje.textContent = texto;
    contenedor.replaceChildren(mensaje);
}

// Mensaje de "sin datos" o de error dentro de un contenedor.
export function mostrarVacio(contenedor, texto) {
    const mensaje = document.createElement('p');
    mensaje.className = 'estado';
    mensaje.textContent = texto;
    contenedor.replaceChildren(mensaje);
}

// Aviso flotante que desaparece solo. tipo: 'info', 'exito' o 'error'.
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

// Bloquea un botón mientras se espera a Firebase (evita doble clic) y después lo restaura.
export function botonOcupado(boton, ocupado, texto = 'Procesando…') {
    if (ocupado) {
        boton.dataset.textoOriginal = boton.textContent;
        boton.textContent = texto;
        boton.disabled = true;
    } else {
        boton.textContent = boton.dataset.textoOriginal || boton.textContent;
        boton.disabled = false;
    }
}

// Pide confirmación. Devuelve una promesa para poder cambiarla luego por un <dialog>
// sin tocar las páginas que la usan.
export function confirmar(mensaje) {
    return Promise.resolve(window.confirm(mensaje));
}

// Celda de tabla con texto o con un elemento (insignia, botones…).
// append usa texto plano: nunca interpreta HTML.
export function crearCelda(contenido) {
    const celda = document.createElement('td');
    celda.append(contenido);
    return celda;
}

// Etiqueta de color para el estado de un pedido (pendiente, confirmado…).
export function crearInsignia(estado) {
    const insignia = document.createElement('span');
    insignia.className = `insignia insignia-${estado}`;
    insignia.textContent = estado;
    return insignia;
}
