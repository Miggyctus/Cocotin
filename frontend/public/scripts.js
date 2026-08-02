const API_URL = "/api";

function getImageUrl(image) {
  if (!image) return "https://via.placeholder.com/400";
  if (image.startsWith("http")) return image;
  return image;
}

// ============================
// CATEGORÍAS CONFIG
// ============================
const CATEGORIAS_CONFIG = [
  {
    main: "Todos",
    icon: "✨",
    sidebar: []
  },
  {
    main: "Pañales",
    icon: "🧷",
    sidebar: [
      { label: "Pañales para bebés", value: "PAÑALES P/ BEBES" },
      { label: "Pañales para adultos", value: "PAÑALES P/ ADULTOS" },
    ]
  },
  {
    main: "Higiene",
    icon: "🧴",
    sidebar: [
      { label: "Higiene y cuidado personal", value: "HIGIENE Y CUIDADO PERSONAL" },
      { label: "Cosméticos", value: "COSMÉTICOS" },
      { label: "Farmacia", value: "FARMACIA" },
    ]
  },
  {
    main: "Alimentación",
    icon: "🍼",
    sidebar: [
      { label: "Alimentación del bebé", value: "ALIMENTACIÓN DEL BEBÉ" },
      { label: "Alimentación general", value: "ALIMENTACIÓN" },
      { label: "Botellas térmicas", value: "BOTELLAS TERMICAS" },
    ]
  },
  {
    main: "Cuidado",
    icon: "👶",
    sidebar: [
      { label: "Cuidado del bebé", value: "CUIDADO DEL BEBÉ" },
      { label: "Maternidad y lactancia", value: "MATERNIDAD Y LACTANCIA" },
      { label: "Accesorios", value: "ACCESORIOS" },
    ]
  },
  {
    main: "Juguetes",
    icon: "🧸",
    sidebar: [
      { label: "Juguetería", value: "JUGUETERÍA" },
    ]
  },
  {
    main: "Textil",
    icon: "👕",
    sidebar: [
      { label: "Textil", value: "TEXTIL" },
    ]
  },
  {
    main: "Hogar",
    icon: "🏠",
    sidebar: [
      { label: "Hogar", value: "HOGAR" },
      { label: "Otros artículos", value: "OTROS ARTICULOS" },
    ]
  },
];

// ============================
// ESTADO GLOBAL
// ============================
let productosGlobales = [];
let categoriaActiva = "Todos";
let subcategoriaActiva = null;

// ============================
// INIT
// ============================
document.addEventListener("DOMContentLoaded", () => {
  cargarProductos();
  actualizarBadgeCarrito();
  inicializarBuscador();
  inicializarCatNav();
  renderSidebar("Todos");
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
    actualizarContador(productosGlobales.length);
  } catch (error) {
    console.error("Error cargando productos", error);
  }
}

