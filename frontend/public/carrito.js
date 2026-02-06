const API_URL = "http://localhost:3000";

/* =========================
   Carrito helpers
========================= */

function obtenerCarrito() {
  return JSON.parse(localStorage.getItem("carrito")) || [];
}

function guardarCarrito(carrito) {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

/* =========================
   Limpia productos que ya no existen
========================= */

async function limpiarCarritoInvalido(productos) {
  const carrito = obtenerCarrito();

  const carritoLimpio = carrito.filter(item =>
    productos.some(p => p.id === item.id)
  );

  if (carritoLimpio.length !== carrito.length) {
    guardarCarrito(carritoLimpio);
  }

  return carritoLimpio;
}

/* =========================
   Render carrito
========================= */

async function renderCarrito() {
  const contenedor = document.getElementById("carrito-contenido");
  const totalDiv = document.getElementById("carrito-total");

  let carrito = obtenerCarrito();

  if (carrito.length === 0) {
    contenedor.innerHTML = "<p>Tu carrito está vacío.</p>";
    totalDiv.textContent = "";
    return;
  }

  // Traemos productos reales desde backend
  const res = await fetch(`${API_URL}/products`);
  const productos = await res.json();

  // 🔥 limpiamos productos que ya no existen
  carrito = await limpiarCarritoInvalido(productos);

  if (carrito.length === 0) {
    contenedor.innerHTML = "<p>Tu carrito está vacío.</p>";
    totalDiv.textContent = "";
    return;
  }

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
          src="${producto.image ? API_URL + producto.image : "https://via.placeholder.com/80"}"
          style="width:80px;height:80px;object-fit:cover;border-radius:8px;"
        />
        <div>
          <h3 style="margin:0;">${producto.name}</h3>
          <p style="margin:4px 0;">₲ ${producto.price.toLocaleString("es-PY")}</p>
        </div>
      </div>

      <div class="cart-actions">
        <button class="qty-btn" onclick="cambiarCantidad(${item.id}, -1)">−</button>
        <span class="qty-value">${item.cantidad}</span>
        <button class="qty-btn" onclick="cambiarCantidad(${item.id}, 1)">+</button>
        <button class="remove-btn" onclick="eliminarItem(${item.id})">🗑️</button>
      </div>
    `;

    contenedor.appendChild(div);
  });

  totalDiv.textContent = `Total: ₲ ${total.toLocaleString("es-PY")}`;
}

/* =========================
   Acciones carrito
========================= */

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

/* =========================
   Finalizar compra
========================= */

async function finalizarCompra(event) {
  event.preventDefault();

  const carrito = obtenerCarrito();
  if (carrito.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  const payload = {
    items: carrito,
    customerName: document.getElementById("customer-name").value.trim(),
    customerPhone: document.getElementById("customer-phone").value.trim(),
    customerEmail: document.getElementById("customer-email").value.trim(),
    deliveryAddress: document.getElementById("delivery-address").value.trim(),
    deliveryMethod: document.getElementById("delivery-method").value,
    notes: document.getElementById("order-notes").value.trim(),
  };

  const response = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    alert(errorData.error || "No se pudo crear el pedido.");
    return;
  }

  const data = await response.json();

  guardarCarrito([]);
  await renderCarrito();
  document.getElementById("checkout-form").reset();

  alert(`Pedido #${data.orderId} creado correctamente.`);
}

/* =========================
   Init
========================= */

document.addEventListener("DOMContentLoaded", () => {
  renderCarrito();

  const form = document.getElementById("checkout-form");
  form.addEventListener("submit", finalizarCompra);
});
