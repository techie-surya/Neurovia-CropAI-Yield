# User CRUD Operations - API Reference

## Overview
Complete CRUD (Create, Read, Update, Delete) operations for user management with JWT authentication.

---

## 1. CREATE - Register New User

**Endpoint:** `POST /api/auth/register`

**Authentication:** None (public)

**Request Body:**
```json
{
  "name": "John Farmer",
  "email": "john@example.com",
  "aadhar": "123456789012",
  "password": "securePassword123"
}
```

**Response (201 Created):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "65a123abc123def456789012",
    "name": "John Farmer",
    "email": "john@example.com",
    "aadhar": "123456789012",
    "created_at": "2026-01-13T10:30:00Z"
  },
  "access_token": "eyJhbGc..."
}
```

**Frontend Usage:**
```typescript
import { authAPI } from './utils/api';

await authAPI.register({
  name: 'John Farmer',
  email: 'john@example.com',
  aadhar: '123456789012',
  password: 'securePassword123'
});
```

---

## 2. READ - Get User Profile

**Endpoint:** `GET /api/auth/profile`

**Authentication:** JWT Token (Required)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "65a123abc123def456789012",
  "name": "John Farmer",
  "email": "john@example.com",
  "aadhar": "123456789012",
  "created_at": "2026-01-13T10:30:00Z"
}
```

**Frontend Usage:**
```typescript
const profile = await authAPI.getProfile();
console.log(profile.name);
```

---

## 3. UPDATE - Update User Profile

**Endpoint:** `PUT /api/auth/update-profile`

**Authentication:** JWT Token (Required)

**Request Body:**
```json
{
  "name": "John Updated Farmer",
  "email": "newemail@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "65a123abc123def456789012",
    "name": "John Updated Farmer",
    "email": "newemail@example.com",
    "aadhar": "123456789012",
    "created_at": "2026-01-13T10:30:00Z"
  }
}
```

**Frontend Usage:**
```typescript
await authAPI.updateProfile({
  name: 'John Updated Farmer',
  email: 'newemail@example.com'
});
```

---

## 4. UPDATE - Change Password

**Endpoint:** `PUT /api/auth/change-password`

**Authentication:** JWT Token (Required)

**Request Body:**
```json
{
  "old_password": "currentPassword123",
  "new_password": "newPassword456"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

**Frontend Usage:**
```typescript
await authAPI.changePassword({
  old_password: 'currentPassword123',
  new_password: 'newPassword456'
});
```

---

## 5. DELETE - Delete User Account

**Endpoint:** `DELETE /api/auth/delete-account`

**Authentication:** JWT Token (Required)

**Request Body:** None

**Response (200 OK):**
```json
{
  "message": "Account deleted successfully"
}
```

**Side Effects:**
- User document deleted from database
- All prediction history deleted
- JWT token invalidated

**Frontend Usage:**
```typescript
await authAPI.deleteAccount();
// Clear token and redirect to home
localStorage.removeItem('authToken');
localStorage.removeItem('currentUser');
```

---

## 6. LOGIN - Authenticate User

**Endpoint:** `POST /api/auth/login`

**Authentication:** None (public)

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "65a123abc123def456789012",
    "name": "John Farmer",
    "email": "john@example.com",
    "aadhar": "123456789012",
    "created_at": "2026-01-13T10:30:00Z"
  },
  "access_token": "eyJhbGc..."
}
```

**Frontend Usage:**
```typescript
const response = await authAPI.login({
  email: 'john@example.com',
  password: 'securePassword123'
});

// Token is automatically saved to localStorage
localStorage.setItem('currentUser', JSON.stringify(response.user));
```

---

## 7. LOGOUT - Clear Session

**Endpoint:** `POST /api/auth/logout`

**Authentication:** None (frontend-only operation)

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Frontend Usage:**
```typescript
await authAPI.logout();
localStorage.removeItem('authToken');
localStorage.removeItem('currentUser');
// UI automatically updates to show Login button
```

---

## Frontend Login State Management

The frontend automatically:
1. **On Login:**
   - Saves JWT token to `localStorage.authToken`
   - Saves user data to `localStorage.currentUser`
   - Shows "Welcome, [Name]" and Logout button

2. **On Logout:**
   - Clears both tokens from localStorage
   - Shows "Login" button

3. **On Page Refresh:**
   - Checks `localStorage.authToken` to restore session
   - Displays appropriate UI based on auth state

---

## Error Responses

**Email Already Registered (400):**
```json
{
  "error": "Email already registered"
}
```

**Invalid Credentials (401):**
```json
{
  "error": "Invalid email or password"
}
```

**User Not Found (404):**
```json
{
  "error": "User not found"
}
```

**Server Error (500):**
```json
{
  "error": "Internal server error"
}
```

---

## Database Storage

**Users Collection:**
```javascript
{
  "_id": ObjectId,
  "name": "John Farmer",
  "email": "john@example.com",
  "aadhar": "123456789012",
  "password_hash": "$2b$12$...",
  "created_at": ISODate
}
```

**Data Stored Safely:**
- Password is hashed with bcrypt (never stored in plain text)
- JWT tokens are managed client-side
- User ID is used for all prediction associations

---

## Security Features

✅ Passwords hashed with bcrypt  
✅ JWT token-based authentication  
✅ Email and Aadhar uniqueness enforced  
✅ CORS enabled for frontend requests  
✅ Protected endpoints require valid JWT  
✅ User can only access their own data  

---

## Testing with cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "aadhar": "123456789012",
    "password": "testPass123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testPass123"
  }'
```

**Get Profile (with token):**
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <token>"
```

**Update Profile:**
```bash
curl -X PUT http://localhost:5000/api/auth/update-profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name"
  }'
```

**Delete Account:**
```bash
curl -X DELETE http://localhost:5000/api/auth/delete-account \
  -H "Authorization: Bearer <token>"
```
