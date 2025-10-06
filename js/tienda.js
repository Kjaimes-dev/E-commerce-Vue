// Usar configuración compartida
const API_URL = window.API_CONFIG ? window.API_CONFIG.API_URL : 'http://localhost:8024/api';

let productos = [];
let productosFiltrados = [];

// Cargar productos desde la API
async function cargarProductos() {
    try {
        const response = await fetch(`${API_URL}/productos`);
        const data = await response.json();
        productos = data.productos;
        productosFiltrados = [...productos];
        mostrarProductos(productosFiltrados);
    } catch (error) {
        console.error('Error cargando productos:', error);
        mostrarMensaje('No se pudieron cargar los productos.', 'danger');
    }
}

// Mostrar mensajes flotantes (ej. producto agregado)
function mostrarMensaje(texto, tipo = 'success') {
    const div = document.createElement('div');
    div.className = `alert alert-${tipo} position-fixed top-0 end-0 m-3 z-3`;
    div.innerText = texto;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// Obtener ID de usuario activo (desde localStorage o null)
function getUsuarioId() {
    const usuario = JSON.parse(localStorage.getItem('usuarioActivo'));
    return usuario ? usuario.id : null;
}

// Mostrar productos en tarjetas
function mostrarProductos(lista) {
    const contenedor = document.getElementById('lista-productos');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (lista.length === 0) {
        contenedor.innerHTML = '<p class="text-center">No hay productos que coincidan con los filtros.</p>';
        return;
    }

    lista.forEach(p => {
        const stockBadge = p.stock > 0
            ? `<span class="badge bg-success">Stock: ${p.stock}</span>`
            : `<span class="badge bg-danger">Agotado</span>`;

        const card = `
        <div class="col-sm-6 col-md-4 col-lg-3 mb-4">
            <div class="card h-100">
                <img src="${p.imagen}" class="card-img-top" alt="${p.nombre}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${p.nombre}</h5>
                    <p class="card-text">$${parseFloat(p.precio).toLocaleString()}</p>
                    ${stockBadge}
                    <button class="btn btn-primary mt-auto" ${p.stock === 0 ? 'disabled' : ''} onclick="agregarAlCarrito(${p.id})">Agregar al carrito</button>
                </div>
            </div>
        </div>
        `;
        contenedor.insertAdjacentHTML('beforeend', card);
    });
}

// Agregar un producto al carrito (usando API si hay usuario, localStorage si no)
async function agregarAlCarrito(idProducto) {
    const usuarioId = getUsuarioId();
    
    // Si hay usuario logueado, usar API
    if (usuarioId) {
        try {
            const response = await fetch(`${API_URL}/carrito`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    producto_id: idProducto,
                    cantidad: 1,
                    usuario_id: usuarioId
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                mostrarMensaje('Producto agregado al carrito');
                if (typeof actualizarContadorCarrito === 'function') actualizarContadorCarrito();
            } else {
                mostrarMensaje(data.detail || 'Error al agregar al carrito', 'danger');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error al agregar al carrito', 'danger');
        }
    } else {
        // Si no hay usuario, usar localStorage (modo invitado)
        agregarAlCarritoLocal(idProducto);
    }
}

// Agregar al carrito usando localStorage (para usuarios no logueados)
function agregarAlCarritoLocal(idProducto) {
    let carrito = JSON.parse(localStorage.getItem('carrito_general')) || [];

    const productoOriginal = productos.find(p => p.id === idProducto);
    let productoEnCarrito = carrito.find(item => item.id === idProducto);

    if (!productoOriginal) {
        mostrarMensaje('Producto no encontrado', 'danger');
        return;
    }

    if (productoEnCarrito) {
        if (productoEnCarrito.cantidad < productoOriginal.stock) {
            productoEnCarrito.cantidad++;
        } else {
            mostrarMensaje('No hay más stock disponible para este producto.', 'danger');
            return;
        }
    } else {
        carrito.push({
            id: idProducto,
            cantidad: 1,
            nombre: productoOriginal.nombre,
            precio: productoOriginal.precio
        });
    }

    localStorage.setItem('carrito_general', JSON.stringify(carrito));
    mostrarMensaje('Producto agregado al carrito');
    if (typeof actualizarContadorCarrito === 'function') actualizarContadorCarrito();
}

// Filtros y búsqueda
function aplicarFiltros() {
    const buscador = document.getElementById('buscador');
    const filtro = document.getElementById('filtro');
    const precioMin = document.getElementById('precioMin');
    const precioMax = document.getElementById('precioMax');

    if (!buscador || !filtro || !precioMin || !precioMax) return;

    const buscadorVal = buscador.value.toLowerCase();
    const filtroVal = filtro.value;
    const min = parseFloat(precioMin.value) || 0;
    const max = parseFloat(precioMax.value) || Infinity;

    productosFiltrados = productos.filter(p => {
        const nombreCoincide = p.nombre.toLowerCase().includes(buscadorVal);
        const precioValido = parseFloat(p.precio) >= min && parseFloat(p.precio) <= max;
        return nombreCoincide && precioValido;
    });

    switch (filtroVal) {
        case 'destacado':
            productosFiltrados = productosFiltrados.filter(p => p.destacado);
            break;
        case 'recientes':
            productosFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            break;
        case 'precio-alto':
            productosFiltrados.sort((a, b) => parseFloat(b.precio) - parseFloat(a.precio));
            break;
        case 'precio-bajo':
            productosFiltrados.sort((a, b) => parseFloat(a.precio) - parseFloat(b.precio));
            break;
    }

    mostrarProductos(productosFiltrados);
}

// Inicializar tienda al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    const contenedor = document.getElementById('lista-productos');
    if (contenedor) {
        cargarProductos();
        actualizarContadorCarrito();

        const buscador = document.getElementById('buscador');
        const filtro = document.getElementById('filtro');
        const precioMin = document.getElementById('precioMin');
        const precioMax = document.getElementById('precioMax');

        if (buscador) buscador.addEventListener('input', aplicarFiltros);
        if (filtro) filtro.addEventListener('change', aplicarFiltros);
        if (precioMin) precioMin.addEventListener('input', aplicarFiltros);
        if (precioMax) precioMax.addEventListener('input', aplicarFiltros);
    }
});