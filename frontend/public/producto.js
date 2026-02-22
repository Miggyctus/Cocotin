const API_URL = "http://localhost:3000";
let productosGlobal = [];
document.addEventListener("DOMContentLoaded", cargarProducto);

async function cargarProducto() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    document.getElementById("producto-detalle").innerHTML =
      "<p>Producto no encontrado</p>";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/products/${id}`);
    const producto = await res.json();
    //productosGlobal = await res.json();

    //const producto = productosGlobal.find(p => p.id == id);

    if (!producto) {
      document.getElementById("producto-detalle").innerHTML =
        "<p>Producto no encontrado</p>";
      return;
    }

    renderProducto(producto);
    renderRelacionados(producto);

  } catch (err) {
    console.error(err);
    document.getElementById("producto-detalle").innerHTML =
      "<p>Error cargando producto</p>";
  }
}

function renderProducto(producto) {
    const contenedor = document.getElementById("producto-detalle");
    let stockHTML = "";

    if (producto.stock > 5) {
        stockHTML = `<p class="stock-ok">En stock</p>`;
    } else if (producto.stock > 0) {
        stockHTML = `<p class="stock-low">¡Últimas ${producto.stock} unidades!</p>`;
    } else {
        stockHTML = `<p class="stock-out">Sin stock</p>`;
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
        <img 
          src="${producto.image ? API_URL + producto.image : 'https://via.placeholder.com/400'}"
          alt="${producto.name}"
        >
      </div>

      <div class="producto-info">
        <h1>${producto.name}</h1>

        <p class="producto-category">
          ${producto.category?.name ?? ""}
        </p>

        <p class="producto-description">
          ${producto.description ?? ""}
        </p>

        <h2 class="producto-price">
          ₲ ${Number(producto.price).toLocaleString("es-PY")}
        </h2>
        ${stockHTML}
        <button 
        class="btn-primary"
            ${producto.stock === 0 ? "disabled" : ""}
            onclick="agregarAlCarrito(${producto.id})"
            >
            ${producto.stock === 0 ? "Sin stock" : "Agregar al carrito"}
        </button>

        <br><br>

        <div class="producto-actions">
            <button class="btn-secondary btn-volver" onclick="window.history.back()">
                ← Volver
            </button>
        </div>
      </div>
    </div>
    

    <div class="related-section">
    <h3>También te puede interesar</h3>
    <div class="related-products"></div>
    </div>
  `;
}



/* ============================ */
/* CARRITO (reutilizamos lógica) */
/* ============================ */

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
  alert("Producto agregado al carrito 🛒");
}

async function renderRelacionados(productoActual) {
  const contenedor = document.querySelector(".related-products");
  if (!contenedor) return;

  try {
    const res = await fetch(
      `${API_URL}/products?category=${encodeURIComponent(
        productoActual.category?.name
      )}&limit=6`
    );

    const productos = await res.json();

    // Excluimos el producto actual y sin stock
    const relacionados = productos
      .filter(p => p.id !== productoActual.id && p.stock > 0)
      .slice(0, 4);

    contenedor.innerHTML = "";

    relacionados.forEach(p => {
      const card = document.createElement("div");
      card.className = "related-card";

      card.innerHTML = `
        <img src="${
          p.image ? API_URL + p.image : "https://via.placeholder.com/200"
        }">
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