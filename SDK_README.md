# YourAuth SDK System

Complete SDK solution for integrating your authentication platform with Webflow and WordPress sites.

## 🚀 **Overview**

The YourAuth SDK system provides easy integration for no-code platforms, allowing customers to:

1. **Create an app** in your dashboard
2. **Get a secret key** for SDK integration
3. **Add authentication** to their sites with simple HTML
4. **View all auth events** in their dashboard

## 📦 **SDK Components**

### **1. Webflow SDK**

- **File**: `webflow-sdk/yourauth-webflow.js`
- **Installation**: Add to Webflow Custom Code
- **Features**: Email/password, Google SSO, Magic link, Automatic audit logging

### **2. WordPress Plugin**

- **File**: `wordpress-plugin/yourauth-wordpress.php`
- **Installation**: Upload to WordPress plugins directory
- **Features**: Shortcodes, Admin settings, AJAX handlers, Automatic audit logging

### **3. Backend SDK Endpoint**

- **File**: `backend/src/routes/sdk/audit.js`
- **Purpose**: Receives auth events from SDKs and logs to dashboard
- **Features**: Token validation, APPLICATION tier audit logging

## 🔄 **Integration Flow**

### **Step 1: Customer Creates App**

```typescript
// Customer logs into your dashboard
// Creates new application
// Gets secret key: "app_secret_123456"
```

### **Step 2: Customer Integrates SDK**

```html
<!-- Webflow Custom Code -->
<script src="https://cdn.yourauth.com/webflow-sdk.js"></script>
<script>
  window.YourAuthConfig = {
    appId: "app_secret_123456",
    apiUrl: "https://api.yourauth.com",
  };
</script>

<!-- WordPress Plugin -->
[yourauth_login] [yourauth_signup] [yourauth_google_login]
```

### **Step 3: Users Authenticate**

```javascript
// User fills out form on customer's site
// SDK sends auth request to your API
// SDK automatically logs event to dashboard
```

### **Step 4: Customer Views Analytics**

```typescript
// Customer logs into dashboard
// Navigates to app audit logs
// Sees all authentication events from their site
```

## 🎯 **SDK Features**

### **Authentication Methods**

- ✅ **Email/Password** - Traditional login/signup
- ✅ **Google SSO** - One-click Google sign-in
- ✅ **Magic Link** - Passwordless email authentication
- ✅ **Automatic Audit Logging** - All events logged to dashboard

### **Platform Support**

- ✅ **Webflow** - Custom code integration
- ✅ **WordPress** - Plugin with shortcodes
- 🔄 **Bubble** - Coming soon
- 🔄 **Wix** - Coming soon
- 🔄 **Shopify** - Coming soon

### **Dashboard Integration**

- ✅ **Real-time Events** - Auth events appear immediately
- ✅ **User Analytics** - Login success rates, popular methods
- ✅ **Security Monitoring** - Failed login attempts, suspicious activity
- ✅ **Export Capabilities** - Download audit logs for compliance

## 📊 **Audit Event Types**

### **Login Events**

```javascript
USER_LOGIN_SUCCESS; // Successful email/password login
USER_LOGIN_FAILED; // Failed login attempt
SOCIAL_LOGIN_SUCCESS; // Successful Google/SSO login
SOCIAL_LOGIN_FAILED; // Failed social login
```

### **Registration Events**

```javascript
USER_SIGNUP_SUCCESS; // Successful user registration
USER_SIGNUP_FAILED; // Failed signup attempt
```

### **Password Management**

```javascript
MAGIC_LINK_SENT; // Magic link sent to user
MAGIC_LINK_FAILED; // Failed magic link attempt
PASSWORD_RESET_REQUEST; // Password reset requested
PASSWORD_RESET_SUCCESS; // Password successfully reset
```

### **Session Events**

```javascript
USER_LOGOUT; // User logged out
SESSION_EXPIRED; // Session expired
TOKEN_REFRESH; // Access token refreshed
```

## 🔧 **Technical Implementation**

### **SDK Authentication**

```javascript
// SDK sends requests with app secret key
Authorization: Bearer app_secret_123456

// Backend validates token and logs events
POST /api/sdk/audit
{
  "eventType": "USER_LOGIN_SUCCESS",
  "userId": "user_123",
  "metadata": {
    "method": "email_password",
    "platform": "webflow",
    "success": true
  }
}
```

### **Audit Logging**

```javascript
// Events automatically logged to APPLICATION tier
await auditApplicationLog(
  eventType, // "USER_LOGIN_SUCCESS"
  customerId, // Organization ID
  appId, // Application ID
  userId, // User ID (if available)
  metadata // Additional event data
);
```

### **Dashboard Display**

```typescript
// Customers see events in their app audit logs
/dashboard/[orgId]/app/[appId]/audit
├── Recent Events
├── Event Analytics
├── User Activity
└── Security Alerts
```

