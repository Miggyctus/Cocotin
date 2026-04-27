const API_URL = "/api";
document.addEventListener("DOMContentLoaded", cargarProducto);

function getImageUrl(image) {
  if (!image) return "https://via.placeholder.com/400";
  if (image.startsWith("http")) return image;
  return image;
}

/* =========================
   Carrito
========================= */
function obtenerCarrito() {
  return JSON.parse(localStorage.getItem("carrito")) || [];
}
function guardarCarrito(carrito) {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

function agregarAlCarrito(id) {
  const carrito = obtenerCarrito();
  const item = carrito.find(p => p.id === id);
  if (item) { item.cantidad++; } else { carrito.push({ id, cantidad: 1 }); }
  guardarCarrito(carrito);
  actualizarBadge();
  mostrarToast();
}

function actualizarBadge() {
  const carrito = obtenerCarrito();
  const total = carrito.reduce((acc, p) => acc + p.cantidad, 0);
  const badge = document.getElementById("cart-badge");
  if (badge) badge.textContent = total > 0 ? total : "!";
}

function mostrarToast() {
  let toast = document.getElementById("toast-carrito");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-carrito";
    toast.style.cssText = `
      position:fixed; bottom:24px; right:24px;
      background:var(--primary); color:white;
      padding:14px 22px; border-radius:10px;
      font-family:'Nunito',sans-serif; font-weight:700; font-size:14px;
      box-shadow:0 8px 20px rgba(0,0,0,0.15);
      z-index:9999; transform:translateY(80px); opacity:0;
      transition:all 0.3s ease; display:flex; align-items:center; gap:10px;
    `;
    toast.innerHTML = `✓ Producto agregado al carrito <a href="carrito.html" style="color:white;text-decoration:underline;font-size:12px;">Ver carrito</a>`;
    document.body.appendChild(toast);
  }
  setTimeout(() => { toast.style.transform = "translateY(0)"; toast.style.opacity = "1"; }, 10);
  setTimeout(() => { toast.style.transform = "translateY(80px)"; toast.style.opacity = "0"; }, 2500);
}

/* =========================
   Cargar producto
========================= */
async function cargarProducto() {
  actualizarBadge();
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    document.getElementById("producto-detalle").innerHTML = "<p>Producto no encontrado.</p>";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/products/${id}`);
    const producto = await res.json();

    if (!producto) {
      document.getElementById("producto-detalle").innerHTML = "<p>Producto no encontrado.</p>";
      return;
    }

    renderProducto(producto);
    renderRelacionados(producto);

  } catch (err) {
    console.error(err);
    document.getElementById("producto-detalle").innerHTML = "<p>Error cargando producto.</p>";
  }
}

/* =========================
   Render producto
========================= */
function renderProducto(producto) {
  const contenedor = document.getElementById("producto-detalle");

  let stockHTML = "";
  if (producto.stock > 5) {
    stockHTML = `<p class="stock-ok">✅ En stock</p>`;
  } else if (producto.stock > 0) {
    stockHTML = `<p class="stock-low">⚠️ ¡Últimas ${producto.stock} unidades!</p>`;
  } else {
    stockHTML = `<p class="stock-out">❌ Sin stock</p>`;
  }

  contenedor.innerHTML = `
    <div class="breadcrumb">
      <span onclick="window.location.href='index.html'">Inicio</span>
      <span>›</span>
      <span>${producto.category?.name ?? ""}</span>
      <span>›</span>
      <span>${producto.name}</span>
    </div>

    <div class="producto-page">
      <div class="producto-image">
        <img src="${getImageUrl(producto.image)}" alt="${producto.name}" />
      </div>

      <div class="producto-info">
        <span class="producto-cat-tag">${producto.category?.name ?? ""}</span>
        <h1>${producto.name}</h1>
        <p class="producto-description">${producto.description ?? ""}</p>

        <h2 class="producto-price">
          ₲ ${Number(producto.price).toLocaleString("es-PY")}
        </h2>

        ${stockHTML}

        <button
          class="btn-primary btn-agregar"
          ${producto.stock === 0 ? "disabled" : ""}
          onclick="agregarAlCarrito(${producto.id})"
        >
          ${producto.stock === 0 ? "Sin stock" : "🛒 Agregar al carrito"}
        </button>

        <a href="carrito.html" class="btn-ir-carrito">
          Ver carrito →
        </a>

        <div class="producto-actions">
          <button class="btn-volver" onclick="window.history.back()">← Volver</button>
        </div>
      </div>
    </div>

    <div class="related-section">
      <h3>También te puede interesar</h3>
      <div class="related-products"></div>
    </div>
  `;
}

/* =========================
   Productos relacionados
========================= */
async function renderRelacionados(productoActual) {
  const contenedor = document.querySelector(".related-products");
  if (!contenedor) return;

  try {
    const res = await fetch(
      `${API_URL}/products?category=${encodeURIComponent(productoActual.category?.name)}&limit=6`
    );
    const productos = await res.json();
    const relacionados = productos.filter(p => p.id !== productoActual.id && p.stock > 0).slice(0, 4);

    contenedor.innerHTML = "";
    relacionados.forEach(p => {
      const card = document.createElement("div");
      card.className = "related-card";
      card.innerHTML = `
        <img src="${getImageUrl(p.image)}" alt="${p.name}">
        <p>${p.name}</p>
        <span>₲ ${Number(p.price).toLocaleString("es-PY")}</span>
      `;
      card.addEventListener("click", () => {
        window.location.href = `producto.html?id=${p.id}`;
      });
      contenedor.appendChild(card);
    });

  } catch (err) {
    console.error("Error cargando relacionados:", err);
  }
}