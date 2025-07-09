# 🧪 Profile System Testing Guide

## ✅ Backend Status
✅ **GraphQL Schema**: All profile mutations correctly defined  
✅ **Resolvers**: Complete implementation for all profile operations  
✅ **Database Model**: User model updated with bio, location, website fields  
✅ **Server Running**: Backend started successfully on port 4000  

## 🚀 Quick Start Testing

### 1. **Start Frontend Server**
```bash
cd frontend
npm run dev
```
*Frontend will run on http://localhost:3000*

### 2. **Access Profile Management**
Navigate to: `http://localhost:3000/profile`

### 3. **Test Avatar System**
- ✅ **Default "SK" Avatar**: Should show "Somnath Khadfga" → "SK" avatar
- ✅ **Avatar Generator**: Click camera icon to access 6 avatar styles
- ✅ **Style Selection**: Test Avataaars, Initials, Pixel Art, Robots, Personas, Fun Emoji
- ✅ **Custom Generation**: Type any text to generate unique avatars

### 4. **Test Profile Editing**
- ✅ **Form Fields**: firstName, lastName, bio, location, website
- ✅ **Real-time Saving**: Changes should persist after page reload
- ✅ **Validation**: Test empty/invalid inputs
- ✅ **Loading States**: Verify saving indicators

### 5. **Test Account Settings** 
Navigate to: `http://localhost:3000/settings`

- ✅ **Password Change**: Test with current password verification
- ✅ **Email Update**: Test with password confirmation
- ✅ **Data Export**: Download JSON file with user data
- ✅ **Account Deletion**: Test type-to-confirm system (⚠️ BE CAREFUL!)

## 🔍 GraphQL Testing

### **Test Mutations in GraphQL Playground**
Visit: `http://localhost:4000/graphql`

#### **Update Profile**
```graphql
mutation UpdateProfile {
  updateProfile(
    firstName: "Somnath"
    lastName: "Khadfga"
    bio: "Full-stack developer passionate about building great user experiences"
    location: "San Francisco, CA"
    website: "https://somnath.dev"
  ) {
    id
    firstName
    lastName
    bio
    location
    website
    profileImage
  }
}
```

#### **Update Avatar** 
```graphql
mutation UpdateAvatar {
  updateAvatar(
    avatar: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+..."
  ) {
    id
    profileImage
  }
}
```

#### **Export User Data**
```graphql
mutation ExportData {
  exportUserData
}
```

## 🎯 Expected Results

### **Profile Page Features**
- [x] Beautiful avatar generation with DiceBear
- [x] "SK" default avatar for "Somnath Khadfga"
- [x] Real-time profile editing
- [x] Form validation and error handling
- [x] Professional UI matching GitHub/Vercel standards

### **Settings Page Features**
- [x] Secure password change with current password verification
- [x] Email update with uniqueness validation  
- [x] Account deletion with username confirmation
- [x] GDPR-compliant data export
- [x] Notification preference management

### **Backend API Features**
- [x] Rate limiting on all operations
- [x] Audit logging for security events
- [x] bcrypt password hashing
- [x] JWT token management
- [x] Input validation and sanitization

## 🔐 Security Verification

### **Rate Limiting Test**
Try making multiple rapid requests to verify rate limits:
- Profile updates: 10/hour
- Password changes: 5/hour
- Email changes: 3/hour
- Account deletion: 3/day
- Data export: 1/day

### **Authentication Test**
- Try accessing `/profile` and `/settings` without authentication
- Should redirect to login page
- Verify JWT token validation

### **Input Validation Test**
- Test with invalid email formats
- Test with weak passwords
- Test with XSS attempts in bio/location fields
- Verify proper sanitization

## 🎨 UI/UX Verification

### **Responsive Design**
- Test on mobile (375px width)
- Test on tablet (768px width)  
- Test on desktop (1200px+ width)

### **Accessibility**
- Test keyboard navigation
- Verify ARIA labels
- Test with screen reader
- Check color contrast ratios

### **Loading States**
- Profile save loading indicator
- Avatar upload progress
- Settings update feedback
- Error state handling

## 📊 Database Verification

### **Check User Model Fields**
```javascript
// MongoDB query to verify user data structure
db.users.findOne({}, {
  firstName: 1,
  lastName: 1,
  bio: 1,
  location: 1,
  website: 1,
  profileImage: 1,
  preferences: 1
})
```

### **Verify Audit Logs**
```javascript
// Check that profile changes are logged
db.auditlogs.find({ action: "PROFILE_UPDATED" }).sort({ timestamp: -1 }).limit(5)
```

## 🐛 Troubleshooting

### **Common Issues**
1. **GraphQL Schema Mismatch**: Ensure all mutations are defined in user.schema.js
2. **CORS Issues**: Check backend CORS configuration
3. **Authentication Errors**: Verify JWT token in browser cookies
4. **Rate Limiting**: Wait for rate limit reset or use different user
5. **Database Connection**: Check MongoDB connection status

### **Debug Commands**
```bash
# Check backend logs
cd backend && npm run dev

# Check frontend logs  
cd frontend && npm run dev

# Test GraphQL directly
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ me { id username email } }"}'
```

## 🎉 Success Criteria

✅ **All profile operations work correctly**  
✅ **Avatar system generates "SK" avatars by default**  
✅ **Real-time updates persist across page reloads**  
✅ **Security features work as expected**  
✅ **Professional UI/UX throughout**  
✅ **Backend integration functions properly**  
✅ **No errors in browser console**  
✅ **Mobile responsiveness verified**  

**When all tests pass, the profile management system is production-ready!** 🚀 