function renderProductos(lista) {
  const contenedor = document.querySelector(".products");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML = `
      <div class="empty-state">
        <p>No se encontraron productos</p>
        <span>Intenta con otra categoría o búsqueda</span>
      </div>`;
    return;
  }

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
      <img src="${getImageUrl(producto.image)}" alt="${producto.name}" loading="lazy">
    </div>
    <div class="product-info">
      <span class="product-category">${producto.category?.name ?? ""}</span>
      <h3 class="product-title">${producto.name}</h3>
      <div class="product-footer">
        <div class="product-price">
          ${producto.discountedPrice != null
            ? `<span class="price-old">₲ ${Number(producto.price).toLocaleString("es-PY")}</span>
               <span class="price-current">₲ ${Number(producto.discountedPrice).toLocaleString("es-PY")}</span>
               <span class="discount-label">Con efectivo/transferencia</span>`
            : `<span class="price-current">₲ ${Number(producto.price).toLocaleString("es-PY")}</span>`
          }
        </div>
        <button class="btn-add-cart" onclick="event.stopPropagation(); agregarAlCarrito(${producto.id})">+</button>
      </div>
    </div>
  `;
  return card;
}

function actualizarContador(n) {
  const el = document.getElementById("results-count");
  if (el) el.textContent = `${n} producto${n !== 1 ? "s" : ""} encontrado${n !== 1 ? "s" : ""}`;
}

// ============================
// SIDEBAR
// ============================
function renderSidebar(mainCat) {
  const config = CATEGORIAS_CONFIG.find(c => c.main === mainCat) || CATEGORIAS_CONFIG[0];
  const titleEl = document.getElementById("sidebar-title");
  const linksEl = document.getElementById("sidebar-links");
  if (!linksEl) return;

  // Update title
  if (titleEl) {
    titleEl.textContent = mainCat === "Todos" ? "Todas las categorías" : config.main;
  }

  linksEl.innerHTML = "";

  if (mainCat === "Todos") {
    // Show all categories as links
    CATEGORIAS_CONFIG.filter(c => c.main !== "Todos").forEach(cat => {
      if (cat.sidebar.length === 0) return;
      // Category group label
      const label = document.createElement("div");
      label.style.cssText = "padding: 8px 18px 4px; font-size:10px; font-weight:800; color:#999; text-transform:uppercase; letter-spacing:1px;";
      label.textContent = `${cat.icon} ${cat.main}`;
      linksEl.appendChild(label);

      cat.sidebar.forEach(sub => {
        linksEl.appendChild(crearSidebarLink(sub));
      });

      const div = document.createElement("div");
      div.className = "sidebar-divider";
      linksEl.appendChild(div);
    });
  } else {
    // Show subcategories of the active main category
    if (config.sidebar.length === 0) {
      const p = document.createElement("p");
      p.style.cssText = "padding:14px 18px; font-size:13px; color:#999;";
      p.textContent = "Todos los productos";
      linksEl.appendChild(p);
    } else {
      // "Ver todos" link
      const allLink = document.createElement("a");
      allLink.href = "#";
      allLink.innerHTML = `${config.icon} Ver todos`;
      allLink.className = "selected";
      allLink.addEventListener("click", e => {
        e.preventDefault();
        subcategoriaActiva = null;
        filtrarPorMain(mainCat);
        linksEl.querySelectorAll("a").forEach(a => a.classList.remove("selected"));
        allLink.classList.add("selected");
        limpiarFiltroTag();
      });
      linksEl.appendChild(allLink);

      config.sidebar.forEach(sub => {
        linksEl.appendChild(crearSidebarLink(sub, () => {
          linksEl.querySelectorAll("a").forEach(a => a.classList.remove("selected"));
        }));
      });
    }
  }
}

function crearSidebarLink(sub, onBeforeClick) {
  const a = document.createElement("a");
  a.href = "#";
  a.textContent = sub.label;
  a.addEventListener("click", e => {
    e.preventDefault();
    if (onBeforeClick) onBeforeClick();
    a.classList.add("selected");
    subcategoriaActiva = sub.value;
    filtrarPorSubcategoria(sub.value, sub.label);
    document.querySelector("#shop-layout")?.scrollIntoView({ behavior: "smooth" });
  });
  return a;
}

// ============================
// FILTRADO
// ============================
function normalizar(str) {
  return str?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() ?? "";
}

function filtrarPorMain(mainCat) {
  if (mainCat === "Todos") {
    renderProductos(productosGlobales);
    actualizarContador(productosGlobales.length);
    limpiarFiltroTag();
    return;
  }
  const config = CATEGORIAS_CONFIG.find(c => c.main === mainCat);
  if (!config) return;
  const valores = config.sidebar.map(s => normalizar(s.value));
  const filtrados = productosGlobales.filter(p => valores.includes(normalizar(p.category?.name)));
  renderProductos(filtrados);
  actualizarContador(filtrados.length);
  limpiarFiltroTag();
}

function filtrarPorSubcategoria(value, label) {
  const filtrados = productosGlobales.filter(p => normalizar(p.category?.name) === normalizar(value));
  renderProductos(filtrados);
  actualizarContador(filtrados.length);
  mostrarFiltroTag(label);
  document.querySelector("#shop-layout")?.scrollIntoView({ behavior: "smooth" });
}

function mostrarFiltroTag(label) {
  const el = document.getElementById("active-filter");
  if (!el) return;
  el.innerHTML = `
    <div class="filter-tag">
      ${label}
      <span class="filter-tag-remove" onclick="limpiarFiltro()">×</span>
    </div>`;
}

function limpiarFiltroTag() {
  const el = document.getElementById("active-filter");
  if (el) el.innerHTML = "";
}

function limpiarFiltro() {
  subcategoriaActiva = null;
  filtrarPorMain(categoriaActiva);
  renderSidebar(categoriaActiva);
}

// ============================
// NAV CATEGORY BAR
// ============================
function inicializarCatNav() {
  document.querySelectorAll(".cat-nav-item").forEach(item => {
    item.addEventListener("click", () => {
      const main = item.dataset.main;
      if (main === "Ofertas") {
        filtrarOfertas();
        return;
      }
      // Update active state
      document.querySelectorAll(".cat-nav-item").forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      categoriaActiva = main;
      subcategoriaActiva = null;
      filtrarPorMain(main);
      renderSidebar(main);
      document.querySelector("#shop-layout")?.scrollIntoView({ behavior: "smooth" });
    });

    // Handle dropdown link clicks
    item.querySelectorAll(".cat-dropdown a").forEach(link => {
      link.addEventListener("click", e => {
        e.stopPropagation();
        const cat = link.dataset.category;
        const label = link.textContent.trim();
        if (cat) {
          filtrarPorSubcategoria(cat, label);
        }
      });
    });
  });
}

// ============================
// OFERTAS
// ============================
function filtrarOfertas() {
  const ofertas = productosGlobales.filter(p => p.badge === "Oferta");
  renderProductos(ofertas);
  actualizarContador(ofertas.length);
  mostrarFiltroTag("Ofertas");
  document.querySelector("#shop-layout")?.scrollIntoView({ behavior: "smooth" });
}

const btnOfertas = document.getElementById("btn-ofertas");
if (btnOfertas) {
  btnOfertas.addEventListener("click", filtrarOfertas);
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
  if (item) { item.cantidad++; } else { carrito.push({ id, cantidad: 1 }); }
  guardarCarrito(carrito);
  actualizarBadgeCarrito();
  mostrarToast();
}
function actualizarBadgeCarrito() {
  const carrito = obtenerCarrito();
  const total = carrito.reduce((acc, p) => acc + p.cantidad, 0);
  const badge = document.querySelector(".cart-badge");
  if (!badge) return;
  badge.textContent = total > 0 ? total : "!";
}
function mostrarToast() {
  let toast = document.getElementById("toast-carrito");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-carrito";
    toast.style.cssText = `
      position:fixed; bottom:24px; right:24px;
      background:#0087c8; color:white;
      padding:12px 20px; border-radius:10px;
      font-family:'Nunito',sans-serif; font-weight:700; font-size:14px;
      box-shadow:0 8px 20px rgba(0,0,0,0.15);
      z-index:9999; transform:translateY(80px); opacity:0;
      transition:all 0.3s ease;
    `;
    toast.textContent = "✓ Producto agregado al carrito";
    document.body.appendChild(toast);
  }
  setTimeout(() => { toast.style.transform = "translateY(0)"; toast.style.opacity = "1"; }, 10);
  setTimeout(() => { toast.style.transform = "translateY(80px)"; toast.style.opacity = "0"; }, 2200);
}

// ============================
// BUSCADOR
// ============================
function inicializarBuscador() {
  const searchInput = document.querySelector(".search");
  if (!searchInput) return;
  searchInput.addEventListener("input", e => {
    const texto = e.target.value.toLowerCase();
    const filtrados = productosGlobales.filter(p => p.name.toLowerCase().includes(texto));
    renderProductos(filtrados);
    actualizarContador(filtrados.length);
  });
}

// ============================
// MODAL PRODUCTO
// ============================
function verProducto(id) {
  const producto = productosGlobales.find(p => p.id === id);
  if (!producto) return;
  document.getElementById("modal-producto-body").innerHTML = `
    <img src="${getImageUrl(producto.image)}" style="width:100%;max-height:300px;object-fit:cover;border-radius:8px;">
    <h2>${producto.name}</h2>
    <p>${producto.description ?? ""}</p>
    ${producto.discountedPrice != null
      ? `<p style="margin:0"><span style="text-decoration:line-through;color:#999;font-size:14px;">₲ ${Number(producto.price).toLocaleString("es-PY")}</span></p>
         <h3 style="margin:4px 0">₲ ${Number(producto.discountedPrice).toLocaleString("es-PY")}</h3>
         <span style="font-size:12px;color:#e91e8c;font-weight:600;">Con efectivo/transferencia</span>`
      : `<h3>₲ ${Number(producto.price).toLocaleString("es-PY")}</h3>`
    }
    <button class="btn-primary" onclick="agregarAlCarrito(${producto.id})">Agregar al carrito</button>
  `;
  document.getElementById("modal-producto").style.display = "flex";
}
function cerrarModalProducto() {
  document.getElementById("modal-producto").style.display = "none";
}

// ============================
// LOGO CLICK
// ============================
const logo = document.querySelector(".logo");
if (logo) {
  logo.addEventListener("click", () => { window.location.href = "index.html"; });
}

// ============================
// BANNER CAROUSEL
// ============================
(function () {
  let idx = 0;
  const total = 6;
  let timer;

  function update() {
    const track = document.getElementById("carousel-track");
    if (!track) return;
    track.style.transform = `translateX(-${idx * 100}%)`;
    document.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("active", i === idx));
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => { idx = (idx + 1) % total; update(); }, 5000);
  }

  window.moverCarousel = function (dir) {
    idx = (idx + dir + total) % total;
    update();
    resetTimer();
  };

  window.irASlide = function (i) {
    idx = i;
    update();
    resetTimer();
  };

  window.filtrarBanner = function (main) {
    document.querySelector("#shop-layout")?.scrollIntoView({ behavior: "smooth" });
    if (main === "Ofertas") { filtrarOfertas(); return; }
    const item = [...document.querySelectorAll(".cat-nav-item")].find(el => el.dataset.main === main);
    if (item) item.click();
  };

  resetTimer();
})();