## 🚀 **Getting Started**

### **For Your Customers**

#### **1. Create Application**

1. Login to your dashboard
2. Navigate to Applications
3. Click "Create New Application"
4. Copy the **Secret Key**

#### **2. Webflow Integration**

```html
<!-- Add to Webflow Custom Code (Head) -->
<script src="https://cdn.yourauth.com/webflow-sdk.js"></script>
<script>
  window.YourAuthConfig = {
    appId: "your_secret_key_here",
    apiUrl: "https://api.yourauth.com",
  };
</script>

<!-- Add to any page -->
<form class="yourauth-form" data-type="login">
  <input type="email" name="email" placeholder="Email" required />
  <input type="password" name="password" placeholder="Password" required />
  <button type="submit">Login</button>
</form>
```

#### **3. WordPress Integration**

```bash
# Upload plugin to WordPress
# Activate plugin
# Configure in WordPress Admin > Settings > YourAuth
```

```php
<!-- Use shortcodes in any post/page -->
[yourauth_login]
[yourauth_signup]
[yourauth_google_login]
[yourauth_logout]
```

#### **4. View Analytics**

1. Login to your dashboard
2. Navigate to your application
3. Click "Audit Logs"
4. View all authentication events

### **For Developers**

#### **Backend Setup**

```javascript
// Add SDK routes to your Express app
const sdkRoutes = require("./routes/sdk/audit");
app.use("/api/sdk", sdkRoutes);

// Ensure App model has secretKey field
const appSchema = new mongoose.Schema({
  secretKey: { type: String, required: true, unique: true },
  // ... other fields
});
```

#### **Dashboard Integration**

```typescript
// Add SDK events to your audit dashboard
const sdkEvents = await getApplicationAuditLogs(appId, {
  filter: { actorType: "END_USER" },
});
```

## 📈 **Business Benefits**

### **For Your Platform**

- ✅ **Immediate Market Access** - No-code platforms are huge markets
- ✅ **Easy Customer Onboarding** - Simple integration process
- ✅ **Automatic Data Collection** - Rich analytics from day one
- ✅ **Competitive Advantage** - Unique no-code SDK offering

### **For Your Customers**

- ✅ **Zero Development** - No coding required
- ✅ **Professional Auth** - Enterprise-grade authentication
- ✅ **Complete Analytics** - Full visibility into user behavior
- ✅ **Security Compliance** - Audit trails for regulatory requirements

## 🔒 **Security Features**

### **SDK Security**

- **HTTPS Only** - All API calls use secure connections
- **Token Validation** - App secret keys validated on every request
- **Rate Limiting** - Built-in protection against abuse
- **Audit Trail** - Complete log of all authentication events

### **Data Privacy**

- **Customer Isolation** - Events only visible to app owners
- **No Data Storage** - SDKs don't store sensitive data
- **Secure Tokens** - JWT tokens with automatic expiration
- **GDPR Compliant** - Audit logs support data subject requests

## 🚨 **Troubleshooting**

### **Common Issues**

#### **SDK Not Loading**

```javascript
// Check browser console for errors
// Verify script URL is correct
// Ensure config is set before SDK loads
```

#### **Authentication Not Working**

```javascript
// Verify app secret key is correct
// Check app is active in dashboard
// Ensure domain is whitelisted
```

#### **Events Not Appearing**

```javascript
// Check SDK audit endpoint is working
// Verify app has proper permissions
// Check network requests in browser
```

### **Debug Mode**

```javascript
// Enable debug mode for detailed logs
window.YourAuthConfig = {
  appId: "your_secret_key",
  apiUrl: "https://api.yourauth.com",
  debug: true,
};
```

## 📞 **Support**

### **Documentation**

- **Webflow SDK**: `webflow-sdk/README.md`
- **WordPress Plugin**: `wordpress-plugin/README.md`
- **API Reference**: `backend/docs/API.md`

### **Contact**

- **Email**: support@yourauth.com
- **Dashboard**: https://dashboard.yourauth.com
- **Documentation**: https://docs.yourauth.com

## 🔄 **Roadmap**

### **Phase 1: No-Code Platforms** ✅

- ✅ Webflow SDK
- ✅ WordPress Plugin
- 🔄 Bubble Integration
- 🔄 Wix Integration

### **Phase 2: Code Platforms** 🔄

- 🔄 React SDK
- 🔄 Next.js SDK
- 🔄 Vue.js SDK
- 🔄 Angular SDK

### **Phase 3: Advanced Features** 🔄

- 🔄 Real-time WebSocket events
- 🔄 Advanced analytics dashboard
- 🔄 Custom branding options
- 🔄 Multi-language support

---

**Ready to launch your SDK system?** This will give you immediate access to the massive no-code market! 🚀
