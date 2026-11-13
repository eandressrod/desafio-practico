// js/pages/login.js — iniciar sesión y crear cuenta
import { registrar, iniciarSesion } from '../services/auth.js';
import { mostrarAviso, botonOcupado } from '../ui/ui.js';

// Si otra página nos mandó aquí (?volver=pedido.html?id=…), regresamos allá al entrar.
// Solo se aceptan páginas propias (ej. "pedido.html…"), nunca otros sitios.
const volver = new URLSearchParams(location.search).get('volver');
const volverValido = volver && /^[\w-]+\.html/.test(volver);

function irDespuesDeEntrar(usuario) {
    if (volverValido) {
        location.href = volver;
    } else {
        location.href = usuario.rol === 'admin' ? 'admin-pedidos.html' : 'catalogo.html';
    }
}

// Los dos formularios siguen el mismo flujo:
// validar → bloquear el botón → llamar a la API → avisar o entrar.
// "enviar" recibe los campos del formulario y devuelve la respuesta de la API
// (o null si una validación propia falló y ya se avisó).
function manejarFormulario(formulario, enviar) {
    const boton = formulario.querySelector('button[type="submit"]');

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        if (!formulario.checkValidity()) {
            formulario.reportValidity();
            return;
        }

        botonOcupado(boton, true, 'Un momento…');
        try {
            const respuesta = await enviar(formulario.elements);
            if (!respuesta) return;
            if (!respuesta.ok) {
                mostrarAviso(respuesta.error, 'error');
                return;
            }
            irDespuesDeEntrar(respuesta.data);
        } finally {
            botonOcupado(boton, false);
        }
    });
}

manejarFormulario(document.querySelector('#form-login'), ({ correo, clave }) =>
    iniciarSesion(correo.value, clave.value));

manejarFormulario(document.querySelector('#form-registro'), ({ nombre, correo, clave, clave2 }) => {
    if (clave.value !== clave2.value) {
        mostrarAviso('Las contraseñas no coinciden.', 'error');
        clave2.focus();
        return null;
    }
    return registrar({ nombre: nombre.value, correo: correo.value, clave: clave.value });
});
