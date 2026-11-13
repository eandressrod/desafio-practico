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

    const salir = document.createElement('button');
    salir.type = 'button';
    salir.className = 'boton-enlace';
    salir.textContent = `Cerrar sesión (${usuario.nombre})`;
    salir.addEventListener('click', async () => {
        await cerrarSesion();
        location.href = 'index.html';
    });
    menu.append(crearItem(salir));
});
