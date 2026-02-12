

## Problem

The password reset fails because of a **method mismatch** between the frontend and backend:

- The **frontend hook** (`useAdminUsers.tsx`) sends the reset request as a **POST** with `{ userId, action: 'resetPassword', newPassword }` in the body.
- The **edge function** only checks for the `resetPassword` action inside the **PUT** handler block. The POST handler ignores the action field entirely and tries to create a new user instead.

This is confirmed by the edge function logs showing `"Creating user: undefined with role: user"` whenever a password reset is attempted.

## Solution

Move the `resetPassword` action check into the **POST** handler so it intercepts the request **before** the user-creation logic runs. This way the frontend code (which already sends POST) works correctly without any changes needed on the UI side.

## Changes

### 1. Edge Function: `supabase/functions/admin-users/index.ts`

Inside the `method === 'POST'` block (around line 430), add a check at the top for the `resetPassword` action:

- Parse the request body
- If `body.action === 'resetPassword'`, handle it immediately (validate userId, validate password, call `supabase.auth.admin.updateUserById`)
- Otherwise, continue with the existing user-creation flow

Remove the duplicate `resetPassword` block from inside the `PUT` handler since it will no longer be reached.

### 2. Redeploy

Deploy the updated `admin-users` edge function.

No frontend or UI changes are needed -- the hook already sends the correct payload.

