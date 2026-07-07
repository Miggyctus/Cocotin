const API_URL = "/api";

function getImageUrl(image) {
  if (!image) return "https://via.placeholder.com/400";
  if (image.startsWith("http")) return image;
  return image;
}

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
   Limpia productos inválidos
========================= */
async function limpiarCarritoInvalido(productos) {
  const carrito = obtenerCarrito();
  const carritoLimpio = carrito.filter(item => productos.some(p => p.id === item.id));
  if (carritoLimpio.length !== carrito.length) guardarCarrito(carritoLimpio);
  return carritoLimpio;
}

/* =========================
   Actualizar badge
========================= */
function actualizarBadge() {
  const carrito = obtenerCarrito();
  const total = carrito.reduce((acc, p) => acc + p.cantidad, 0);
  const badge = document.getElementById("cart-badge");
  if (badge) badge.textContent = total > 0 ? total : "!";
}

/* =========================
   Render carrito
========================= */
async function renderCarrito() {
  const contenedor = document.getElementById("carrito-contenido");
  const totalEl = document.getElementById("carrito-total");
  const totalBar = document.getElementById("carrito-total-bar");

  let carrito = obtenerCarrito();

  if (carrito.length === 0) {
    contenedor.innerHTML = `
      <div class="carrito-vacio">
        <div class="carrito-vacio-icon">🛒</div>
        <p>Tu carrito está vacío</p>
        <a href="index.html" class="btn-primary" style="display:inline-block;text-decoration:none;margin-top:12px;">
          Ver productos
        </a>
      </div>`;
    if (totalBar) totalBar.style.display = "none";
    actualizarBadge();
    return;
  }

  const res = await fetch(`${API_URL}/products`);
  const productos = await res.json();
  carrito = await limpiarCarritoInvalido(productos);

  if (carrito.length === 0) {
    contenedor.innerHTML = `<div class="carrito-vacio"><div class="carrito-vacio-icon">🛒</div><p>Tu carrito está vacío</p></div>`;
    if (totalBar) totalBar.style.display = "none";
    actualizarBadge();
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
    div.className = "carrito-item";
    div.innerHTML = `
      <img src="${getImageUrl(producto.image)}" alt="${producto.name}" class="carrito-item-img" />
      <div class="carrito-item-info">
        <h3 class="carrito-item-name">${producto.name}</h3>
        <p class="carrito-item-cat">${producto.category?.name ?? ""}</p>
        <p class="carrito-item-price">₲ ${Number(producto.price).toLocaleString("es-PY")}</p>
      </div>
      <div class="carrito-item-actions">
        <div class="cart-actions">
          <button class="qty-btn" onclick="cambiarCantidad(${item.id}, -1)">−</button>
          <span class="qty-value">${item.cantidad}</span>
          <button class="qty-btn" onclick="cambiarCantidad(${item.id}, 1)">+</button>
        </div>
        <p class="carrito-item-subtotal">₲ ${Number(subtotal).toLocaleString("es-PY")}</p>
        <button class="remove-btn" onclick="eliminarItem(${item.id})" title="Eliminar">🗑️</button>
      </div>
    `;
    contenedor.appendChild(div);
  });

  if (totalEl) totalEl.textContent = `₲ ${total.toLocaleString("es-PY")}`;
  if (totalBar) totalBar.style.display = "flex";
  actualizarBadge();
}

/* =========================
   Acciones carrito
========================= */
function cambiarCantidad(id, delta) {
  const carrito = obtenerCarrito();
  const item = carrito.find(p => p.id === id);
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) { eliminarItem(id); return; }
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
   HTMLs de pago
========================= */
function copiarAlias() {
  const alias = document.getElementById("alias-value")?.innerText;
  if (!alias) return;
  navigator.clipboard.writeText(alias)
    .then(() => alert("Alias copiado al portapapeles"))
    .catch(() => alert("No se pudo copiar el alias"));
}

function generarTransferenciaHTML(data) {
  return `
    <div class="payment-card">
      <div class="payment-header">
        <h2>Pedido #${data.orderId} confirmado ✅</h2>
        <span class="payment-status">Pendiente de pago</span>
      </div>
      <div class="payment-total">
        Total a transferir: <strong>₲ ${Number(data.total).toLocaleString()}</strong>
      </div>
      <div class="reservation-timer">
        ⏳ Te reservamos el stock por: <span id="countdown-timer">24:00:00</span>
      </div>
      <div class="payment-section">
        <h3>Datos de transferencia</h3>
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
      <p style="margin-top:14px;font-size:13px;color:#888;">
        📩 Enviá el comprobante por WhatsApp para confirmar tu pedido.
      </p>
      <a href="https://wa.me/595984680361" target="_blank" class="btn-whatsapp">
        Enviar comprobante por WhatsApp
      </a>
    </div>`;
}

