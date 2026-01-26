# Adding Authorized Users - Cheat Sheet

To add a new person who can edit the app, update **3 places**:

---

## 1. Local Development (`.env.local`)

Edit the file at the root of the project:

```
NEXT_PUBLIC_ALLOWED_EMAILS=existing@gmail.com,newperson@gmail.com
```

Then restart the dev server.

---

## 2. Vercel (Production)

1. Go to https://vercel.com → **practice-planner** project
2. **Settings** → **Environment Variables**
3. Edit `NEXT_PUBLIC_ALLOWED_EMAILS`
4. Add the new email (comma-separated): `existing@gmail.com,newperson@gmail.com`
5. **Save** → **Deployments** → **Redeploy**

---

## 3. Firebase Firestore Rules

1. Go to https://console.firebase.google.com
2. Select **practice-planner-a5b47**
3. **Firestore Database** → **Rules** tab
4. Find the `allowedEmails` array and add the new email:

```javascript
function isAllowedUser() {
  let allowedEmails = [
    'existing@gmail.com',
    'newperson@gmail.com'   // <-- add here
  ];
  return request.auth.token.email in allowedEmails;
}
```

5. Click **Publish**

---

## Quick Checklist

- [ ] Added to `.env.local`
- [ ] Added to Vercel environment variables + redeployed
- [ ] Added to Firestore rules + published

All three must match for the new user to have access.
