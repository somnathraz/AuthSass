/**
 * YourAuth WordPress SDK
 * Handles authentication forms and Google Sign-In for WordPress
 */

class YourAuthWordPressSDK {
  constructor() {
    this.config = window.yourAuthConfig;
    this.init();
  }

  init() {
    console.log("YourAuth WordPress SDK initialized");
    this.bindEvents();
  }

  bindEvents() {
    // Listen for form submissions
    document.addEventListener("submit", (e) => {
      if (e.target.classList.contains("yourauth-form")) {
        e.preventDefault();
        this.handleForm(e.target);
      }
    });

    // Listen for Google login button clicks
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("yourauth-google-login")) {
        e.preventDefault();
        this.handleGoogleLogin();
      }
      if (e.target.classList.contains("yourauth-logout")) {
        e.preventDefault();
        this.handleLogout(e.target);
      }
      if (e.target.classList.contains("yourauth-magic-link-toggle")) {
        e.preventDefault();
        this.toggleMagicLinkForm(e.target);
      }
    });
  }

  async handleForm(form) {
    const formType = form.dataset.type || "login";
    const formData = new FormData(form);

    this.showLoading(form);
    this.clearMessages(form);

    try {
      if (formType === "login") {
        await this.login(formData);
      } else if (formType === "signup") {
        await this.signup(formData);
      } else if (formType === "magic-link") {
        await this.sendMagicLink(formData);
      }
    } catch (error) {
      this.showError(form, error.message);
    }
  }

  async login(formData) {
    const response = await fetch(this.config.ajaxUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        action: "yourauth_login",
        nonce: this.config.nonce,
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    const result = await response.json();

    if (result.success) {
      this.showSuccess(form, "Login successful!");
      this.handleAuthSuccess(result.data, form.dataset.redirect);
    } else {
      throw new Error(result.data[0].message || "Login failed");
    }
  }

  async signup(formData) {
    const response = await fetch(this.config.ajaxUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        action: "yourauth_signup",
        nonce: this.config.nonce,
        username: formData.get("username"),
        email: formData.get("email"),
        password: formData.get("password"),
        confirmPassword: formData.get("confirmPassword"),
      }),
    });

    const result = await response.json();

    if (result.success) {
      this.showSuccess(form, "Account created successfully!");
      this.handleAuthSuccess(result.data, form.dataset.redirect);
    } else {
      throw new Error(result.data[0].message || "Signup failed");
    }
  }

  async sendMagicLink(formData) {
    const response = await fetch(this.config.ajaxUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        action: "yourauth_magic_link",
        nonce: this.config.nonce,
        email: formData.get("email"),
      }),
    });

    const result = await response.json();

    if (result.success) {
      this.showSuccess(form, "Magic link sent! Check your email.");
    } else {
      throw new Error(result.data[0].message || "Failed to send magic link");
    }
  }

  async handleGoogleLogin() {
    if (
      typeof window !== "undefined" &&
      window.google &&
      window.google.accounts
    ) {
      window.google.accounts.id.initialize({
        client_id: this.getGoogleClientId(),
        callback: async (response) => {
          try {
            const result = await this.socialLogin(
              "google",
              response.credential
            );
            this.handleAuthSuccess(result);
          } catch (error) {
            this.showError(document.body, error.message);
          }
        },
      });
      window.google.accounts.id.prompt();
    } else {
      throw new Error("Google Sign-In not available");
    }
  }

  async socialLogin(provider, token) {
    const response = await fetch(this.config.ajaxUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        action: "yourauth_social_login",
        nonce: this.config.nonce,
        provider: provider,
        token: token,
      }),
    });

    const result = await response.json();

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.data[0].message || "Social login failed");
    }
  }

  async handleLogout(button) {
    try {
      const response = await fetch(this.config.ajaxUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          action: "yourauth_logout",
          nonce: this.config.nonce,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Trigger logout event
        const event = new CustomEvent("yourauth:logout");
        document.dispatchEvent(event);

        // Redirect if specified
        const redirectUrl =
          button.dataset.redirect || this.getLogoutRedirectUrl();
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  toggleMagicLinkForm(link) {
    const container = link.closest(".yourauth-container");
    const loginForm = container.querySelector(
      '.yourauth-form[data-type="login"]'
    );
    const magicLinkForm = container.querySelector(
      '.yourauth-form[data-type="magic-link"]'
    );
    const magicLinkText = container.querySelector(".yourauth-magic-link-text");

    if (loginForm && magicLinkForm) {
      if (loginForm.style.display === "none") {
        // Show login form
        loginForm.style.display = "block";
        magicLinkForm.style.display = "none";
        link.textContent = "Send magic link";
      } else {
        // Show magic link form
        loginForm.style.display = "none";
        magicLinkForm.style.display = "block";
        link.textContent = "Back to login";
      }
    }
  }

  showLoading(form) {
    const buttons = form.querySelectorAll('button[type="submit"]');
    buttons.forEach((btn) => {
      btn.disabled = true;
      btn.dataset.originalText = btn.textContent;
      btn.textContent = "Loading...";
    });
  }

  clearMessages(form) {
    const messages = form.parentElement.querySelectorAll(".yourauth-message");
    messages.forEach((msg) => msg.remove());
  }

  showError(form, message) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "yourauth-message yourauth-error";
    messageDiv.textContent = message;
    form.parentElement.appendChild(messageDiv);

    // Re-enable buttons
    const buttons = form.querySelectorAll('button[type="submit"]');
    buttons.forEach((btn) => {
      btn.disabled = false;
      btn.textContent = btn.dataset.originalText || "Submit";
    });
  }

  showSuccess(form, message) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "yourauth-message yourauth-success";
    messageDiv.textContent = message;
    form.parentElement.appendChild(messageDiv);

    // Re-enable buttons
    const buttons = form.querySelectorAll('button[type="submit"]');
    buttons.forEach((btn) => {
      btn.disabled = false;
      btn.textContent = btn.dataset.originalText || "Submit";
    });
  }

  handleAuthSuccess(result, redirectUrl) {
    // Update config
    this.config.isLoggedIn = true;
    this.config.currentUser = result.user;

    // Trigger login event
    const event = new CustomEvent("yourauth:login", {
      detail: { user: result.user, token: result.accessToken },
    });
    document.dispatchEvent(event);

    // Redirect if specified
    const finalRedirectUrl = redirectUrl || this.getLoginRedirectUrl();
    if (finalRedirectUrl) {
      window.location.href = finalRedirectUrl;
    } else {
      window.location.reload();
    }
  }

  getGoogleClientId() {
    // This should be configured in WordPress admin
    return this.config.googleClientId;
  }

  getLoginRedirectUrl() {
    // Get from WordPress options
    return this.config.loginRedirectUrl;
  }

  getLogoutRedirectUrl() {
    // Get from WordPress options
    return this.config.logoutRedirectUrl;
  }

  // Public methods for external use
  isAuthenticated() {
    return this.config.isLoggedIn;
  }

  getCurrentUser() {
    return this.config.currentUser;
  }

  logout() {
    const logoutButton = document.querySelector(".yourauth-logout");
    if (logoutButton) {
      this.handleLogout(logoutButton);
    }
  }
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  if (window.yourAuthConfig) {
    window.YourAuthSDK = new YourAuthWordPressSDK();
  }
});

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = YourAuthWordPressSDK;
}
