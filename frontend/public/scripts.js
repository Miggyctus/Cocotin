const API_URL = "http://localhost:3000";

// ============================
// ESTADO GLOBAL
// ============================
let productosGlobales = [];

// ============================
// INIT
// ============================
document.addEventListener("DOMContentLoaded", () => {
  cargarProductos();
  actualizarBadgeCarrito();
  inicializarBuscador();
});

// ============================
// PRODUCTOS
// ============================
async function cargarProductos() {
  try {
    const res = await fetch(`${API_URL}/products`);
    const productos = await res.json();

    productosGlobales = productos.filter(p => p.isActive);
    renderProductos(productosGlobales);
  } catch (error) {
    console.error("Error cargando productos", error);
  }
}

function renderProductos(lista) {
  const contenedor = document.querySelector(".products");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  lista.forEach(producto => {
    contenedor.appendChild(crearProductCard(producto));
  });
}

function crearProductCard(producto) {
  const card = document.createElement("div");
  card.className = "product-card";

  card.innerHTML = `
    ${producto.isNew ? `<div class="product-badge">Nuevo</div>` : ""}
    
    <div class="product-image">
      <img 
        src="${producto.image ? API_URL + producto.image : 'https://via.placeholder.com/300'}" 
        alt="${producto.name}"
      >
    </div>

    <div class="product-info">
      <span class="product-category">
        ${producto.category?.name ?? ""}
      </span>

      <h3 class="product-title">
        ${producto.name}
      </h3>

      <p class="product-description">
        ${producto.description ?? ""}
      </p>

      <div class="product-footer">
        <div class="product-price">
          <span class="price-current">
            ₲ ${Number(producto.price).toLocaleString("es-PY")}
          </span>
        </div>

        <button class="btn-add-cart" onclick="agregarAlCarrito(${producto.id})">
          <span>+</span>
        </button>
      </div>
    </div>
  `;

  return card;
}

// ============================
// CARRITO
// ============================
function obtenerCarrito() {
  return JSON.parse(localStorage.getItem("carrito")) || [];
}

function guardarCarrito(carrito) {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

function agregarAlCarrito(id) {
  const carrito = obtenerCarrito();
  const item = carrito.find(p => p.id === id);

  if (item) {
    item.cantidad++;
  } else {
    carrito.push({ id, cantidad: 1 });
  }

  guardarCarrito(carrito);
  actualizarBadgeCarrito();
}

function actualizarBadgeCarrito() {
  const carrito = obtenerCarrito();
  const total = carrito.reduce((acc, p) => acc + p.cantidad, 0);

  const badge = document.querySelector(".cart-badge");
  if (!badge) return;

  badge.textContent = total > 0 ? total : "!";
}

// ============================
// BUSCADOR
// ============================
function inicializarBuscador() {
  const searchInput = document.querySelector(".search");
  if (!searchInput) return;

  searchInput.addEventListener("input", e => {
    const texto = e.target.value.toLowerCase();

    const filtrados = productosGlobales.filter(p =>
      p.name.toLowerCase().includes(texto)
    );

    renderProductos(filtrados);
  });
}

// ============================
// NAVEGACIÓN BÁSICA
// ============================
const logo = document.querySelector(".logo");
if (logo) {
  logo.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}
