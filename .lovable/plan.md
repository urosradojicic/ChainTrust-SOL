

## Plan: Fix Login — Update Test Credentials Display

### Problem
The database has accounts registered under `@chainmetrics.io` (admin@chainmetrics.io, investor@chainmetrics.io, startup@chainmetrics.io), but the Login page displays `@chaintrust.io` credentials. The passwords may also have been changed or differ.

### Solution
Update the `TEST_CREDENTIALS` array in `src/pages/Login.tsx` to match the actual database accounts:

**`src/pages/Login.tsx`** (line ~18-22)
- Change `admin@chaintrust.io` → `admin@chainmetrics.io`
- Change `investor@chaintrust.io` → `investor@chainmetrics.io`  
- Change `startup@chaintrust.io` → `startup@chainmetrics.io`
- Keep passwords as-is (admin123, investor1, startup1) — if these still don't work, we may need to reset passwords via a migration

Also add the newer test accounts (korisnik1@gmail.com, sava123@gmail.com, etc.) as additional options, or just fix the domain mismatch.

### Result
Clicking "Fill" on test credentials will use the correct emails that actually exist in the database, and login will work again.

