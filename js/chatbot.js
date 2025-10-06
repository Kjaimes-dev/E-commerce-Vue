// Esperar a que cargue el DOM para configurar eventos
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("input");

  // Enviar mensaje con Enter
  input.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      enviarMensaje();
    }
  });
});

async function enviarMensaje() {
  const input = document.getElementById("input");
  const boton = document.querySelector('.input-group button');
  const mensaje = input.value.trim();
  if (!mensaje) return;

  agregarMensaje("Usuario", mensaje);

  // Deshabilitar input y botón, mostrar spinner
  input.disabled = true;
  if (boton) {
    boton.disabled = true;
    boton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...`;
  }

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: mensaje })
    });

    const data = await res.json();
    if (data.reply) {
      agregarMensaje("Asistente", data.reply);
    } else {
      agregarMensaje("Error", data.error || "Error al procesar");
    }
  } catch (error) {
    agregarMensaje("Error", "No se pudo conectar con el servidor");
  }

  // Habilitar input y botón, restaurar texto
  input.disabled = false;
  if (boton) {
    boton.disabled = false;
    boton.innerHTML = "Enviar";
  }
  input.value = "";
  input.focus();
}

function markdownToHTML(md) {
  const lines = md.split(/\r?\n/);
  let html = '';
  let inList = false;
  let inTable = false;
  let tableHeader = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trimEnd();

    // Tablas Markdown
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
      if (!inTable) {
        html += '<table class="table table-bordered table-sm my-2"><tbody>';
        inTable = true;
        tableHeader = false;
      }
      // Detectar encabezado de tabla (segunda línea con --- separadores)
      if (i + 1 < lines.length && /^\|[-\s|]+\|$/.test(lines[i + 1])) {
        html += '<tr>' + cells.map(cell => `<th>${cell}</th>`).join('') + '</tr>';
        tableHeader = true;
        i++; // saltar la línea de separadores
        continue;
      }
      html += '<tr>' + cells.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
      continue;
    } else if (inTable) {
      html += '</tbody></table>';
      inTable = false;
      tableHeader = false;
    }

    // Encabezados
    if (line.startsWith('### ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h5>${line.slice(4).trim()}</h5>`;
      continue;
    }
    // Línea horizontal
    if (line === '---') {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<hr>';
      continue;
    }
    // Citas
    if (line.startsWith('> ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<blockquote>${line.slice(2).trim()}</blockquote>`;
      continue;
    }
    // Listas no ordenadas
    if (line.startsWith('- ')) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${line.slice(2).trim()}</li>`;
      continue;
    }
    // Línea vacía cierra lista
    if (line === '') {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<br>';
      continue;
    }
    // Línea normal
    if (inList) { html += '</ul>'; inList = false; }
    // Enriquecimientos en línea (negrita/cursiva)
    line = line
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" style="max-width:100px;max-height:100px;">');
    html += line + '<br>';
  }
  if (inList) html += '</ul>';
  if (inTable) html += '</tbody></table>';
  // Compactar <br> y evitar dobles tras bloques
  return html.replaceAll('<br><br>', '<br>');
}

function agregarMensaje(remitente, mensaje) {
  const chat = document.getElementById("chat");
  const item = document.createElement("div");
  item.className = remitente === "Usuario" ? "text-end mb-2" : "text-start mb-2";

  const mensajeFormateado = markdownToHTML(mensaje);

  item.innerHTML = `<span class="fw-bold">${remitente}:</span> ${mensajeFormateado}`;
  chat.appendChild(item);

  // Bajar automáticamente al último mensaje
  chat.scrollTop = chat.scrollHeight;
}

window.enviarMensaje = enviarMensaje;