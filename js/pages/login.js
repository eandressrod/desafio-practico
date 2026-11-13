import { registrar, iniciarSesion } from '../services/auth.js';
import { mostrarAviso, botonOcupado } from '../ui/ui.js';

const formRegistro = document.querySelector('#form-registro');
const botonRegistro = formRegistro.querySelector('button[type="submit"]');

formRegistro.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!formRegistro.checkValidity()) { formRegistro.reportValidity(); return; }

    const { nombre, correo, clave, clave2 } = formRegistro.elements;
    if (clave.value !== clave2.value) {
        mostrarAviso('Las contraseñas no coinciden.', 'error');
        clave2.focus();
        return;
    }

    botonOcupado(botonRegistro, true, 'Creando cuenta…');
    try {
        const respuesta = await registrar({
            nombre: nombre.value.trim(),
            correo: correo.value.trim(),
            clave: clave.value,
        });
        if (!respuesta.ok) { mostrarAviso(respuesta.error, 'error'); return; }
        mostrarAviso(`¡Bienvenida/o, ${respuesta.data.nombre}!`, 'exito');
        location.href = 'catalogo.html';
    } finally {
        botonOcupado(botonRegistro, false);
    }
});
// El formulario de inicio de sesión es igual, con iniciarSesion(correo, clave).
// Después de entrar: si el rol es 'admin' → admin-pedidos.html; si no → catalogo.html.
// Si ?volver=pedido.html%3Fid%3D… viene en la URL, regresar ahí.
