const API_BASE = "http://localhost:8080/api";

function login() {
  window.location.href = `${API_BASE}/auth/oauth2/google/start?client=portal`;
}

function logout() {
  localStorage.removeItem("miniportal_token");
  window.location.href = "index.html";
}

async function loadProfile() {
  // Extract token from URL (fallback mode)
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get("token");

  if (tokenFromUrl) {
    localStorage.setItem("miniportal_token", tokenFromUrl);
    // Remove token from URL so it doesn't linger
    window.history.replaceState({}, document.title, "/profile.html");
  }

  const token = localStorage.getItem("miniportal_token");

  if (!token) {
    // Not logged in, go to home
    window.location.href = "index.html";
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.ok) {
      const result = await response.json();
      const user = result.data;
      
      document.getElementById("loading").classList.add("hidden");
      document.getElementById("profile-card").classList.remove("hidden");
      
      document.getElementById("username").innerText = user.username || user.email;
      document.getElementById("email").innerText = user.email;
      document.getElementById("role").innerText = user.role;
      
      if (user.avatarUrl) {
        document.getElementById("avatar").src = user.avatarUrl;
      }
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (err) {
    console.error(err);
    document.getElementById("loading").classList.add("hidden");
    const errEl = document.getElementById("error");
    errEl.innerText = "Failed to load profile. Session might be invalid or expired.";
    errEl.classList.remove("hidden");
    localStorage.removeItem("miniportal_token");
  }
}
