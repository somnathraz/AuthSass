# Application Actions Implementation Plan

## Overview
This document outlines the step-by-step implementation plan for all application action features in both backend and frontend. The actions are available in the application dropdown menu and need to be fully functional.

## Current Status Analysis

### ✅ Already Working (Implemented)
1. **View Details** - Working ✅
2. **Visit Website** - Working (if URL exists) ✅
3. **View Repository** - Working (if repo URL exists) ✅
4. **Edit Application** - Working ✅
5. **Manage Members** - Working ✅
6. **Manage API Keys** - Partially working ✅
7. **Delete Application** - Working ✅

### 🔧 Needs Implementation/Enhancement
1. **Activate/Deactivate App** - Backend exists, needs testing/enhancement
2. **Archive/Unarchive App** - Backend exists, needs testing/enhancement
3. **Transfer Ownership** - Backend exists, UI missing
4. **Clone Application** - Backend exists, UI missing
5. **Bulk Operations** - Backend exists, UI missing
6. **Regenerate API Keys** - Backend exists, UI enhancement needed

## Implementation Phases

---

## Phase 1: Fix and Enhance Status Management (Priority: HIGH)

### Backend Tasks
**File: `backend/src/graphql/resolvers/app.resolvers.js`**

#### 1.1 Add Missing Status Update Mutation ⚠️
```javascript
// Add updateAppStatus mutation
async updateAppStatus(parent, { id, status }, context) {
  // Implementation needed
}
```

#### 1.2 Enhance Archive/Unarchive Mutations ⚠️
```javascript
// Verify archiveApp and unarchiveApp mutations work correctly
// Add proper status transitions (ACTIVE <-> SUSPENDED)
```

#### 1.3 Add Status Validation ⚠️
```javascript
// Add status transition validation
// ACTIVE -> INACTIVE, SUSPENDED, DELETED
// INACTIVE -> ACTIVE, SUSPENDED, DELETED
// SUSPENDED -> ACTIVE (unarchive)
```

### Frontend Tasks
**Files: `frontend/services/app.service.ts`, `frontend/components/app/AppList.tsx`**

#### 1.4 Test Status Update Hook ⚠️
```typescript
// Verify useUpdateApp works for status changes
// Test error handling and loading states
```

#### 1.5 Test Archive/Unarchive Hooks ⚠️
```typescript
// Verify useArchiveApp and useUnarchiveApp work correctly
// Add proper error handling
```

#### 1.6 Enhance UI Feedback ⚠️
```typescript
// Add loading states for status changes
// Add confirmation dialogs for destructive actions
// Add success/error toasts
```

---

## Phase 2: Implement Transfer Ownership (Priority: MEDIUM)

### Backend Tasks
**File: `backend/src/graphql/resolvers/app.resolvers.js`**

#### 2.1 Enhance Transfer Ownership Mutation ✅ (Exists)
```javascript
// Verify transferAppOwnership mutation
// Add proper validation and permission checks
// Update membership roles correctly
```

### Frontend Tasks
**Files: New components and services**

#### 2.2 Create Transfer Ownership UI 🆕
```typescript
// Create TransferOwnershipModal component
// Add user search/selection
// Add confirmation flow
```

#### 2.3 Add Transfer Action to Dropdown 🆕
```typescript
// Add "Transfer Ownership" to AppActions dropdown
// Only show for owners and system admins
```

#### 2.4 Create Transfer Ownership Hook 🆕
```typescript
// Add useTransferAppOwnership hook to app.service.ts
// Handle success/error states
```

---

## Phase 3: Implement Clone Application (Priority: MEDIUM)

### Backend Tasks
**File: `backend/src/graphql/resolvers/app.resolvers.js`**

#### 3.1 Enhance Clone App Mutation ✅ (Exists)
```javascript
// Verify cloneApp mutation works
// Clone app data, settings, but not members/keys
// Set new name and organization
```

### Frontend Tasks
**Files: New components and services**

#### 3.2 Create Clone Application UI 🆕
```typescript
// Create CloneAppModal component
// Name input and organization selection
// Clone options (what to copy)
```

#### 3.3 Add Clone Action to Dropdown 🆕
```typescript
// Add "Clone Application" to AppActions dropdown
// Only show for members with ADMIN+ permissions
```

#### 3.4 Create Clone Hook 🆕
```typescript
// Verify useCloneApp hook in app.service.ts
// Handle success/error states
```

---

## Phase 4: Implement Bulk Operations (Priority: MEDIUM)

### Backend Tasks
**File: `backend/src/graphql/resolvers/app.resolvers.js`**

#### 4.1 Enhance Bulk Mutations ✅ (Exists)
```javascript
// Verify bulkUpdateAppStatus mutation
// Verify bulkDeleteApps mutation
// Add bulk archive/unarchive
```

### Frontend Tasks
**Files: New components and enhanced AppList**

#### 4.2 Add Multi-Select to AppList 🆕
```typescript
// Add checkboxes to app table
// Add bulk action toolbar
// Select all/none functionality
```

#### 4.3 Create Bulk Actions UI 🆕
```typescript
// Bulk status update modal
// Bulk delete confirmation
// Bulk archive/unarchive
```

