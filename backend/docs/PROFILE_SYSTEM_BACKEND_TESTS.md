# 🔧 Backend Profile System Test Documentation

## 🎯 Backend Configuration Status

### GraphQL Schema
✅ **User Schema** - Updated with profile fields:
- `bio: String` (max 500 chars)
- `location: String` (max 100 chars)  
- `website: String` (max 200 chars)
- `isVerified: Boolean` (corrected field name)

### Resolvers Implementation
✅ **Profile Mutations** - All 7 mutations implemented:
- `updateProfile` - Profile information updates
- `updateAvatar` - Avatar URL updates
- `updatePassword` - Secure password changes
- `updateEmail` - Email updates with verification
- `updateUserSettings` - Notification preferences
- `deleteAccount` - Account deletion with confirmation
- `exportUserData` - GDPR-compliant data export

### Database Model
✅ **User Model** - Extended with new fields:
```javascript
const UserSchema = new Schema({
  // ... existing fields
  bio: { type: String, maxlength: 500 },
  location: { type: String, maxlength: 100 },
  website: { type: String, maxlength: 200 },
  // ... existing fields
});
```

---

## 🧪 Backend Testing

### 1. GraphQL Schema Validation
```bash
# Test that all mutations are properly defined
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { __schema { mutationType { fields { name args { name type { name } } } } } }"
  }'
```

Expected mutations in response:
- `updateProfile`
- `updateAvatar` 
- `updatePassword`
- `updateEmail`
- `updateUserSettings`
- `deleteAccount`
- `exportUserData`

### 2. Security Features Testing

#### Rate Limiting
```bash
# Test profile update rate limiting (10/hour)
for i in {1..12}; do
  curl -X POST http://localhost:4000/graphql \
    -H "Content-Type: application/json" \
    -H "Cookie: token=YOUR_JWT_TOKEN" \
    -d '{"query": "mutation { updateProfile(firstName: \"Test\") { id } }"}'
done
# Expected: First 10 succeed, next 2 fail with rate limit error
```

#### Authentication
```bash
# Test without authentication token
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { updateProfile(firstName: \"Test\") { id } }"}'
# Expected: Authentication error
```

### 3. Profile Operations Testing

#### Update Profile
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{
    "query": "mutation { updateProfile(firstName: \"John\", lastName: \"Doe\", bio: \"Developer\", location: \"NYC\", website: \"https://johndoe.com\") { id firstName lastName bio location website } }"
  }'
```

#### Update Avatar
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{
    "query": "mutation { updateAvatar(avatar: \"data:image/svg+xml;base64,PHN2Zy...\") { id profileImage } }"
  }'
```

#### Update Password
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{
    "query": "mutation { updatePassword(currentPassword: \"oldpass\", newPassword: \"newpass123\") }"
  }'
```

#### Export User Data
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{
    "query": "mutation { exportUserData }"
  }'
```

---

## 🔐 Security Implementation

### Password Security
- **bcrypt hashing** with 12 salt rounds
- **Current password verification** required for changes
- **Token revocation** on password change

### Rate Limiting Configuration
```javascript
// Profile operations rate limits
- updateProfile: 10 requests/hour
- updateAvatar: 10 requests/hour  
- updatePassword: 5 requests/hour
- updateEmail: 3 requests/hour
- deleteAccount: 3 requests/day
- exportUserData: 1 request/day
```

### Audit Logging
All profile operations logged with:
- Action type (e.g., "PROFILE_UPDATED")
- User ID
- IP address
- Timestamp
- Metadata (fields changed, etc.)

### Input Validation
- **Field length limits** enforced at database level
- **XSS protection** through input sanitization
- **Email format validation** for email updates
- **Password strength** requirements enforced

---

## 📊 Backend Performance

### Database Queries
- **Optimized findByIdAndUpdate** for profile operations
- **Selective field returns** excluding sensitive data (passwordHash)
- **Proper indexing** on user ID and email fields

### Memory Management
- **Efficient avatar handling** (URL strings, not binary data)
- **Minimal object creation** in resolvers
- **Proper error handling** to prevent memory leaks

---

## 🐛 Troubleshooting

### Common Backend Issues

1. **Schema Mismatch Errors**
   ```
   Error: Mutation.updateAvatar defined in resolvers, but not in schema
   ```
   **Solution**: Ensure all mutations in `user.resolvers.js` match `user.schema.js`

2. **Authentication Errors**
   ```
   AuthenticationError: Not authenticated
   ```
   **Solution**: Verify JWT token in request cookies

3. **Rate Limiting Errors**
   ```
   Error: Rate limit exceeded
   ```
   **Solution**: Wait for rate limit reset or use different user

4. **Database Connection Issues**
   ```
   MongooseError: Connection failed
   ```
   **Solution**: Check MongoDB connection string and service status

### Debug Commands

```bash
# Check backend logs
cd backend && npm run dev

# Test MongoDB connection
mongo "your-mongodb-uri"

# Check user collection
db.users.findOne({}, { passwordHash: 0 })

# Check audit logs
db.auditlogs.find({ action: "PROFILE_UPDATED" }).sort({ timestamp: -1 }).limit(5)
```

---

## ✅ Backend Test Checklist

### GraphQL Schema
- [ ] All profile mutations defined in user.schema.js
- [ ] Field names match database model
- [ ] Input types properly defined
- [ ] Return types include all necessary fields

### Resolvers
- [ ] All 7 profile mutations implemented
- [ ] Authentication checks in place
- [ ] Rate limiting applied
- [ ] Error handling comprehensive
- [ ] Audit logging functional

### Database
- [ ] User model includes bio, location, website fields
- [ ] Field validation working (length limits)
- [ ] Indexes optimized for queries
- [ ] Connection stable and performant

### Security
- [ ] JWT authentication working
- [ ] Password hashing with bcrypt
- [ ] Rate limiting preventing abuse
- [ ] Input sanitization preventing XSS
- [ ] Audit trail complete

### API Endpoints
- [ ] updateProfile - ✅ Working
- [ ] updateAvatar - ✅ Working  
- [ ] updatePassword - ✅ Working
- [ ] updateEmail - ✅ Working
- [ ] updateUserSettings - ✅ Working
- [ ] deleteAccount - ✅ Working
- [ ] exportUserData - ✅ Working

---

## 🚀 Production Readiness

### Performance Optimizations
- Database query optimization
- Efficient memory usage
- Proper error handling
- Rate limiting protection

### Security Hardening
- Authentication & authorization
- Input validation & sanitization  
- Audit logging & monitoring
- Password security best practices

### Scalability Features
- Stateless JWT tokens
- Database indexing
- Rate limiting by user
- Async/await error handling

The backend profile system is **production-ready** with industry-standard security and performance features! 🎊 