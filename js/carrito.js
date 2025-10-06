// Usar configuración compartida
(() => {
  const API_URL = window.API_CONFIG ? window.API_CONFIG.API_URL : 'http://localhost:8024/api';
  let productos = [];

  async function cargarProductos() {
    try {
      const response = await fetch(`${API_URL}/productos`);
      const data = await response.json();
      productos = data.productos;
      mostrarCarrito();
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  }

  function getUsuarioId() {
    const usuario = JSON.parse(localStorage.getItem('usuarioActivo'));
    return usuario ? usuario.id : null;
  }

  // Mostrar carrito
  async function mostrarCarrito() {
    const usuarioId = getUsuarioId();
    const contenedor = document.getElementById('carrito-container');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    let carrito = [];
    let total = 0;

    // Si hay usuario logueado, obtener carrito de la API
    if (usuarioId) {
      try {
        const response = await fetch(`${API_URL}/carrito/${usuarioId}`);
        const data = await response.json();
        carrito = data.carrito;
      } catch (error) {
        console.error('Error cargando carrito:', error);
        contenedor.innerHTML = '<p class="text-danger">Error al cargar el carrito.</p>';
        return;
      }
    } else {
      // Modo invitado: usar localStorage
      carrito = obtenerCarritoLocal();
    }

    if (carrito.length === 0) {
      contenedor.innerHTML = '<p>El carrito está vacío.</p>';
      return;
    }

    carrito.forEach(item => {
      const subtotal = parseFloat(item.precio) * item.cantidad;
      total += subtotal;

      // Para usuarios logueados: item.id es el ID del carrito
      // Para invitados: item.producto_id es el ID del producto
      const itemId = usuarioId ? item.id : item.producto_id;

      contenedor.insertAdjacentHTML('beforeend', `
        <div class="card mb-3">
          <div class="row g-0 align-items-center">
            <div class="col-md-2">
              <img src="${item.imagen}" class="img-fluid rounded-start" alt="${item.nombre}">
            </div>
            <div class="col-md-6">
              <div class="card-body">
                <h5 class="card-title">${item.nombre}</h5>
                <p class="card-text">Precio: $${parseFloat(item.precio).toLocaleString()}</p>
                <p class="card-text">
                  Cantidad: 
                  <input type="number" min="1" max="${item.stock}" value="${item.cantidad}" 
                    onchange="window.actualizarCantidad(${itemId}, this.value)" 
                    style="width: 60px;">
                </p>
                <p class="card-text"><small class="text-muted">Subtotal: $${subtotal.toLocaleString()}</small></p>
              </div>
            </div>
            <div class="col-md-4 text-end pe-4">
              <button class="btn btn-danger" onclick="window.eliminarProducto(${itemId})">Eliminar</button>
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

  // Obtener carrito local (para usuarios no logueados)
  function obtenerCarritoLocal() {
    const carritoLocal = JSON.parse(localStorage.getItem('carrito_general')) || [];
    // Enriquecer con datos del producto
    return carritoLocal.map(item => {
      const producto = productos.find(p => p.id === item.id);
      if (!producto) {
        console.warn(`Producto ${item.id} no encontrado en la lista de productos`);
        return null;
      }
      return {
        producto_id: item.id,
        cantidad: item.cantidad,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagen,
        stock: producto.stock
      };
    }).filter(item => item !== null); // Filtrar items nulos
  }

  // Actualizar cantidad
  async function actualizarCantidad(id, nuevaCantidad) {
    const usuarioId = getUsuarioId();
    nuevaCantidad = parseInt(nuevaCantidad);

    if (nuevaCantidad < 1) {
      alert('La cantidad debe ser al menos 1');
      mostrarCarrito();
      return;
    }

    if (usuarioId) {
      // Usuario logueado: usar API (id es el ID del carrito)
      try {
        const response = await fetch(`${API_URL}/carrito/${id}?cantidad=${nuevaCantidad}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          mostrarCarrito();
          actualizarContadorCarrito();
        } else {
          const data = await response.json();
          alert(data.detail || 'Error al actualizar la cantidad');
          mostrarCarrito();
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar la cantidad');
      }
    } else {
      // Modo invitado: localStorage (id es el ID del producto)
      actualizarCantidadLocal(id, nuevaCantidad);
    }
  }

  function actualizarCantidadLocal(productoId, nuevaCantidad) {
    let carrito = JSON.parse(localStorage.getItem('carrito_general')) || [];
    const producto = productos.find(p => p.id === productoId);

    if (!producto) {
      alert('Producto no encontrado');
      return;
    }

    if (nuevaCantidad > producto.stock) {
      alert('No hay suficiente stock disponible.');
      nuevaCantidad = producto.stock;
    }

    carrito = carrito.map(item =>
      item.id === productoId ? { ...item, cantidad: nuevaCantidad } : item
    );

    localStorage.setItem('carrito_general', JSON.stringify(carrito));
    mostrarCarrito();
    actualizarContadorCarrito();
  }

  // Eliminar producto
  async function eliminarProducto(id) {
    const usuarioId = getUsuarioId();

    if (usuarioId) {
      // Usuario logueado: usar API (id es el ID del carrito)
      try {
        const response = await fetch(`${API_URL}/carrito/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          mostrarCarrito();
          actualizarContadorCarrito();
        } else {
          alert('Error al eliminar el producto');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el producto');
      }
    } else {
      // Modo invitado: localStorage (id es el ID del producto)
      eliminarProductoLocal(id);
    }
  }

  function eliminarProductoLocal(productoId) {
    let carrito = JSON.parse(localStorage.getItem('carrito_general')) || [];
    carrito = carrito.filter(item => item.id !== productoId);
    localStorage.setItem('carrito_general', JSON.stringify(carrito));
    mostrarCarrito();
    actualizarContadorCarrito();
  }

  // Finalizar compra
  async function finalizarCompra() {
    if (!confirm('¿Deseas confirmar la compra?')) return;

    const usuarioId = getUsuarioId();

    if (usuarioId) {
      // Usuario logueado: vaciar carrito en API
      try {
        const response = await fetch(`${API_URL}/carrito/usuario/${usuarioId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          alert('¡Compra realizada con éxito!');
          mostrarCarrito();
          actualizarContadorCarrito();
        } else {
          alert('Error al finalizar la compra');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al finalizar la compra');
      }
    } else {
      // Modo invitado: limpiar localStorage
      localStorage.removeItem('carrito_general');
      alert('¡Compra realizada con éxito!');
      mostrarCarrito();
      actualizarContadorCarrito();
    }
  }

  // Actualizar contador en navbar
  async function actualizarContadorCarrito() {
    const usuarioId = getUsuarioId();
    let totalItems = 0;

    if (usuarioId) {
      try {
        const response = await fetch(`${API_URL}/carrito/${usuarioId}`);
        const data = await response.json();
        totalItems = data.carrito.reduce((total, item) => total + item.cantidad, 0);
      } catch (error) {
        console.error('Error:', error);
      }
    } else {
      const carrito = JSON.parse(localStorage.getItem('carrito_general')) || [];
      totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
    }

    const contador = document.getElementById('contador-carrito');
    if (contador) contador.textContent = totalItems;
  }

  // Mostrar mini carrito en hover
  async function mostrarMiniCarrito() {
    const contenedor = document.getElementById('mini-carrito');
    if (!contenedor) return;

    const usuarioId = getUsuarioId();
    let carrito = [];
    let total = 0;

    if (usuarioId) {
      try {
        const response = await fetch(`${API_URL}/carrito/${usuarioId}`);
        const data = await response.json();
        carrito = data.carrito;
      } catch (error) {
        console.error('Error:', error);
        contenedor.innerHTML = '<p class="text-center m-0 text-danger">Error al cargar</p>';
        return;
      }
    } else {
      carrito = obtenerCarritoLocal();
    }

    contenedor.innerHTML = '';

    if (carrito.length === 0) {
      contenedor.innerHTML = '<p class="text-center m-0">Carrito vacío</p>';
      return;
    }

    carrito.forEach(item => {
      const subtotal = parseFloat(item.precio) * item.cantidad;
      total += subtotal;

      contenedor.insertAdjacentHTML('beforeend', `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div>
            <strong>${item.nombre}</strong><br>
            <small>${item.cantidad} x $${parseFloat(item.precio).toLocaleString()}</small>
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

  // Inicialización
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

  // Exportar funciones globales
  window.actualizarCantidad = actualizarCantidad;
  window.eliminarProducto = eliminarProducto;
  window.finalizarCompra = finalizarCompra;
  window.actualizarContadorCarrito = actualizarContadorCarrito;
  window.getUsuarioId = getUsuarioId;
})();