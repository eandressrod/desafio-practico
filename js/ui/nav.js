import { observarSesion, cerrarSesion } from '../services/auth.js';

const menu = document.querySelector('#menu');

function crearItem(hijo) {
    const li = document.createElement('li');
    li.className = 'nav-sesion'; // para poder borrarlos al cambiar la sesión
    li.append(hijo);
    return li;
}

function crearEnlace(texto, href) {
    const enlace = document.createElement('a');
    enlace.href = href;
    enlace.textContent = texto;
    if (location.pathname.endsWith(href)) enlace.setAttribute('aria-current', 'page');
    return crearItem(enlace);
}

observarSesion((usuario) => {
    menu.querySelectorAll('.nav-sesion').forEach((li) => li.remove());

    if (!usuario) {
        menu.append(crearEnlace('Iniciar sesión', 'login.html'));
        return;
    }
    if (usuario.rol === 'admin') {
        menu.append(crearEnlace('Productos', 'admin-productos.html'),
            crearEnlace('Pedidos', 'admin-pedidos.html'));
    } else {
        menu.append(crearEnlace('Mis pedidos', 'mis-pedidos.html'));
    }

    // Es un enlace (no un botón) para que tome el estilo del menú en todas las páginas.
    const salir = crearEnlace(`Cerrar sesión (${usuario.nombre})`, 'index.html');
    salir.firstElementChild.removeAttribute('aria-current'); // no marcarlo como página actual
    salir.firstElementChild.addEventListener('click', async (evento) => {
        evento.preventDefault(); // primero cerrar la sesión, después ir al inicio
        await cerrarSesion();
        location.href = 'index.html';
    });
    menu.append(salir);
});
