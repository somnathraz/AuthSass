# YourAuth Webflow SDK

Integrate your authentication platform with Webflow sites using this easy-to-use SDK.

## 🚀 Features

- ✅ **Email/Password Authentication** - Traditional login/signup
- ✅ **Google SSO** - One-click Google sign-in
- ✅ **Magic Link Authentication** - Passwordless email login
- ✅ **Automatic Audit Logging** - All auth events logged to your dashboard
- ✅ **Customizable UI** - Pre-built forms that match your design
- ✅ **Real-time Events** - Listen for login/logout events

## 📦 Installation

### 1. Add SDK to Your Webflow Site

Add this code to your Webflow site's **Custom Code** section (Site Settings > Custom Code > Head Code):

```html
<script src="https://cdn.yourauth.com/webflow-sdk.js"></script>
<script>
  window.YourAuthConfig = {
    appId: "your_app_secret_key_here",
    apiUrl: "https://api.yourauth.com",
  };
</script>
```

### 2. Get Your App Secret Key

1. Login to your YourAuth dashboard
2. Create a new application
3. Copy the **Secret Key** from the app settings
4. Replace `your_app_secret_key_here` in the code above

## 🎯 Usage Examples

### Basic Login Form

Add this HTML to any Webflow page:

```html
<form class="yourauth-form" data-type="login">
  <input type="email" name="email" placeholder="Email" required />
  <input type="password" name="password" placeholder="Password" required />
  <button type="submit">Login</button>
</form>
```

### Signup Form

```html
<form class="yourauth-form" data-type="signup">
  <input type="text" name="username" placeholder="Username" required />
  <input type="email" name="email" placeholder="Email" required />
  <input type="password" name="password" placeholder="Password" required />
  <input
    type="password"
    name="confirmPassword"
    placeholder="Confirm Password"
    required
  />
  <button type="submit">Sign Up</button>
</form>
```

### Magic Link Authentication

```html
<form class="yourauth-form" data-type="magic-link">
  <input type="email" name="email" placeholder="Email" required />
  <button type="submit">Send Magic Link</button>
</form>
```

### Google Sign-In Button

```html
<button class="yourauth-google-login">
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
    />
  </svg>
  Sign in with Google
</button>
```

### Complete Login Page Example

```html
<div class="auth-container">
  <h2>Welcome Back</h2>

  <!-- Google Sign-In -->
  <button class="yourauth-google-login">Sign in with Google</button>

  <div class="yourauth-divider">
    <span>or</span>
  </div>

  <!-- Email/Password Login -->
  <form class="yourauth-form" data-type="login">
    <input type="email" name="email" placeholder="Email" required />
    <input type="password" name="password" placeholder="Password" required />
    <button type="submit">Login</button>
  </form>

  <!-- Magic Link Option -->
  <p>
    Don't have a password?
    <a href="#" class="yourauth-magic-link">Send magic link</a>
  </p>
</div>
```

## 🔧 Advanced Usage

### Listen for Auth Events

```javascript
// Listen for successful login
document.addEventListener("yourauth:login", (event) => {
  const { user, token } = event.detail;
  console.log("User logged in:", user);

  // Update UI, redirect, etc.
  window.location.href = "/dashboard";
});

// Listen for logout
document.addEventListener("yourauth:logout", () => {
  console.log("User logged out");
  window.location.href = "/login";
});
```

### Check Authentication Status

```javascript
// Check if user is logged in
if (window.YourAuthSDK.isAuthenticated()) {
  console.log("User is authenticated");

  // Get current user info
  const user = window.YourAuthSDK.getCurrentUser();
  console.log("Current user:", user);
} else {
  console.log("User is not authenticated");
}
```

### Programmatic Logout

```javascript
// Logout user
window.YourAuthSDK.logout();
```

### Custom Redirect After Login

Add a `redirect` parameter to your login page URL:

```
https://yoursite.com/login?redirect=/dashboard
```

The SDK will automatically redirect users after successful login.

## 🎨 Customization

### Custom CSS Classes

The SDK automatically injects styles, but you can override them:

```css
/* Custom styles for your forms */
.yourauth-form {
  background: #f8f9fa;
  border: 2px solid #007bff;
}

.yourauth-form button {
  background: #28a745;
}

.yourauth-error {
  color: #dc3545;
  font-weight: bold;
}
```

### Custom Form Validation

```javascript
// Add custom validation before form submission
document.addEventListener("submit", (e) => {
  if (e.target.classList.contains("yourauth-form")) {
    const email = e.target.querySelector('input[name="email"]').value;

    if (!email.includes("@")) {
      e.preventDefault();
      alert("Please enter a valid email");
    }
  }
});
```

## 📊 Dashboard Integration

### View Auth Events

All authentication events are automatically logged to your YourAuth dashboard:

1. **Login to your dashboard**
2. **Navigate to your app**
3. **Go to Audit Logs**
4. **View all auth events** from your Webflow site

### Event Types Logged

- `USER_LOGIN_SUCCESS` - Successful email/password login
- `USER_LOGIN_FAILED` - Failed login attempts
- `USER_SIGNUP_SUCCESS` - Successful user registration
- `USER_SIGNUP_FAILED` - Failed signup attempts
- `MAGIC_LINK_SENT` - Magic link sent to user
- `MAGIC_LINK_FAILED` - Failed magic link attempts
- `USER_LOGOUT` - User logout events

### Analytics Dashboard

Your dashboard shows:

- **Total users** from your Webflow site
- **Login success rates**
- **Popular authentication methods**
- **Failed login attempts**
- **User growth over time**

## 🔒 Security Features

- **HTTPS Only** - All API calls use secure connections
- **Token Storage** - JWT tokens stored securely in localStorage
- **Automatic Logout** - Tokens expire automatically
- **Audit Trail** - Complete log of all authentication events
- **Rate Limiting** - Built-in protection against abuse

## 🚨 Troubleshooting

### Common Issues

**1. SDK not loading**

- Check if the script URL is correct
- Ensure the script is added to the Head Code section
- Check browser console for errors

**2. Authentication not working**

- Verify your app secret key is correct
- Check that your app is active in the dashboard
- Ensure your domain is whitelisted in app settings

**3. Google Sign-In not working**

- Verify Google OAuth is configured for your app
- Check that the Google Client ID is set correctly
- Ensure Google Identity Services script is loaded

### Debug Mode

Enable debug mode to see detailed logs:

```javascript
window.YourAuthConfig = {
  appId: "your_app_secret_key_here",
  apiUrl: "https://api.yourauth.com",
  debug: true,
};
```

## 📞 Support

Need help? Contact us:

- **Email**: support@yourauth.com
- **Documentation**: https://docs.yourauth.com
- **Dashboard**: https://dashboard.yourauth.com

## 🔄 Version History

- **v1.0.0** - Initial release with email/password, Google SSO, and magic link support
