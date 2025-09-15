document.addEventListener('DOMContentLoaded', () => {
  const formRegistro = document.getElementById('form-registro');
  const formLogin = document.getElementById('form-login');

  if (formRegistro) {
    formRegistro.addEventListener('submit', (e) => {
      e.preventDefault();

      const nombre = document.getElementById('nombre').value.trim();
      const email = document.getElementById('email').value.trim().toLowerCase();
      const password = document.getElementById('password').value;
      const confirmar = document.getElementById('confirmar').value;
      const telefono = document.getElementById('telefono').value.trim();
      const cedula = document.getElementById('cedula').value.trim();
      const direccion = document.getElementById('direccion').value.trim();

      if (!nombre || !email || !password || !confirmar || !telefono || !cedula || !direccion) {
        mostrarModal('Por favor, completa todos los campos.', 'Campos incompletos');
        return;
      }

      if (password !== confirmar) {
        mostrarModal('Las contraseñas no coinciden.', 'Contraseña');
        return;
      }

      const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
      const existe = usuarios.find(u => u.email === email);

      if (existe) {
        mostrarModal('El correo ya está registrado.', 'Error de registro');
        return;
      }

      const nuevoUsuario = { nombre, email, password, telefono, cedula, direccion };
      usuarios.push(nuevoUsuario);
      localStorage.setItem('usuarios', JSON.stringify(usuarios));

      mostrarModal('Registro exitoso. Ahora puedes iniciar sesión.', '¡Registro completo!');
      setTimeout(() => window.location.href = 'login.html', 2000);
    });
  }

  if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim().toLowerCase();
      const password = document.getElementById('password').value;

      const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
      const usuario = usuarios.find(u => u.email === email && u.password === password);

      if (!usuario) {
        mostrarModal('Correo o contraseña incorrectos.', 'Error de autenticación');
        return;
      }

      localStorage.setItem('usuarioActivo', JSON.stringify(usuario));
      mostrarModal(`¡Bienvenido/a, ${usuario.nombre}!`, 'Inicio exitoso');
      setTimeout(() => window.location.href = 'index.html', 1500);
    });
  }
});

function mostrarModal(mensaje, titulo = "Mensaje") {
  document.getElementById("mensajeModalLabel").textContent = titulo;
  document.getElementById("mensajeModalCuerpo").textContent = mensaje;
  const modal = new bsModal(document.getElementById("mensajeModal"));
  modal.show();
}
