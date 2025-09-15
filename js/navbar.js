document.addEventListener('DOMContentLoaded', () => {
  // Leer usuario activo desde localStorage
  let usuarioActivo = null;
  try {
    usuarioActivo = JSON.parse(localStorage.getItem('usuarioActivo'));
  } catch (e) {
    console.warn("usuarioActivo corrupto:", e);
    localStorage.removeItem('usuarioActivo');
  }

  const nav = document.querySelector('.navbar-nav');
  if (!nav) return;

  // Ocultar enlaces de login y registro si hay usuario
  const linkLogin = nav.querySelector('a[href="login.html"]')?.parentElement;
  const linkRegistro = nav.querySelector('a[href="registro.html"]')?.parentElement;

  if (usuarioActivo) {
    if (linkLogin) linkLogin.remove();
    if (linkRegistro) linkRegistro.remove();

    // Crear dropdown con nombre del usuario y botón de cerrar sesión
    const userItem = document.createElement('li');
    userItem.classList.add('nav-item', 'dropdown');
    userItem.innerHTML = `
      <a class="nav-link dropdown-toggle text-capitalize" href="#" id="usuarioDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
        👤 ${usuarioActivo.nombre?.split(' ')[0] || usuarioActivo.email || 'Usuario'}
      </a>
      <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="usuarioDropdown">
        <li><a class="dropdown-item" href="#" id="cerrarSesionBtn">Cerrar sesión</a></li>
      </ul>
    `;
    nav.insertBefore(userItem, nav.lastElementChild); // antes del carrito

    document.getElementById('cerrarSesionBtn').addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('usuarioActivo');
      mostrarModal('Sesión cerrada exitosamente', 'Sesión cerrada');
      setTimeout(() => location.href = 'index.html', 1500);
    });
  }

  // Contador del carrito
  actualizarContadorCarrito();
});

function actualizarContadorCarrito() {
  let usuario = null;
  try {
    usuario = JSON.parse(localStorage.getItem('usuarioActivo'));
  } catch {
    localStorage.removeItem('usuarioActivo');
  }
  const key = usuario ? `carrito_${usuario.id}` : 'carrito_general';
  const carrito = JSON.parse(localStorage.getItem(key)) || [];
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  const contador = document.getElementById('contador-carrito');
  if (contador) {
    contador.textContent = totalItems;
  }
}

const bsModal = bootstrap.Modal;

function mostrarModal(mensaje, titulo = "Mensaje") {
  document.getElementById("mensajeModalLabel").textContent = titulo;
  document.getElementById("mensajeModalCuerpo").textContent = mensaje;
  const modal = new bsModal(document.getElementById("mensajeModal"));
  modal.show();
}
