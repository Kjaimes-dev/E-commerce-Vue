(() => {
  let productos = [];

  async function cargarProductos() {
    try {
      const response = await fetch('data/productos.json');
      productos = await response.json();
      mostrarCarrito();
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  }

  function getCarritoKey() {
    const usuario = JSON.parse(localStorage.getItem('usuarioActivo'));
    return usuario ? `carrito_${usuario.id}` : 'carrito_general';
  }


  function mostrarCarrito() {
    const key = getCarritoKey();
    const carrito = JSON.parse(localStorage.getItem(key)) || [];
    const contenedor = document.getElementById('carrito-container');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    if (carrito.length === 0) {
      contenedor.innerHTML = '<p>El carrito está vacío.</p>';
      return;
    }

    let total = 0;

    carrito.forEach(item => {
      const producto = productos.find(p => p.id === item.id);
      if (!producto) return;

      const subtotal = producto.precio * item.cantidad;
      total += subtotal;

      contenedor.insertAdjacentHTML('beforeend', `
        <div class="card mb-3">
          <div class="row g-0 align-items-center">
            <div class="col-md-2">
              <img src="${producto.imagen}" class="img-fluid rounded-start" alt="${producto.nombre}">
            </div>
            <div class="col-md-6">
              <div class="card-body">
                <h5 class="card-title">${producto.nombre}</h5>
                <p class="card-text">Precio: $${producto.precio.toLocaleString()}</p>
                <p class="card-text">
                  Cantidad: 
                  <input type="number" min="1" max="${producto.stock}" value="${item.cantidad}" 
                    onchange="window.actualizarCantidad(${producto.id}, this.value)" 
                    style="width: 60px;">
                </p>
                <p class="card-text"><small class="text-muted">Subtotal: $${subtotal.toLocaleString()}</small></p>
              </div>
            </div>
            <div class="col-md-4 text-end pe-4">
              <button class="btn btn-danger" onclick="window.eliminarProducto(${producto.id})">Eliminar</button>
            </div>
          </div>
        </div>
      `);
    });

    contenedor.insertAdjacentHTML('beforeend', `
      <h4>Total: $${total.toLocaleString()}</h4>
      <button class="btn btn-success mt-3" onclick="window.finalizarCompra()">Finalizar compra</button>
    `);
  }

  function actualizarCantidad(id, nuevaCantidad) {
    const key = getCarritoKey();
    let carrito = JSON.parse(localStorage.getItem(key)) || [];

    const producto = productos.find(p => p.id === id);
    nuevaCantidad = parseInt(nuevaCantidad);

    if (nuevaCantidad < 1) nuevaCantidad = 1;
    if (nuevaCantidad > producto.stock) {
      alert('No hay suficiente stock disponible.');
      nuevaCantidad = producto.stock;
    }

    carrito = carrito.map(item =>
      item.id === id ? { ...item, cantidad: nuevaCantidad } : item
    );

    localStorage.setItem(key, JSON.stringify(carrito));
    mostrarCarrito();
    actualizarContadorCarrito();
  }

  function eliminarProducto(id) {
    const key = getCarritoKey();
    let carrito = JSON.parse(localStorage.getItem(key)) || [];

    carrito = carrito.filter(item => item.id !== id);
    localStorage.setItem(key, JSON.stringify(carrito));
    mostrarCarrito();
    actualizarContadorCarrito();
  }

  function finalizarCompra() {
    if (confirm('¿Deseas confirmar la compra?')) {
      const key = getCarritoKey();
      localStorage.removeItem(key);

      alert('¡Compra realizada con éxito!');
      mostrarCarrito();
      actualizarContadorCarrito();
    }
  }

  function actualizarContadorCarrito() {
    const key = getCarritoKey();
    const carrito = JSON.parse(localStorage.getItem(key)) || [];
    const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
    const contador = document.getElementById('contador-carrito');
    if (contador) contador.textContent = totalItems;
  }

  function mostrarMiniCarrito() {
    const contenedor = document.getElementById('mini-carrito');
    if (!contenedor) return;
    const key = getCarritoKey();
    const carrito = JSON.parse(localStorage.getItem(key)) || [];
    contenedor.innerHTML = '';

    if (carrito.length === 0) {
      contenedor.innerHTML = '<p class="text-center m-0">Carrito vacío</p>';
      return;
    }

    let total = 0;

    carrito.forEach(item => {
      const producto = productos.find(p => p.id === item.id);
      if (!producto) return;

      const subtotal = producto.precio * item.cantidad;
      total += subtotal;

      contenedor.insertAdjacentHTML('beforeend', `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div>
            <strong>${producto.nombre}</strong><br>
            <small>${item.cantidad} x $${producto.precio.toLocaleString()}</small>
          </div>
          <div><small>$${subtotal.toLocaleString()}</small></div>
        </div>
      `);
    });

    contenedor.insertAdjacentHTML('beforeend', `
      <div class="border-top pt-2 mt-2 text-end">
        <strong>Total: $${total.toLocaleString()}</strong>
      </div>
    `);
  }

  window.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    actualizarContadorCarrito();

    const navCarrito = document.getElementById('nav-carrito-hover');
    const miniCarrito = document.getElementById('mini-carrito');

    if (navCarrito && miniCarrito) {
      navCarrito.addEventListener('mouseenter', () => {
        mostrarMiniCarrito();
        miniCarrito.style.display = 'block';
      });

      navCarrito.addEventListener('mouseleave', () => {
        miniCarrito.style.display = 'none';
      });
    }
  });

  window.actualizarCantidad = actualizarCantidad;
  window.eliminarProducto = eliminarProducto;
  window.finalizarCompra = finalizarCompra;
  window.getCarritoKey = getCarritoKey;
})();
