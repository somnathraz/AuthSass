# GraphQL SaaS Backend

A **production-ready, industry-standard** GraphQL API backend for SaaS applications with comprehensive authentication, authorization, and enterprise-level features.

## 🚀 Features

- **Complete Service Layer Architecture** - Modular, testable, and maintainable
- **Advanced Security** - Rate limiting, input validation, audit logging
- **Professional Email System** - Beautiful templates, verification, notifications
- **Health Monitoring** - Comprehensive health checks and metrics
- **Environment Validation** - Ensures proper configuration
- **Error Handling** - Centralized, secure, trackable errors
- **Token Management** - JWT with refresh tokens, automatic cleanup
- **Audit Logging** - Complete action tracking and analytics
- **Organization Management** - Multi-tenant architecture support

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Industry Standards](#industry-standards)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Services Overview](#services-overview)
- [Security Features](#security-features)
- [Monitoring & Health](#monitoring--health)
- [Development](#development)

## 🛠️ Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web server framework
- **Apollo Server** - GraphQL server
- **MongoDB/Mongoose** - Database and ORM
- **JWT** - Authentication with refresh tokens
- **Joi** - Advanced input validation
- **Nodemailer** - Professional email service
- **bcryptjs** - Password hashing
- **zxcvbn** - Password strength validation

## ⭐ Industry Standards

✅ **Service Layer Architecture** - Clean separation of concerns
✅ **Comprehensive Error Handling** - Centralized error management
✅ **Input Validation & Sanitization** - Security-first approach
✅ **Rate Limiting** - DDoS protection and abuse prevention
✅ **Audit Logging** - Complete action tracking
✅ **Health Monitoring** - Application and dependency health checks
✅ **Environment Validation** - Configuration management
✅ **Security Best Practices** - JWT, CORS, input validation
✅ **Professional Email Templates** - Beautiful, responsive emails
✅ **Token Management** - Secure token lifecycle management

## 📁 Folder Structure

```
backend/
├── src/                            # Source code
│   ├── services/                   # 🆕 Business logic services
│   │   ├── auth.service.js         # Authentication service
│   │   ├── user.service.js         # 🆕 User management
│   │   ├── token.service.js        # 🆕 JWT token management
│   │   ├── email.service.js        # 🆕 Email service with templates
│   │   └── organization.service.js # 🆕 Organization management
│   ├── middleware/                 # Express middleware
│   │   ├── authMiddleware.js       # JWT authentication
│   │   ├── rateLimiter.js         # ✅ Enhanced rate limiting
│   │   ├── roleMiddleware.js       # Role-based access control
│   │   ├── errorHandler.js         # 🆕 Centralized error handling
│   │   └── healthCheck.js          # 🆕 Health monitoring
│   ├── utils/                      # Utility functions
│   │   ├── audit.js               # 🆕 Comprehensive audit logging
│   │   ├── validation.js          # 🆕 Advanced input validation
│   │   ├── env.js                 # 🆕 Environment validation
│   │   ├── auth.js                # Auth helpers
│   │   ├── email.js               # Email utilities
│   │   ├── invite.js              # Invitation helpers
│   │   ├── authorization.js       # Authorization helpers
│   │   └── validators.js          # Validation utilities
│   ├── validators/                 # Input validation schemas
│   │   └── auth.validators.js      # Auth validation rules
│   ├── models/                     # Mongoose data models
│   │   ├── User.js                # User model
│   │   ├── Organization.js        # Organization model
│   │   ├── App.js                 # Application model
│   │   ├── OrgMembership.js       # Organization membership
│   │   ├── AppMembership.js       # Application membership
│   │   ├── OrgInvitation.js       # Organization invitations
│   │   ├── Invitation.js          # General invitations
│   │   ├── ApiKey.js              # API keys management
│   │   ├── AuditLog.js            # Audit logging
│   │   ├── RefreshToken.js        # Refresh tokens
│   │   └── EndUsers.js            # End users model
│   └── graphql/                    # GraphQL implementation
│       ├── resolvers/              # Modular resolvers by domain
│       │   └── auth.resolvers.js   # ✅ Enhanced with all services
│       ├── schema/                 # Modular schema definitions
│       ├── resolvers.js            # Combined resolvers
│       └── typeDefs.js             # Combined type definitions
├── index.js                        # Application entry point
├── package.json                    # Dependencies and scripts
├── testMail.js                     # Email testing utility
├── README.md                       # This documentation
└── BACKEND_IMPROVEMENTS.md         # 🆕 Detailed improvements guide
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB instance
- SMTP server for emails

### Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file (see [Environment Variables](#environment-variables))

5. Start the development server:

```bash
npm run dev
```

The GraphQL API will be available at `http://localhost:4000/graphql`

## 🔧 Environment Variables

Create a `.env` file in the backend root:

```env
# Core Configuration
NODE_ENV=development
PORT=4000

# Database
MONGODB_URI=mongodb://localhost:27017/auth-saas

# Security - IMPORTANT: Use strong, unique secrets
JWT_SECRET=your_super_long_jwt_secret_key_minimum_32_characters
JWT_REFRESH_SECRET=your_super_long_refresh_secret_key_minimum_32_characters

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional: Redis for production rate limiting
REDIS_URL=redis://localhost:6379

# Optional: Error tracking
SENTRY_DSN=your_sentry_dsn_url
```

## 🌐 API Endpoints

### GraphQL
- `POST /graphql` - Main GraphQL endpoint
- `GET /graphql` - GraphQL Playground (development only)

### Health Check Endpoints
- `GET /health` - Basic health status
- `GET /health/detailed` - Detailed health with dependencies
- `GET /ready` - Readiness probe (Kubernetes)
- `GET /live` - Liveness probe (Kubernetes)
- `GET /metrics` - Application metrics

## 🏗️ Services Overview

### 1. AuthService (`auth.service.js`)
- User authentication & authorization
- Password hashing and validation
- Social login integration
- Account security (lockout, failed attempts)

### 2. UserService (`user.service.js`) 🆕
- Complete user lifecycle management
- Profile updates and preferences
- Social login integration
- Account security features
- Organization relationships

### 3. TokenService (`token.service.js`) 🆕
- JWT access and refresh token generation
- Token validation and verification
- Automatic token cleanup
- Email verification tokens
- Password reset tokens

### 4. EmailService (`email.service.js`) 🆕
- Professional HTML email templates
- Email verification system
- Password reset emails
- Invitation emails
- Welcome and notification emails

### 5. OrganizationService (`organization.service.js`) 🆕
- Organization CRUD operations
- Member management
- Role-based permissions
- Invitation system
- Search and filtering

## 🔒 Security Features

### Authentication & Authorization
- ✅ JWT with refresh token rotation
- ✅ Password strength validation
- ✅ Account lockout after failed attempts
- ✅ Role-based access control
- ✅ Social login support (Google)

### Rate Limiting
- ✅ Configurable rate limits per operation
- ✅ GraphQL resolver integration
- ✅ IP-based tracking
- ✅ Automatic cleanup

### Input Validation
- ✅ Comprehensive Joi schema validation
- ✅ Input sanitization
- ✅ Custom validators for usernames, passwords
- ✅ XSS and injection prevention

### Audit Logging
- ✅ Complete user action tracking
- ✅ Security event monitoring
- ✅ Metadata collection
- ✅ Searchable and filterable logs

## 📊 Monitoring & Health

### Health Checks
- **Basic Health** (`/health`) - Application status
- **Detailed Health** (`/health/detailed`) - Dependencies status
- **Readiness** (`/ready`) - Ready to serve traffic
- **Liveness** (`/live`) - Application is alive
- **Metrics** (`/metrics`) - Performance metrics

### Monitoring Features
- ✅ Database connectivity monitoring
- ✅ Email service health checks
- ✅ Memory usage tracking
- ✅ Response time monitoring
- ✅ Error rate tracking

## 🧪 Development

### Running Tests
```bash
npm test
```

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Email Testing
```bash
node testMail.js
```

## 🚀 GraphQL Schema Highlights

### Authentication
```graphql
type Mutation {
  login(input: LoginInput!): AuthResponse!
  signup(input: SignupInput!): AuthResponse!
  logout: Response!
  refreshToken(refreshToken: String): TokenResponse!
  socialLogin(input: SocialLoginInput!): AuthResponse!
}

type Query {
  me: User
  validateToken(token: String!): Boolean!
  checkPasswordStrength(password: String!): PasswordStrength!
}
```

### Advanced Features
- Password strength checking
- Social authentication
- Token management
- User preferences
- Organization management
- Audit logging queries

## 📈 Performance Features

- ✅ Connection pooling for database
- ✅ Memory usage monitoring
- ✅ Automatic cleanup routines
- ✅ Optimized queries
- ✅ Caching strategies

## 🔧 Configuration Management

The application includes comprehensive environment validation that ensures:
- All required variables are present
- JWT secrets meet minimum length requirements
- Email configuration is valid
- URLs are properly formatted
- Optional features are properly configured

## 🎯 Production Deployment

This backend is production-ready with:
- ✅ Environment validation
- ✅ Health checks for load balancers
- ✅ Comprehensive error handling
- ✅ Security best practices
- ✅ Monitoring and metrics
- ✅ Audit logging
- ✅ Rate limiting
- ✅ Professional email system

## 📚 Additional Documentation

- [BACKEND_IMPROVEMENTS.md](./BACKEND_IMPROVEMENTS.md) - Detailed improvements guide
- [GraphQL Playground](http://localhost:4000/graphql) - Interactive API explorer (development)

## 🤝 Contributing

1. Follow the established patterns
2. Add comprehensive tests
3. Update documentation
4. Use proper error handling
5. Follow security best practices

---

**This backend now meets industry standards for production SaaS applications with enterprise-level security, monitoring, and scalability features.** 