function generarEfectivoHTML(data) {
  return `
    <div class="payment-card">
      <div class="payment-header">
        <h2>Pedido #${data.orderId} confirmado ✅</h2>
        <span class="payment-status">Pago en efectivo</span>
      </div>
      <div class="payment-total">
        Total a pagar: <strong>₲ ${Number(data.total).toLocaleString()}</strong>
      </div>
      <div class="payment-section">
        <p>💵 Podrás abonar en efectivo al momento de la entrega o retiro en el local.</p>
        <p style="margin-top:8px;">Nuestro equipo se comunicará contigo para coordinar.</p>
      </div>
    </div>`;
}

function generarTarjetaExitoHTML(data) {
  return `
    <div class="payment-card">
      <div class="payment-header">
        <h2>Pedido #${data.orderId} pagado ✅</h2>
        <span class="payment-status" style="background:#d4edda;color:#155724;">Pago aprobado</span>
      </div>
      <div class="payment-total">
        Total pagado: <strong>₲ ${Number(data.total).toLocaleString("es-PY")}</strong>
      </div>
      <div class="payment-section">
        <p>🎉 Tu pago fue procesado correctamente. Nuestro equipo se comunicará contigo para coordinar la entrega.</p>
      </div>
    </div>`;
}

function generarTarjetaCanceladaHTML() {
  return `
    <div class="payment-card">
      <div class="payment-header">
        <h2>Pago cancelado ❌</h2>
        <span class="payment-status" style="background:#f8d7da;color:#721c24;">Cancelado</span>
      </div>
      <div class="payment-section">
        <p>El pago fue cancelado. Tu pedido quedó guardado — podés intentar nuevamente o elegir otro método de pago.</p>
        <p style="margin-top:8px;">Si tenés dudas, escribinos por WhatsApp.</p>
      </div>
      <a href="https://wa.me/595984680361" target="_blank" class="btn-whatsapp">Contactar por WhatsApp</a>
    </div>`;
}

