const ACCIONES = {
    pendiente: [{ estado: 'confirmado', texto: 'Confirmar' },
        { estado: 'cancelado', texto: 'Cancelar' }],
    confirmado: [{ estado: 'entregado', texto: 'Marcar entregado' }],
    entregado: [],
    cancelado: [],
};

function crearBotonesAccion(pedido) {
    return ACCIONES[pedido.estado].map(({ estado, texto }) => {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.textContent = texto;
        boton.dataset.id = pedido.id;
        boton.dataset.estado = estado;
        return boton;
    });
}

cuerpoTabla.addEventListener('click', async (evento) => {
    const boton = evento.target.closest('button[data-estado]');
    if (!boton) return;
    const { id, estado } = boton.dataset;
    const seguro = await confirmar(`¿Cambiar el pedido a "${estado}"?`);
    if (!seguro) return;
    botonOcupado(boton, true, 'Actualizando…');
    const respuesta = await cambiarEstadoPedido(id, estado);
    if (!respuesta.ok) {
        mostrarAviso(respuesta.error, 'error'); // p. ej. "Ya no hay stock suficiente"
        botonOcupado(boton, false);
    return;
    }
    mostrarAviso('Pedido actualizado.', 'exito');
    await cargarPedidos();
});
