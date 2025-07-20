/**
 * YourAuth Webflow SDK
 * Renders the exact same UI as your dashboard login/signup forms
 */

class YourAuthWebflowSDK {
  constructor(config) {
    this.appId = config.appId;
    this.apiUrl = config.apiUrl || "https://api.yourauth.com";
    this.auditEnabled = true;
    this.init();
  }

  async init() {
    console.log("YourAuth Webflow SDK initialized");
    this.injectStyles();
    this.setupEventListeners();
  }

  injectStyles() {
    const styles = `
      /* YourAuth Form Styles - Exact replica of dashboard UI */
      .yourauth-container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }

      .yourauth-card {
        background: hsl(0 0% 100%);
        border: 1px solid hsl(240 5.9% 90%);
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        overflow: hidden;
      }

      .yourauth-card-header {
        padding: 1.5rem 1.5rem 0.75rem;
        text-align: center;
      }

      .yourauth-card-title {
        font-size: 1.25rem;
        font-weight: 600;
        line-height: 1.75rem;
        color: hsl(240 10% 3.9%);
        margin: 0;
      }

      .yourauth-card-description {
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: hsl(240 3.8% 46.1%);
        margin: 0.25rem 0 0 0;
      }

      .yourauth-card-content {
        padding: 0.75rem 1.5rem 1.5rem;
      }

      .yourauth-grid {
        display: grid;
        gap: 1.5rem;
      }

      .yourauth-flex {
        display: flex;
      }

      .yourauth-flex-col {
        flex-direction: column;
      }

      .yourauth-gap-4 {
        gap: 1rem;
      }

      .yourauth-gap-6 {
        gap: 1.5rem;
      }

      .yourauth-gap-3 {
        gap: 0.75rem;
      }

      .yourauth-w-full {
        width: 100%;
      }

      .yourauth-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        line-height: 1.25rem;
        transition: all 0.2s;
        cursor: pointer;
        border: 1px solid transparent;
        padding: 0.5rem 1rem;
        text-decoration: none;
        box-sizing: border-box;
      }

      .yourauth-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .yourauth-button-outline {
        background: transparent;
        border-color: hsl(240 5.9% 90%);
        color: hsl(240 10% 3.9%);
      }

      .yourauth-button-outline:hover:not(:disabled) {
        background: hsl(240 4.8% 95.9%);
        color: hsl(240 10% 3.9%);
      }

      .yourauth-button-default {
        background: hsl(240 5.9% 10%);
        color: hsl(0 0% 98%);
      }

      .yourauth-button-default:hover:not(:disabled) {
        background: hsl(240 5.9% 10% / 0.9);
      }

      .yourauth-input {
        display: flex;
        height: 2.5rem;
        width: 100%;
        border-radius: 0.375rem;
        border: 1px solid hsl(240 5.9% 90%);
        background: hsl(0 0% 100%);
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: hsl(240 10% 3.9%);
        transition: border-color 0.2s;
        box-sizing: border-box;
      }

      .yourauth-input:focus {
        outline: 2px solid hsl(240 5.9% 10%);
        outline-offset: 2px;
        border-color: hsl(240 5.9% 10%);
      }

      .yourauth-input::placeholder {
        color: hsl(240 3.8% 46.1%);
      }

      .yourauth-label {
        font-size: 0.875rem;
        font-weight: 500;
        line-height: 1.25rem;
        color: hsl(240 10% 3.9%);
        margin: 0;
      }

      .yourauth-text-sm {
        font-size: 0.875rem;
        line-height: 1.25rem;
      }

      .yourauth-text-xs {
        font-size: 0.75rem;
        line-height: 1rem;
      }

      .yourauth-text-center {
        text-align: center;
      }

      .yourauth-text-red-500 {
        color: hsl(0 84.2% 60.2%);
      }

      .yourauth-text-muted-foreground {
        color: hsl(240 3.8% 46.1%);
      }

      .yourauth-underline {
        text-decoration: underline;
      }

      .yourauth-underline-offset-4 {
        text-underline-offset: 4px;
      }

      .yourauth-hover\\:underline:hover {
        text-decoration: underline;
      }

      .yourauth-relative {
        position: relative;
      }

      .yourauth-absolute {
        position: absolute;
      }

      .yourauth-bottom-\\[0\\.6rem\\] {
        bottom: 0.6rem;
      }

      .yourauth-right-2 {
        right: 0.5rem;
      }

      .yourauth-cursor-pointer {
        cursor: pointer;
      }

      .yourauth-items-center {
        align-items: center;
      }

      .yourauth-justify-between {
        justify-content: space-between;
      }

      .yourauth-ml-auto {
        margin-left: auto;
      }

      /* Divider styles */
      .yourauth-divider {
        position: relative;
        text-align: center;
        margin: 1.5rem 0;
      }

      .yourauth-divider::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: hsl(240 5.9% 90%);
      }

      .yourauth-divider span {
        background: hsl(0 0% 100%);
        padding: 0 0.5rem;
        color: hsl(240 3.8% 46.1%);
        font-size: 0.875rem;
        position: relative;
        z-index: 1;
      }

      /* SVG icons */
      .yourauth-svg {
        width: 1.25rem;
        height: 1.25rem;
      }

      /* Loading state */
      .yourauth-loading {
        opacity: 0.7;
        pointer-events: none;
      }

      /* Error message */
      .yourauth-error-message {
        color: hsl(0 84.2% 60.2%);
        font-size: 0.875rem;
        margin-top: 0.5rem;
      }

      /* Success message */
      .yourauth-success-message {
        color: hsl(142.1 76.2% 36.3%);
        font-size: 0.875rem;
        margin-top: 0.5rem;
      }

      /* Responsive */
      @media (max-width: 640px) {
        .yourauth-card-content {
          padding: 0.5rem 1rem 1rem;
        }
        
        .yourauth-card-header {
          padding: 1rem 1rem 0.5rem;
        }
      }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  setupEventListeners() {
    // Listen for form submissions
    document.addEventListener("submit", (e) => {
      if (e.target.classList.contains("yourauth-form")) {
        e.preventDefault();
        this.handleAuthForm(e.target);
      }
    });

    // Listen for Google login button clicks
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("yourauth-google-login")) {
        e.preventDefault();
        this.handleGoogleLogin();
      }
      if (e.target.classList.contains("yourauth-magic-link-toggle")) {
        e.preventDefault();
        this.toggleMagicLinkForm(e.target);
      }
    });
  }

  async handleAuthForm(form) {
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
    const response = await fetch(`${this.apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
        appId: this.appId,
      }),
    });

    const result = await response.json();

    if (result.success) {
      // Store tokens
      localStorage.setItem("yourauth_token", result.accessToken);
      if (result.refreshToken) {
        localStorage.setItem("yourauth_refresh_token", result.refreshToken);
      }

      // AUDIT LOG SUCCESS
      await this.auditLog("USER_LOGIN_SUCCESS", {
        method: "email_password",
        success: true,
        userId: result.user.id,
        email: formData.get("email"),
      });

      this.showSuccess("Login successful!");
      this.handleAuthSuccess(result);
    } else {
      // AUDIT LOG FAILURE
      await this.auditLog("USER_LOGIN_FAILED", {
        method: "email_password",
        success: false,
        error: result.errors?.[0]?.message || "Login failed",
        email: formData.get("email"),
      });

      throw new Error(result.errors?.[0]?.message || "Login failed");
    }
  }

  async signup(formData) {
    const response = await fetch(`${this.apiUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: formData.get("username"),
        email: formData.get("email"),
        password: formData.get("password"),
        confirmPassword: formData.get("confirmPassword"),
        acceptTerms: true,
        appId: this.appId,
      }),
    });

    const result = await response.json();

    if (result.success) {
      // Store tokens
      localStorage.setItem("yourauth_token", result.accessToken);
      if (result.refreshToken) {
        localStorage.setItem("yourauth_refresh_token", result.refreshToken);
      }

      // AUDIT LOG SUCCESS
      await this.auditLog("USER_SIGNUP_SUCCESS", {
        method: "email_password",
        success: true,
        userId: result.user.id,
        email: formData.get("email"),
      });

      this.showSuccess("Account created successfully!");
      this.handleAuthSuccess(result);
    } else {
      // AUDIT LOG FAILURE
      await this.auditLog("USER_SIGNUP_FAILED", {
        method: "email_password",
        success: false,
        error: result.errors?.[0]?.message || "Signup failed",
        email: formData.get("email"),
      });

      throw new Error(result.errors?.[0]?.message || "Signup failed");
    }
  }

  async sendMagicLink(formData) {
    const response = await fetch(`${this.apiUrl}/auth/requestPasswordReset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        appId: this.appId,
      }),
    });

    const result = await response.json();

    if (result.success) {
      // AUDIT LOG SUCCESS
      await this.auditLog("MAGIC_LINK_SENT", {
        method: "magic_link",
        success: true,
        email: formData.get("email"),
      });

      this.showSuccess("Magic link sent! Check your email.");
    } else {
      // AUDIT LOG FAILURE
      await this.auditLog("MAGIC_LINK_FAILED", {
        method: "magic_link",
        success: false,
        error: result.errors?.[0]?.message || "Failed to send magic link",
        email: formData.get("email"),
      });

      throw new Error(
        result.errors?.[0]?.message || "Failed to send magic link"
      );
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
    const response = await fetch(`${this.apiUrl}/auth/socialLogin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        token,
        appId: this.appId,
      }),
    });

    const result = await response.json();

    if (result.success) {
      // Store tokens
      localStorage.setItem("yourauth_token", result.accessToken);
      if (result.refreshToken) {
        localStorage.setItem("yourauth_refresh_token", result.refreshToken);
      }

      // AUDIT LOG SUCCESS
      await this.auditLog("USER_LOGIN_SUCCESS", {
        method: provider,
        success: true,
        userId: result.user.id,
      });

      return result;
    } else {
      // AUDIT LOG FAILURE
      await this.auditLog("USER_LOGIN_FAILED", {
        method: provider,
        success: false,
        error: result.errors?.[0]?.message || "Social login failed",
      });

      throw new Error(result.errors?.[0]?.message || "Social login failed");
    }
  }

  async auditLog(eventType, metadata) {
    if (!this.auditEnabled) return;

    try {
      await fetch(`${this.apiUrl}/sdk/audit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.appId}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventType,
          metadata: {
            ...metadata,
            platform: "webflow",
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            sdkVersion: "1.0.0",
          },
        }),
      });
    } catch (error) {
      console.warn("Audit logging failed:", error);
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
    const messages = form.parentElement.querySelectorAll(
      ".yourauth-error-message, .yourauth-success-message"
    );
    messages.forEach((msg) => msg.remove());
  }

  showError(form, message) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "yourauth-error-message";
    messageDiv.textContent = message;
    form.appendChild(messageDiv);

    // Re-enable buttons
    const buttons = form.querySelectorAll('button[type="submit"]');
    buttons.forEach((btn) => {
      btn.disabled = false;
      btn.textContent = btn.dataset.originalText || "Submit";
    });
  }

  showSuccess(message) {
    const successDiv = document.createElement("div");
    successDiv.className = "yourauth-success-message";
    successDiv.textContent = message;
    document.body.appendChild(successDiv);

    setTimeout(() => successDiv.remove(), 3000);
  }

  handleAuthSuccess(result) {
    // Trigger custom event for Webflow
    const event = new CustomEvent("yourauth:login", {
      detail: { user: result.user, token: result.accessToken },
    });
    document.dispatchEvent(event);

    // Redirect if specified
    const redirectUrl = new URLSearchParams(window.location.search).get(
      "redirect"
    );
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }

  getGoogleClientId() {
    // This should be configured per app
    return this.googleClientId || process.env.GOOGLE_CLIENT_ID;
  }

  // Public methods for external use
  logout() {
    localStorage.removeItem("yourauth_token");
    localStorage.removeItem("yourauth_refresh_token");

    this.auditLog("USER_LOGOUT", {
      success: true,
    });

    const event = new CustomEvent("yourauth:logout");
    document.dispatchEvent(event);
  }

  isAuthenticated() {
    return !!localStorage.getItem("yourauth_token");
  }

  getCurrentUser() {
    const token = localStorage.getItem("yourauth_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload;
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  // Render login form (exact replica of login-form.tsx)
  renderLoginForm(container) {
    container.innerHTML = `
      <div class="yourauth-container">
        <div class="yourauth-card">
          <div class="yourauth-card-header">
            <h3 class="yourauth-card-title">Welcome back</h3>
            <p class="yourauth-card-description">Login with your Apple or Google account</p>
          </div>
          <div class="yourauth-card-content">
            <div class="yourauth-grid">
              <div class="yourauth-flex yourauth-flex-col yourauth-gap-4">
                <button class="yourauth-button yourauth-button-outline yourauth-w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="yourauth-svg">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" fill="currentColor"/>
                  </svg>
                  Login with Apple
                </button>
                <button class="yourauth-button yourauth-button-outline yourauth-w-full yourauth-google-login">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="yourauth-svg">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor"/>
                  </svg>
                  Login with Google
                </button>
              </div>
              <div class="yourauth-divider">
                <span>Or continue with</span>
              </div>
              <form class="yourauth-form" data-type="login">
                <div class="yourauth-grid">
                  <div class="yourauth-grid yourauth-gap-3">
                    <label class="yourauth-label" for="email">Email</label>
                    <input class="yourauth-input" id="email" type="email" name="email" placeholder="m@example.com" required>
                  </div>
                  <div class="yourauth-grid yourauth-gap-3 yourauth-relative">
                    <div class="yourauth-flex yourauth-items-center yourauth-justify-between">
                      <label class="yourauth-label" for="password">Password</label>
                      <a href="#" class="yourauth-text-sm yourauth-underline yourauth-underline-offset-4 yourauth-hover:underline">Forgot your password?</a>
                    </div>
                    <input class="yourauth-input" id="password" type="password" name="password" required>
                  </div>
                  <button type="submit" class="yourauth-button yourauth-button-default yourauth-w-full">Login</button>
                </div>
              </form>
              <div class="yourauth-text-center yourauth-text-sm">
                Don't have an account? <a href="#" class="yourauth-underline yourauth-underline-offset-4">Sign up</a>
              </div>
            </div>
          </div>
        </div>
        <div class="yourauth-text-center yourauth-text-xs yourauth-text-muted-foreground">
          By clicking continue, you agree to our <a href="#" class="yourauth-underline yourauth-underline-offset-4">Terms of Service</a> and <a href="#" class="yourauth-underline yourauth-underline-offset-4">Privacy Policy</a>.
        </div>
      </div>
    `;
  }

  // Render signup form (exact replica of Signup-from.tsx)
  renderSignupForm(container) {
    container.innerHTML = `
      <div class="yourauth-container">
        <div class="yourauth-card">
          <div class="yourauth-card-header">
            <h3 class="yourauth-card-title">Welcome</h3>
            <p class="yourauth-card-description">Signup with your Apple or Google account</p>
          </div>
          <div class="yourauth-card-content">
            <div class="yourauth-grid">
              <div class="yourauth-flex yourauth-flex-col yourauth-gap-4">
                <button class="yourauth-button yourauth-button-outline yourauth-w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="yourauth-svg">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" fill="currentColor"/>
                  </svg>
                  Login with Apple
                </button>
                <button class="yourauth-button yourauth-button-outline yourauth-w-full yourauth-google-login">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="yourauth-svg">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor"/>
                  </svg>
                  Login with Google
                </button>
              </div>
              <div class="yourauth-divider">
                <span>Or continue with</span>
              </div>
              <form class="yourauth-form" data-type="signup">
                <div class="yourauth-grid">
                  <div class="yourauth-grid yourauth-gap-3">
                    <label class="yourauth-label" for="username">UserName</label>
                    <input class="yourauth-input" id="username" type="text" name="username" placeholder="john doe" required>
                  </div>
                  <div class="yourauth-grid yourauth-gap-3">
                    <label class="yourauth-label" for="email">Email</label>
                    <input class="yourauth-input" id="email" type="email" name="email" placeholder="m@example.com" required>
                  </div>
                  <div class="yourauth-grid yourauth-gap-3">
                    <div class="yourauth-flex yourauth-items-center yourauth-justify-between">
                      <label class="yourauth-label" for="password">Password</label>
                      <a href="#" class="yourauth-text-sm yourauth-underline yourauth-underline-offset-4 yourauth-hover:underline">Forgot your password?</a>
                    </div>
                    <input class="yourauth-input" id="password" type="password" name="password" placeholder="********" required>
                  </div>
                  <button type="submit" class="yourauth-button yourauth-button-default yourauth-w-full">Signup</button>
                </div>
              </form>
              <div class="yourauth-text-center yourauth-text-sm">
                Already have an account? <a href="#" class="yourauth-underline yourauth-underline-offset-4">Login</a>
              </div>
            </div>
          </div>
        </div>
        <div class="yourauth-text-center yourauth-text-xs yourauth-text-muted-foreground">
          By clicking continue, you agree to our <a href="#" class="yourauth-underline yourauth-underline-offset-4">Terms of Service</a> and <a href="#" class="yourauth-underline yourauth-underline-offset-4">Privacy Policy</a>.
        </div>
      </div>
    `;
  }
}

// Auto-initialize if config is available
if (window.YourAuthConfig) {
  window.YourAuthSDK = new YourAuthWebflowSDK(window.YourAuthConfig);
}

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = YourAuthWebflowSDK;
}
