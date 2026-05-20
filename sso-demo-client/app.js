const API_BASE = "http://localhost:9080/api";

function login() {
  window.location.href = `${API_BASE}/auth/oauth2/google/start?client=portal`;
}

async function logout() {
  const token = localStorage.getItem("miniportal_token");
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    // Notify backend to clear cookie session
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers,
      credentials: "include"
    });
  } catch (err) {
    console.error("Backend logout failed:", err);
  }

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
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const token = localStorage.getItem("miniportal_token");
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    // Fetch profile using token (if present in localStorage) or HttpOnly Cookie
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers,
      credentials: "include" // Crucial: send session cookie to backend
    });

    if (response.ok) {
      const result = await response.json();
      const user = result.data;

      document.getElementById("loading").classList.add("hidden");
      document.getElementById("profile-card").classList.remove("hidden");

      document.getElementById("username").innerText = user.username || user.name || user.email;
      document.getElementById("email").innerText = user.email;
      document.getElementById("role").innerText = user.role;

      if (user.avatarUrl) {
        document.getElementById("avatar").src = user.avatarUrl;
      }
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (err) {
    console.error("Profile load failed / SSO inactive:", err);
    localStorage.removeItem("miniportal_token");
    // Not authenticated, redirect to login page
    window.location.href = "index.html";
  }
}

async function checkSSOOnHome() {
  const token = localStorage.getItem("miniportal_token");
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    // Attempt silently fetching /auth/me using credentials/cookie
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers,
      credentials: "include"
    });
    if (response.ok) {
      // User is already logged in via SSO cookie! Redirect to profile page
      window.location.href = "profile.html";
    }
  } catch (err) {
    // Not logged in, stay on index.html
  }
}

// Auto-check SSO when landing on index.html
if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/" || window.location.pathname.endsWith("/")) {
  window.onload = checkSSOOnHome;
}
