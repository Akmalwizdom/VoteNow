# Authentication Restrictions - Implementation Guide

## Overview

Authentication restrictions have been implemented to ensure that only logged-in users can:
- ✅ View the list of active polls
- ✅ Create new polls
- ✅ Edit their own polls
- ✅ Delete their own polls

**Public access** (no login required) is still allowed for:
- ✅ Viewing individual polls via shared links
- ✅ Voting on polls (anonymous voting)
- ✅ Seeing real-time poll results

## Changes Made

### 1. Backend Route Protection

#### File: `backend/server.js`

**Protected Routes (Require Authentication):**
```javascript
// Protected routes - require authentication
app.post('/api/polls', verifyToken, createPoll);        // Create poll
app.get('/api/polls', verifyToken, getPolls);           // List all polls ⭐ NEW
app.get('/api/polls/:id/share', verifyToken, getShareLink); // Get share link
app.put('/api/polls/:id', verifyToken, updatePoll);     // Edit poll
app.delete('/api/polls/:id', verifyToken, deletePoll);  // Delete poll
```

**Public Routes (No Authentication Required):**
```javascript
// Public routes - allow anonymous access (for shared links)
app.get('/api/polls/:id', getPollById);                 // View single poll
app.post('/api/polls/:id/vote', optionalAuth, voteOnPoll); // Vote on poll
```

**Key Change:** The `/api/polls` endpoint now requires authentication via the `verifyToken` middleware.

### 2. Frontend Route Protection

#### File: `src/components/ProtectedRoute.tsx` (NEW)

Created a reusable `ProtectedRoute` component that:
- Checks if user is authenticated
- Shows loading spinner while checking authentication
- Redirects to `/login` if not authenticated
- Renders the protected content if authenticated

```typescript
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

#### File: `src/App.tsx`

**Protected Routes:**
```typescript
<Route
  path="/"
  element={
    <ProtectedRoute>
      <Home />
    </ProtectedRoute>
  }
/>
<Route
  path="/create"
  element={
    <ProtectedRoute>
      <CreatePoll />
    </ProtectedRoute>
  }
/>
<Route
  path="/poll/:id/edit"
  element={
    <ProtectedRoute>
      <EditPoll />
    </ProtectedRoute>
  }
/>
```

**Public Routes:**
```typescript
<Route path="/login" element={<Login />} />
<Route path="/signup" element={<Signup />} />
<Route path="/poll/:id" element={<PollDetail />} />
```

### 3. API Request Authentication

#### File: `src/pages/Home.tsx`

Updated `fetchPolls()` to include authentication token:

```typescript
const fetchPolls = async () => {
  try {
    // Get authentication token
    const token = await auth.currentUser?.getIdToken();
    
    if (!token) {
      toast.error('Authentication required to view polls');
      return;
    }

    const response = await fetch(getApiUrl('api/polls'), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        toast.error('Please log in to view polls');
      }
      return;
    }

    const result = await response.json();
    setPolls(result.data || []);
  } catch (error) {
    toast.error('Failed to load polls');
  }
};
```

## User Flow

### For Unauthenticated Users

```
1. User opens: http://localhost:5000 or ngrok URL
   ↓
2. ProtectedRoute checks: user = null
   ↓
3. Redirect to: /login
   ↓
4. User sees login page
```

**Options:**
- Log in with existing account
- Click "Sign up" to create new account

### For Authenticated Users

```
1. User logs in successfully
   ↓
2. Redirect to: / (Home page)
   ↓
3. Home page fetches polls with auth token
   ↓
4. User sees list of active polls
   ↓
5. User can:
   - View poll details
   - Create new polls
   - Edit their own polls
   - Delete their own polls
   - Share polls via ngrok link
```

### For Shared Poll Links (Anonymous Access)

```
1. User opens shared link: https://ngrok-url/poll/abc123
   ↓
2. /poll/:id route is PUBLIC
   ↓
3. Poll loads without authentication
   ↓
4. User can:
   ✅ View poll details
   ✅ Vote on poll (anonymous)
   ✅ See real-time results
   ❌ Cannot see list of all polls
   ❌ Cannot create/edit/delete polls
```

## Testing Guide

### Test 1: Unauthenticated Access

**Step 1:** Open app in incognito/private mode
```
http://localhost:5000
```

**Expected Result:**
- ✅ Redirected to `/login`
- ✅ Cannot access home page without login

**Step 2:** Try to access home directly
```
http://localhost:5000/
```

**Expected Result:**
- ✅ Redirected to `/login`

**Step 3:** Try to access create poll page
```
http://localhost:5000/create
```

**Expected Result:**
- ✅ Redirected to `/login`

### Test 2: Authentication Flow

**Step 1:** Click "Sign up"
- Fill in email and password
- Click "Sign Up"

**Expected Result:**
- ✅ Account created
- ✅ Automatically logged in
- ✅ Redirected to home page
- ✅ See list of polls

**Step 2:** Log out
- Click user menu → Logout

**Expected Result:**
- ✅ Logged out
- ✅ Redirected to `/login`

**Step 3:** Log in again
- Enter credentials
- Click "Login"

**Expected Result:**
- ✅ Logged in successfully
- ✅ Redirected to home page
- ✅ Can see polls

### Test 3: Poll Management (Authenticated)

**Step 1:** Create a poll
- Click "Create Poll"
- Fill in details
- Submit

**Expected Result:**
- ✅ Poll created successfully
- ✅ Redirected to poll detail page
- ✅ See Share/Edit/Delete buttons (you're the creator)

**Step 2:** View poll list
- Navigate to home page

**Expected Result:**
- ✅ See your newly created poll
- ✅ See Share/Edit/Delete buttons on your polls
- ✅ Don't see buttons on polls created by others

### Test 4: Shared Links (Anonymous)

**Step 1:** As logged-in user, create poll
- Create a poll
- Click "Share" button
- Copy ngrok link

**Step 2:** Open link in incognito/private mode
```
https://beamiest-karsyn-divisibly.ngrok-free.dev/poll/abc123
```

**Expected Result:**
- ✅ Poll loads without login
- ✅ Can view poll details
- ✅ Can vote on poll
- ✅ See real-time results
- ❌ No Share/Edit/Delete buttons
- ❌ Cannot navigate to home page without login

**Step 3:** Try to access home from shared link
- Modify URL to: `https://ngrok-url/`

