const API_URL = "/api";

function getImageUrl(image) {
  if (!image) return "https://via.placeholder.com/400";

  // 🔥 SI ES LINK (http/https)
  if (image.startsWith("http")) {
    return image;
  }

  // 🔥 SI ES LOCAL
  return image;
}

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

  card.addEventListener("click", () => {
    window.location.href = `producto.html?id=${producto.id}`;
  });

  card.innerHTML = `
    ${producto.isNew ? `<div class="product-badge">Nuevo</div>` : ""}
    
    <div class="product-image">
      <img 
        src="${getImageUrl(producto.image)}"
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

// ============================
// FILTRADO POR CATEGORÍA
// ============================
function normalizar(str) {
  return str
    ?.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

document.querySelectorAll(".category-card").forEach(card => {
  card.addEventListener("click", () => {
    const categoria = card.dataset.category;

    if (categoria === "Todos") {
      renderProductos(productosGlobales);
    } else {
      const categorias = categoria.split(",").map(c => normalizar(c));

      const filtrados = productosGlobales.filter(p => {
        const catProducto = normalizar(p.category?.name);
        return categorias.includes(catProducto);
      });

      console.log("Filtrados:", filtrados); // 👈 debug

      renderProductos(filtrados);
    }

    document.querySelector("#productos").scrollIntoView({
      behavior: "smooth"
    });
  });
});
// ============================
// FILTRO OFERTAS
// ============================
const btnOfertas = document.getElementById("btn-ofertas");

if (btnOfertas) {
  btnOfertas.addEventListener("click", () => {
    const ofertas = productosGlobales.filter(p => 
      p.badge === "Oferta"
    );

    renderProductos(ofertas);

    document.querySelector("#productos").scrollIntoView({
      behavior: "smooth"
    });
  });
}

function verProducto(id) {
  const producto = productosGlobales.find(p => p.id === id);
  if (!producto) return;

  const html = `
    <img 
      src="${getImageUrl(producto.image)}"
      style="width:100%;max-height:300px;object-fit:cover;border-radius:8px;"
    >
    <h2>${producto.name}</h2>
    <p>${producto.description ?? ""}</p>
    <h3>₲ ${Number(producto.price).toLocaleString("es-PY")}</h3>
    <button class="btn-primary" onclick="agregarAlCarrito(${producto.id})">
      Agregar al carrito
    </button>
  `;

  document.getElementById("modal-producto-body").innerHTML = html;
  document.getElementById("modal-producto").style.display = "flex";
}

function cerrarModalProducto() {
  document.getElementById("modal-producto").style.display = "none";
}
