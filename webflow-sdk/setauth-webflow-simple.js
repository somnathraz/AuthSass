/**
 * YourAuth Webflow SDK - Exact UI Replica
 * Renders the same UI as your dashboard login/signup forms
 */

class YourAuthWebflowSDK {
  constructor(config) {
    this.appId = config.appId;
    this.apiUrl = config.apiUrl || "https://api.yourauth.com";
    this.init();
  }

  init() {
    console.log("YourAuth Webflow SDK initialized");
    this.injectStyles();
  }

  injectStyles() {
    const styles = `
      /* Exact replica of your dashboard UI */
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

      /* Error message */
      .yourauth-error-message {
        color: hsl(0 84.2% 60.2%);
        font-size: 0.875rem;
        margin-top: 0.5rem;
      }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
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
                  <div class="yourauth-grid yourauth-gap-3">
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
