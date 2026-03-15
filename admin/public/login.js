const API_URL = "/api";

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("user").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    console.log("LOGIN RESPONSE:", data); // 👈 DEBUG

    if (!res.ok) {
      throw new Error(data.error || "Error login");
    }

    localStorage.setItem("token", data.token);
    window.location.href = "admin.html";
  } catch (err) {
    console.error(err);
    document.getElementById("error").textContent =
      "Email o contraseña incorrectos";
  }
});