function loadBancardScript() {
  return new Promise((resolve, reject) => {
    if (window.Bancard) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://vpos.infonet.com.py:8888/checkout/javascript/dist/bancard-checkout-4.0.0.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
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

  const metodoPago = document.querySelector('input[name="pago"]:checked')?.value || "TRANSFER";

  const payload = {
    items: carrito,
    customerName: document.getElementById("customer-name").value.trim(),
    customerPhone: document.getElementById("customer-phone").value.trim(),
    customerEmail: document.getElementById("customer-email").value.trim(),
    deliveryAddress: document.getElementById("delivery-address").value.trim(),
    deliveryMethod: document.getElementById("delivery-method").value,
    notes: `Pago por ${metodoPago}. ${document.getElementById("order-notes").value.trim()}`,
  };

  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      alert(errorData.error || "No se pudo crear el pedido.");
      return;
    }

    const data = await response.json();

    // === Flujo CARD: iframe de Bancard ===
    if (metodoPago === "CARD") {
      const resultDiv = document.getElementById("checkout-result");
      resultDiv.style.display = "block";
      resultDiv.innerHTML = `<div class="payment-card"><p>⏳ Iniciando pasarela de pago...</p></div>`;
      resultDiv.scrollIntoView({ behavior: "smooth" });

      const payRes = await fetch(`${API_URL}/payment/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderId }),
      });

      if (!payRes.ok) {
        alert("No se pudo iniciar el pago con tarjeta. Intentá nuevamente o elegí otro método.");
        return;
      }

      const { processId } = await payRes.json();

      // Guardar en sessionStorage para mostrar éxito al volver
      sessionStorage.setItem("pendingOrderId", data.orderId);
      sessionStorage.setItem("pendingOrderTotal", data.total);

      guardarCarrito([]);
      await renderCarrito();

      resultDiv.innerHTML = `
        <div class="payment-card">
          <h3 style="margin-bottom:16px;">💳 Completá tu pago con tarjeta</h3>
          <div id="bancard-iframe-container"></div>
        </div>`;

      await loadBancardScript();

      const styles = {
        "form-background-color": "#ffffff",
        "button-background-color": "#e91e8c",
        "button-text-color": "#ffffff",
        "button-border-color": "#e91e8c",
        "input-background-color": "#f9f9f9",
        "input-text-color": "#333333",
        "input-placeholder-color": "#999999",
      };

      window.Bancard.Checkout.createForm("bancard-iframe-container", processId, { styles });
      return;
    }

    // === Flujo TRANSFER y CASH ===
    guardarCarrito([]);
    await renderCarrito();
    document.getElementById("checkout-form").reset();

    const resultDiv = document.getElementById("checkout-result");
    resultDiv.style.display = "block";
    resultDiv.scrollIntoView({ behavior: "smooth" });

    if (metodoPago === "TRANSFER") {
      resultDiv.innerHTML = generarTransferenciaHTML(data);
      iniciarContador(24 * 60 * 60);
    } else {
      resultDiv.innerHTML = generarEfectivoHTML(data);
    }

  } catch (err) {
    console.error(err);
    alert("Ocurrió un error al procesar el pedido. Intentá nuevamente.");
  }
}

function iniciarContador(segundos) {
  const el = document.getElementById("countdown-timer");
  if (!el) return;
  const interval = setInterval(() => {
    if (segundos <= 0) { clearInterval(interval); el.textContent = "00:00:00"; return; }
    segundos--;
    const h = String(Math.floor(segundos / 3600)).padStart(2, "0");
    const m = String(Math.floor((segundos % 3600) / 60)).padStart(2, "0");
    const s = String(segundos % 60).padStart(2, "0");
    el.textContent = `${h}:${m}:${s}`;
  }, 1000);
}

/* =========================
   Preview pago al cambiar radio
========================= */
function actualizarPreviewPago(metodo) {
  const resultDiv = document.getElementById("checkout-result");
  resultDiv.style.display = "block";

  const previews = {
    TRANSFER: `<div class="payment-card preview">
      <h3>🏦 Transferencia bancaria</h3>
      <p>Banco: Continental · Alias: <strong>1483780</strong></p>
      <p class="preview-note">ℹ️ Los datos completos aparecerán al confirmar el pedido.</p>
    </div>`,
    CASH: `<div class="payment-card preview">
      <h3>💵 Pago en efectivo</h3>
      <p>Pagarás al recibir el pedido o al retirar en local.</p>
    </div>`,
    CARD: `<div class="payment-card preview">
      <h3>💳 Pago con tarjeta</h3>
      <p>Aceptamos tarjetas de crédito y débito. Al confirmar el pedido se abrirá la pasarela segura de Bancard.</p>
    </div>`,
  };

  resultDiv.innerHTML = previews[metodo] || "";
}

/* =========================
   Init
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  renderCarrito();

  const params = new URLSearchParams(window.location.search);
  const resultDiv = document.getElementById("checkout-result");

  if (params.get("pago") === "ok") {
    const orderId = sessionStorage.getItem("pendingOrderId");
    const total = sessionStorage.getItem("pendingOrderTotal");
    sessionStorage.removeItem("pendingOrderId");
    sessionStorage.removeItem("pendingOrderTotal");

    resultDiv.style.display = "block";
    resultDiv.innerHTML = `<div class="payment-card"><p>⏳ Verificando pago...</p></div>`;
    resultDiv.scrollIntoView({ behavior: "smooth" });

    try {
      const statusRes = await fetch(`${API_URL}/payment/status/${orderId}`);
      const statusData = await statusRes.json();

      if (statusData.status === "PAID") {
        resultDiv.innerHTML = generarTarjetaExitoHTML({ orderId, total: statusData.total });
      } else {
        resultDiv.innerHTML = `
          <div class="payment-card">
            <div class="payment-header">
              <h2>Pago no confirmado ⚠️</h2>
              <span class="payment-status" style="background:#fff3cd;color:#856404;">Pendiente</span>
            </div>
            <div class="payment-section">
              <p>Tu pedido fue creado pero el pago no pudo confirmarse. Si realizaste el pago, esperá unos minutos y revisá tu correo.</p>
              <p style="margin-top:8px;">Si el problema persiste, contactanos por WhatsApp.</p>
            </div>
            <a href="https://wa.me/595984680361" target="_blank" class="btn-whatsapp">Contactar por WhatsApp</a>
          </div>`;
      }
    } catch {
      resultDiv.innerHTML = generarTarjetaExitoHTML({ orderId, total });
    }
  } else if (params.get("pago") === "cancelado") {
    resultDiv.style.display = "block";
    resultDiv.innerHTML = generarTarjetaCanceladaHTML();
    resultDiv.scrollIntoView({ behavior: "smooth" });
  }

  const form = document.getElementById("checkout-form");
  form.addEventListener("submit", finalizarCompra);

  document.querySelectorAll('input[name="pago"]').forEach(radio => {
    radio.addEventListener("change", () => actualizarPreviewPago(radio.value));
  });

  actualizarPreviewPago("TRANSFER");
});