const API_URL = "http://localhost:3000";
const TOKEN = localStorage.getItem("token");

if (!TOKEN) {
  window.location.href = "login.html";
}

let editandoProducto = null;

/* =========================
   CARGAR PRODUCTOS
========================= */
async function cargarProductosAdmin() {
  try {
    const res = await fetch(`${API_URL}/products`);
    const productos = await res.json();

    const tbody = document.getElementById("tbody-productos");
    tbody.innerHTML = "";

    productos.forEach((producto) => {
      const row = `
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
          </td>
        </tr>
      `;
      tbody.innerHTML += row;
    });
  } catch (err) {
    console.error(err);
    alert("Error al cargar productos");
  }
}

/* =========================
   MODAL
========================= */
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
   PREVIEW IMAGEN
========================= */
document.getElementById("imagen").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = document.getElementById("preview-imagen");
    img.src = ev.target.result;
    img.style.display = "block";
  };
  reader.readAsDataURL(file);
});

/* =========================
   GUARDAR PRODUCTO
========================= */
document.getElementById("form-producto").addEventListener("submit", async (e) => {
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
      throw new Error("Error al guardar producto");
    }

    alert("Producto guardado correctamente");
    cerrarFormulario();
    cargarProductosAdmin();
  } catch (err) {
    console.error(err);
    alert("Error al guardar producto");
  }
});

/* =========================
   EDITAR (solo carga datos)
========================= */
async function editarProducto(id) {
  try {
    const res = await fetch(`${API_URL}/products`);
    const productos = await res.json();
    const producto = productos.find((p) => p.id === id);
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
  } catch (err) {
    console.error(err);
    alert("Error al cargar producto");
  }
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", cargarProductosAdmin);
