const API_URL = "http://localhost:3000";

// ============================
// UTILIDADES
// ============================
function obtenerCarrito() {
  return JSON.parse(localStorage.getItem("carrito")) || [];
}

function guardarCarrito(carrito) {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

// ============================
// RENDER
// ============================
async function renderCarrito() {
  const contenedor = document.getElementById("carrito-contenido");
  const totalDiv = document.getElementById("carrito-total");
  const carrito = obtenerCarrito();

  if (carrito.length === 0) {
    contenedor.innerHTML = "<p>Tu carrito está vacío.</p>";
    totalDiv.textContent = "";
    return;
  }

  const res = await fetch(`${API_URL}/products`);
  const productos = await res.json();

  let total = 0;
  contenedor.innerHTML = "";

  carrito.forEach(item => {
    const producto = productos.find(p => p.id === item.id);
    if (!producto) return;

    const subtotal = producto.price * item.cantidad;
    total += subtotal;

    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "space-between";
    div.style.padding = "16px";
    div.style.background = "white";
    div.style.borderRadius = "12px";
    div.style.marginBottom = "12px";
    div.style.border = "1px solid #e5e5e5";

    div.innerHTML = `
      <div style="display:flex; align-items:center; gap:16px;">
        <img 
          src="${producto.image ? API_URL + producto.image : 'https://via.placeholder.com/80'}"
          style="width:80px;height:80px;object-fit:cover;border-radius:8px;"
        />
        <div>
          <h3 style="margin:0;">${producto.name}</h3>
          <p style="margin:4px 0;">₲ ${producto.price.toLocaleString("es-PY")}</p>
        </div>
      </div>

      <div style="display:flex; align-items:center; gap:12px;">
        <button onclick="cambiarCantidad(${item.id}, -1)">−</button>
        <span>${item.cantidad}</span>
        <button onclick="cambiarCantidad(${item.id}, 1)">+</button>
        <button onclick="eliminarItem(${item.id})">🗑️</button>
      </div>
    `;

    contenedor.appendChild(div);
  });

  totalDiv.textContent = `Total: ₲ ${total.toLocaleString("es-PY")}`;
}

// ============================
// ACCIONES
// ============================
function cambiarCantidad(id, delta) {
  const carrito = obtenerCarrito();
  const item = carrito.find(p => p.id === id);
  if (!item) return;

  item.cantidad += delta;

  if (item.cantidad <= 0) {
    eliminarItem(id);
    return;
  }

  guardarCarrito(carrito);
  renderCarrito();
}

function eliminarItem(id) {
  let carrito = obtenerCarrito();
  carrito = carrito.filter(p => p.id !== id);
  guardarCarrito(carrito);
  renderCarrito();
}

// ============================
// INIT
// ============================
document.addEventListener("DOMContentLoaded", renderCarrito);
