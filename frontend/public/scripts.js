const API_URL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
  cargarProductos();
});

async function cargarProductos() {
  try {
    const res = await fetch(`${API_URL}/products`);
    const productos = await res.json();

    const contenedor = document.querySelector(".products");
    contenedor.innerHTML = "";

    productos
      .filter(p => p.isActive)
      .forEach(producto => {
        const card = crearProductCard(producto);
        contenedor.appendChild(card);
      });

  } catch (error) {
    console.error("Error cargando productos", error);
  }
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

function agregarAlCarrito(id) {
  console.log("Agregar producto al carrito:", id);
  // siguiente paso: carrito
}
