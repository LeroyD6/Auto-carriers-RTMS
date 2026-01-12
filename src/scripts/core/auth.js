(function () {
  const AUTH_KEY = "kdgAuthSession";
  const VALID_EMAIL = "leroy@kdglogistics.com";
  const VALID_PASSWORD = "admin";
  const LOGIN_PAGE = "index.html";
  const HOME_PAGE = "home.html";

  const normalizeEmail = (value = "") => value.trim().toLowerCase();
  const hasSession = () => localStorage.getItem(AUTH_KEY) === "true";
  const startSession = () => {
    localStorage.setItem(AUTH_KEY, "true");
    sessionStorage.setItem(AUTH_KEY, "true");
  };
  const clearSession = () => {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
  };
  const redirectTo = (target) => {
    if (!target) return;
    window.location.href = target;
  };

  function handleLoginForm() {
    const form = document.querySelector("[data-login-form]");
    if (!form) {
      return;
    }

    if (hasSession()) {
      redirectTo(HOME_PAGE);
      return;
    }

    const emailInput = form.querySelector("#floatingInput");
    const passwordInput = form.querySelector("#floatingPassword");
    const errorTarget = form.querySelector("[data-login-error]");

    const showError = (message) => {
      if (!errorTarget) return;
      errorTarget.textContent = message;
      errorTarget.hidden = false;
    };

    const hideError = () => {
      if (!errorTarget) return;
      errorTarget.hidden = true;
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = normalizeEmail(emailInput?.value);
      const password = passwordInput?.value ?? "";

      const isValid = email === VALID_EMAIL && password === VALID_PASSWORD;
      if (!isValid) {
        clearSession();
        showError("Incorrect email or password.");
        return;
      }

      hideError();
      startSession();
      redirectTo(HOME_PAGE);
    });
  }

  function enforceProtectedRoute() {
    if (document.body.dataset.requiresAuth === "true" && !hasSession()) {
      redirectTo(LOGIN_PAGE);
    }
  }

  function handlePageShowAfterLogout() {
    window.addEventListener("pageshow", (event) => {
      if (event.persisted && document.body.dataset.requiresAuth === "true" && !hasSession()) {
        redirectTo(LOGIN_PAGE);
      }
    });
  }

  function wireSignOutLinks() {
    document.querySelectorAll("[data-signout]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        clearSession();
        const target = link.getAttribute("href") || LOGIN_PAGE;
        redirectTo(target);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    handleLoginForm();
    enforceProtectedRoute();
    wireSignOutLinks();
    handlePageShowAfterLogout();
  });
})();