**Expected Result:**
- ✅ Redirected to `/login`

### Test 5: API Endpoint Protection

**Test with curl or Postman:**

**Without Authentication:**
```bash
curl http://localhost:5000/api/polls
```

**Expected Result:**
```json
{
  "error": "Unauthorized: No token provided"
}
```
**Status Code:** 401

**With Valid Token:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/polls
```

**Expected Result:**
```json
{
  "page": 1,
  "limit": 10,
  "total": 5,
  "data": [...]
}
```
**Status Code:** 200

**Public Endpoint (No Token Required):**
```bash
curl http://localhost:5000/api/polls/abc123
```

**Expected Result:**
```json
{
  "_id": "abc123",
  "title": "Poll Title",
  "options": [...]
}
```
**Status Code:** 200

## Security Considerations

### What's Protected:
1. ✅ **Poll List** - Only authenticated users can see all polls
2. ✅ **Poll Creation** - Requires login
3. ✅ **Poll Editing** - Only creator can edit
4. ✅ **Poll Deletion** - Only creator can delete
5. ✅ **Share Link Generation** - Only creator can generate share links

### What's Public:
1. ✅ **Individual Polls** - Accessible via direct link/share link
2. ✅ **Voting** - Anonymous users can vote (tracked by voterId)
3. ✅ **Real-Time Updates** - Socket.IO works for everyone

### Authentication Token Flow:
```
1. User logs in
   ↓
2. Firebase generates JWT token
   ↓
3. Frontend stores token (Firebase handles this)
   ↓
4. Frontend includes token in API requests:
   Authorization: Bearer <token>
   ↓
5. Backend verifies token with Firebase Admin SDK
   ↓
6. If valid: Request proceeds
   If invalid: 401/403 error
```

### Token Verification (Backend):
```javascript
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split('Bearer ')[1];
  const decodedToken = await admin.auth().verifyIdToken(token);
  
  req.user = {
    uid: decodedToken.uid,
    email: decodedToken.email,
  };
  
  next();
};
```

## Troubleshooting

### Issue: Infinite redirect loop

**Symptoms:**
- Page keeps redirecting between `/` and `/login`

**Solution:**
1. Clear browser cache and cookies
2. Check if Firebase is initialized correctly
3. Verify `.env` has correct Firebase credentials
4. Check browser console for errors

### Issue: "Unauthorized" error when logged in

**Symptoms:**
- User is logged in but API calls return 401

**Solution:**
1. Check if Firebase token is being sent:
   - Open DevTools → Network tab
   - Check API requests
   - Verify `Authorization: Bearer ...` header exists
2. Verify backend Firebase Admin SDK is configured correctly
3. Check `backend/.env` has correct Firebase admin credentials

### Issue: Can't access polls after login

**Symptoms:**
- Login successful but no polls load

**Solution:**
1. Check browser console for errors
2. Verify backend is running: `cd backend && npm start`
3. Check backend logs for token verification errors
4. Rebuild frontend: `npm run build`
5. Restart backend

### Issue: Shared links don't work

**Symptoms:**
- Shared poll links redirect to login

**Solution:**
1. Verify `/poll/:id` route is NOT wrapped in `ProtectedRoute` in `App.tsx`
2. Check `backend/server.js` - `app.get('/api/polls/:id', getPollById)` should NOT have `verifyToken` middleware
3. Rebuild and restart

## Architecture Summary

### Frontend Protection Layers:
1. **Route Level** - `ProtectedRoute` component
2. **API Level** - Include auth token in requests
3. **UI Level** - Conditional rendering based on `user` state

### Backend Protection Layers:
1. **Middleware Level** - `verifyToken` middleware
2. **Controller Level** - Check ownership (e.g., only creator can edit)
3. **Database Level** - Store `createdBy` field with polls

### Complete Flow:
```
User Action
    ↓
Frontend Route Check (ProtectedRoute)
    ↓
    If not authenticated → Redirect to /login
    If authenticated → Render page
    ↓
API Request (with token)
    ↓
Backend Middleware (verifyToken)
    ↓
    If token invalid → 401 error
    If token valid → Continue
    ↓
Controller Logic (ownership check if needed)
    ↓
Database Operation
    ↓
Response to Frontend
```

---

## Summary

✅ **Implemented:**
- Poll list requires authentication
- Poll creation requires authentication
- Poll editing requires authentication & ownership
- Poll deletion requires authentication & ownership
- Shared links work for anonymous users
- Anonymous voting still works
- Real-time updates work for everyone

✅ **User Experience:**
- Clear authentication flow
- Smooth redirects
- Helpful error messages
- Shared links remain public

✅ **Security:**
- Backend validates all tokens
- Ownership checks for edit/delete
- Public endpoints are intentionally public
- No sensitive data exposed

The app now has proper authentication restrictions while maintaining a good user experience for both authenticated and anonymous users!
