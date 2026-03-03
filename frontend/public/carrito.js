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
function copiarAlias() {
  const alias = document.getElementById("alias-value").innerText;

  navigator.clipboard.writeText(alias)
    .then(() => {
      alert("Alias copiado al portapapeles");
    })
    .catch(() => {
      alert("No se pudo copiar el alias");
    });
}

function generarTransferenciaHTML(data) {
  return `
    <div class="payment-card">
      <div class="payment-header">
        <h2>Pedido confirmado</h2>
        <span class="payment-status">Pendiente de pago</span>
      </div>

      <div class="payment-total">
        Total a transferir:
        <strong>₲ ${Number(data.total).toLocaleString()}</strong>
      </div>

      <div class="reservation-timer">
        ⏳ Te reservamos el stock por:
        <span id="countdown-timer">24:00:00</span>
      </div>

      <div class="payment-section">
        <h3>Transferencia bancaria</h3>

        <div class="bank-details">
          <div><span>Banco:</span> Continental</div>
          <div><span>Titular:</span> María Mercedes Casco</div>
          <div><span>CI:</span> 1.483.780</div>

          <div class="alias-row">
            <span>Alias:</span>
            <strong id="alias-value">1483780</strong>
            <button class="copy-btn" onclick="copiarAlias()">Copiar</button>
          </div>

          <div><span>Cta Cte:</span> 542388871304</div>
        </div>
      </div>
    </div>
  `;
}

function generarEfectivoHTML(data) {
  return `
    <div class="payment-card">
      <div class="payment-header">
        <h2>Pedido confirmado</h2>
        <span class="payment-status">Pago en efectivo</span>
      </div>

      <div class="payment-total">
        Total a pagar:
        <strong>₲ ${Number(data.total).toLocaleString()}</strong>
      </div>

      <div class="payment-section">
        <p>
          💵 Podrás abonar en efectivo al momento de la entrega
          o retiro en el local.
        </p>

        <p>
          Nuestro equipo se comunicará contigo para coordinar.
        </p>
      </div>
    </div>
  `;
}

function generarTarjetaHTML(data) {
  return `
    <div class="payment-card">
      <div class="payment-header">
        <h2>Pedido creado</h2>
        <span class="payment-status">Próximamente</span>
      </div>

      <div class="payment-section">
        <p>
          💳 El pago con tarjeta estará disponible próximamente.
        </p>

        <p>
          Por favor seleccioná transferencia o efectivo por ahora.
        </p>
      </div>
    </div>
  `;
}

async function finalizarCompra(event) {
  event.preventDefault();

  const carrito = obtenerCarrito();
  if (carrito.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  const metodoPago = document.getElementById("metodo-pago").value;

  const payload = {
    items: carrito,
    customerName: document.getElementById("customer-name").value.trim(),
    customerPhone: document.getElementById("customer-phone").value.trim(),
    customerEmail: document.getElementById("customer-email").value.trim(),
    deliveryAddress: document.getElementById("delivery-address").value.trim(),
    deliveryMethod: document.getElementById("delivery-method").value,
    notes: `Pago por ${metodoPago}`,
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

  // 🔥 Mostrar instrucciones de transferencia
 const resultDiv = document.getElementById("checkout-result");
  resultDiv.style.display = "block";

  if (metodoPago === "TRANSFER") {
    resultDiv.innerHTML = generarTransferenciaHTML(data);
    iniciarContador(24 * 60 * 60);
  }

  if (metodoPago === "CASH") {
    resultDiv.innerHTML = generarEfectivoHTML(data);
  }

  if (metodoPago === "CARD") {
    resultDiv.innerHTML = generarTarjetaHTML(data);
  }
}

/* =========================
   Init
========================= */

document.addEventListener("DOMContentLoaded", () => {
  renderCarrito();

  const form = document.getElementById("checkout-form");
  form.addEventListener("submit", finalizarCompra);

  const selectPago = document.getElementById("metodo-pago");
  const resultDiv = document.getElementById("checkout-result");

  selectPago.addEventListener("change", () => {
    const metodo = selectPago.value;
    resultDiv.style.display = "block";

    if (metodo === "TRANSFER") {
      resultDiv.innerHTML = `
        <div class="payment-card preview">
          <h3>Transferencia bancaria</h3>
          <p>Banco: Continental</p>
          <p>Alias: 1483780</p>
          <p class="preview-note">
            ℹ️ Los datos completos aparecerán al confirmar el pedido.
          </p>
        </div>
      `;
    }

    if (metodo === "CASH") {
      resultDiv.innerHTML = `
        <div class="payment-card preview">
          <h3>Pago en efectivo</h3>
          <p>💵 Pagarás al recibir el pedido o al retirar.</p>
        </div>
      `;
    }

    if (metodo === "CARD") {
      resultDiv.innerHTML = `
        <div class="payment-card preview">
          <h3>Pago con tarjeta</h3>
          <p>💳 Próximamente disponible.</p>
        </div>
      `;
    }
  });
});
