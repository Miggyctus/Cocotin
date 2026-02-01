const API_URL = "http://localhost:3000";
const TOKEN = localStorage.getItem("token");

if (!TOKEN) {
  window.location.href = "login.html";
}

const navLinks = document.querySelectorAll(".sidebar nav a");

navLinks.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();

    navLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");

    // ocultar secciones
    document.querySelector(".productos-lista").style.display = "none";
    document.querySelector(".pedidos-lista").style.display = "none";
    document.querySelector(".estadisticas").style.display = "none";

    // 👇 MOSTRAR SEGÚN SECCIÓN
    if (link.textContent.includes("Productos")) {
      document.querySelector(".productos-lista").style.display = "block";
    }

    if (link.textContent.includes("Pedidos")) {
      document.querySelector(".pedidos-lista").style.display = "block";
      cargarPedidosAdmin();
    }

    if (link.textContent.includes("Estadísticas")) {
      document.querySelector(".estadisticas").style.display = "block";
      cargarEstadisticas();
    }
  });
});


let editandoProducto = null;

/* =========================
   PRODUCTOS
========================= */
async function cargarProductosAdmin() {
  try {
    const res = await fetch(`${API_URL}/products`);
    const productos = await res.json();

    const tbody = document.getElementById("tbody-productos");
    tbody.innerHTML = "";

    productos.forEach(producto => {
      tbody.innerHTML += `
        <tr>
          <td>
            ${
              producto.image
                ? `<img src="${API_URL}${producto.image}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;">`
                : "-"
            }
          </td>
          <td>${producto.name}</td>
          <td>${producto.category?.name ?? "-"}</td>
          <td>₲ ${Number(producto.price).toLocaleString()}</td>
          <td>${producto.stock}</td>
          <td>
            <span class="badge ${producto.isActive ? "activo" : "inactivo"}">
              ${producto.isActive ? "Activo" : "Inactivo"}
            </span>
          </td>
          <td class="acciones">
            <button class="btn-editar" onclick="editarProducto(${producto.id})">✏️</button>
            <button class="btn-toggle ${producto.isActive ? "" : "activar"}"
              onclick="toggleProducto(${producto.id})">
              ${producto.isActive ? "🚫" : "👁️"}
            </button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error(err);
    alert("Error al cargar productos");
  }
}

function mostrarFormulario() {
  document.getElementById("formulario-producto").style.display = "flex";
  document.getElementById("titulo-form").textContent = "Nuevo Producto";
  document.getElementById("form-producto").reset();
  document.getElementById("preview-imagen").style.display = "none";
  editandoProducto = null;
}

function cerrarFormulario() {
  document.getElementById("formulario-producto").style.display = "none";
}

/* =========================
   GUARDAR PRODUCTO (SUBMIT)
========================= */
document.getElementById("form-producto")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", document.getElementById("nombre").value);
    formData.append("description", document.getElementById("descripcion").value);
    formData.append("price", document.getElementById("precio").value);
    formData.append("stock", document.getElementById("stock").value);
    formData.append("category", document.getElementById("categoria").value);

    const imageInput = document.getElementById("imagen");
    if (imageInput.files[0]) {
      formData.append("image", imageInput.files[0]);
    }

    try {
      const url = editandoProducto
        ? `${API_URL}/products/${editandoProducto}`
        : `${API_URL}/products`;

      const method = editandoProducto ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: "Bearer " + TOKEN,
        },
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error(txt);
        throw new Error("Error al guardar producto");
      }

      alert("Producto guardado correctamente");
      cerrarFormulario();
      cargarProductosAdmin();
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar el producto");
    }
  });


/* =========================
   TOGGLE PRODUCTO
========================= */
async function toggleProducto(id) {
  try {
    const res = await fetch(`${API_URL}/products/${id}/toggle`, {
      method: "PATCH",
      headers: {
        Authorization: "Bearer " + TOKEN,
      },
    });

    if (!res.ok) throw new Error();
    cargarProductosAdmin();
  } catch {
    alert("No se pudo cambiar el estado del producto");
  }
}

/* =========================
   EDITAR PRODUCTO
========================= */
async function editarProducto(id) {
  const res = await fetch(`${API_URL}/products`);
  const productos = await res.json();
  const producto = productos.find(p => p.id === id);
  if (!producto) return;

  document.getElementById("titulo-form").textContent = "Editar Producto";
  document.getElementById("nombre").value = producto.name;
  document.getElementById("descripcion").value = producto.description ?? "";
  document.getElementById("precio").value = producto.price;
  document.getElementById("stock").value = producto.stock;
  document.getElementById("categoria").value = producto.categoryId;

  if (producto.image) {
    const img = document.getElementById("preview-imagen");
    img.src = `${API_URL}${producto.image}`;
    img.style.display = "block";
  }

  editandoProducto = id;
  document.getElementById("formulario-producto").style.display = "flex";
}

/* =========================
   PEDIDOS
========================= */
async function cargarPedidosAdmin() {
  try {
    const res = await fetch(`${API_URL}/orders`, {
      headers: {
        Authorization: "Bearer " + TOKEN,
      },
    });

    const pedidos = await res.json();
    const tbody = document.getElementById("tbody-pedidos");
    tbody.innerHTML = "";

    if (!Array.isArray(pedidos) || pedidos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center;color:#888;">
            No hay pedidos todavía
          </td>
        </tr>
      `;
      return;
    }

    pedidos.forEach(pedido => {
      tbody.innerHTML += `
        <tr>
          <td>#${pedido.id}</td>
          <td>₲ ${Number(pedido.total).toLocaleString()}</td>
          <td><span class="badge">${pedido.status}</span></td>
          <td>${new Date(pedido.createdAt).toLocaleString()}</td>
        </tr>
      `;
    });
  } catch (err) {
    console.error(err);
    alert("Error al cargar pedidos");
  }
}

/* =========================
   ESTADÍSTICAS
========================= */
async function cargarEstadisticas() {
  try {
    const res = await fetch(`${API_URL}/stats`, {
      headers: {
        Authorization: "Bearer " + TOKEN,
      },
    });

    const stats = await res.json();

    document.getElementById("stat-orders").textContent =
      `📦 Pedidos: ${stats.totalOrders}`;

    document.getElementById("stat-revenue").textContent =
      `💰 Total: ₲ ${Number(stats.totalRevenue).toLocaleString()}`;

    document.getElementById("stat-pending").textContent =
      `⏳ Pendientes: ${stats.pendingOrders}`;

    document.getElementById("stat-products").textContent =
      `📦 Productos: ${stats.products.active} activos / ${stats.products.inactive} inactivos`;

    const tbody = document.getElementById("tbody-top-products");
    tbody.innerHTML = "";

    if (!stats.topProducts || stats.topProducts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="2" style="text-align:center;color:#888;">
            No hay ventas todavía
          </td>
        </tr>
      `;
      return;
    }

    stats.topProducts.forEach(p => {
      tbody.innerHTML += `
        <tr>
          <td>${p.name}</td>
          <td>${p.quantity}</td>
        </tr>
      `;
    });
  } catch (err) {
    console.error(err);
  }
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", cargarProductosAdmin);