#### 4.4 Create Bulk Operation Hooks 🆕
```typescript
// Verify useBulkUpdateAppStatus hook
// Verify useBulkDeleteApps hook
// Add useBulkArchiveApps hook
```

---

## Phase 5: Enhance API Key Management (Priority: LOW)

### Backend Tasks
**File: `backend/src/graphql/resolvers/app.resolvers.js`**

#### 5.1 Enhance API Key Mutations ⚠️
```javascript
// Verify regenerateApiKey mutation
// Add bulk revoke API keys
// Add API key analytics
```

### Frontend Tasks
**Files: `frontend/components/app/ApiKeyManager.tsx`**

#### 5.2 Enhance API Key UI ⚠️
```typescript
// Add regenerate key functionality
// Add key usage analytics
// Add bulk operations
```

#### 5.3 Add API Key Actions to Dropdown ⚠️
```typescript
// Add "Regenerate All Keys" option
// Add "Revoke All Keys" option
```

---

## Phase 6: Add Advanced Features (Priority: LOW)

### Backend Tasks

#### 6.1 Add App Analytics 🆕
```javascript
// Add getAppAnalytics query
// Track API usage, member activity
// Generate usage reports
```

#### 6.2 Add App Backup/Export 🆕
```javascript
// Add exportApp mutation
// Export app configuration and data
// Generate downloadable backup
```

### Frontend Tasks

#### 6.3 Create Analytics Dashboard 🆕
```typescript
// Create AppAnalytics component
// Charts and metrics display
// Export functionality
```

#### 6.4 Add Export Actions 🆕
```typescript
// Add "Export App Data" to dropdown
// Download configuration files
// Backup/restore functionality
```

---

## Implementation Priority Order

### Immediate (This Week)
1. ✅ **Fix Rules of Hooks Issue** - COMPLETED
2. 🔧 **Phase 1: Status Management** - Test and enhance existing status features

### Week 2
3. 🆕 **Phase 2: Transfer Ownership** - Create UI and test functionality

### Week 3
4. 🆕 **Phase 3: Clone Application** - Create UI and test functionality

### Week 4
5. 🆕 **Phase 4: Bulk Operations** - Multi-select and bulk actions

### Future Enhancements
6. 🔧 **Phase 5: API Key Management** - Enhanced features
7. 🆕 **Phase 6: Advanced Features** - Analytics and export

---

## Technical Implementation Details

### Backend Checklist
- [ ] Verify all existing mutations work correctly
- [ ] Add missing validation and error handling
- [ ] Add proper permission checks for all actions
- [ ] Add audit logging for all actions
- [ ] Add rate limiting for destructive operations

### Frontend Checklist
- [ ] Create reusable modal components
- [ ] Add proper loading states and error handling
- [ ] Add confirmation dialogs for destructive actions
- [ ] Add success/error toast notifications
- [ ] Add proper TypeScript types for all operations
- [ ] Add unit tests for all new components

### UI/UX Guidelines
- [ ] Consistent modal designs
- [ ] Clear action confirmations
- [ ] Informative error messages
- [ ] Responsive design for all components
- [ ] Accessibility compliance (ARIA labels, keyboard navigation)

### Testing Strategy
- [ ] Unit tests for all new hooks and components
- [ ] Integration tests for critical user flows
- [ ] E2E tests for complete action workflows
- [ ] Manual testing for edge cases and error conditions

---

## File Structure

### New Files to Create
```
frontend/
├── components/
│   ├── app/
│   │   ├── TransferOwnershipModal.tsx
│   │   ├── CloneAppModal.tsx
│   │   ├── BulkActionsToolbar.tsx
│   │   ├── AppAnalytics.tsx
│   │   └── ExportAppModal.tsx
├── hooks/
│   ├── useBulkSelection.ts
│   └── useAppActions.ts
└── types/
    └── appActions.ts
```

### Files to Modify
```
frontend/
├── services/app.service.ts (enhance existing hooks)
├── components/app/AppList.tsx (add bulk selection)
├── components/app/ApiKeyManager.tsx (enhance features)
└── graphql/app.mutations.ts (add missing mutations)
```

---

## Success Criteria

### Phase 1 Complete When:
- [ ] Status toggle works reliably
- [ ] Archive/Unarchive works correctly
- [ ] Proper loading states and error handling
- [ ] UI feedback for all status changes

### Phase 2 Complete When:
- [ ] Transfer ownership modal works
- [ ] Ownership transfers correctly in backend
- [ ] Proper validation and permission checks
- [ ] UI updates reflect ownership changes

### Phase 3 Complete When:
- [ ] Clone modal allows name and org selection
- [ ] Cloning creates new app with correct data
- [ ] Original app remains unchanged
- [ ] Cloned app has correct ownership and permissions

### Phase 4 Complete When:
- [ ] Multi-select works in app table
- [ ] Bulk actions execute correctly
- [ ] Proper progress feedback for bulk operations
- [ ] Error handling for partial failures

## Next Steps

1. **Start with Phase 1** - Test and enhance existing status management features
2. **Create detailed technical specifications** for each new component
3. **Set up development environment** for testing new features
4. **Begin implementation** with backend mutations first, then frontend UI

---

*Last Updated: [Current Date]*
*Status: Ready for Implementation* 