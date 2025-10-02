# How to Access Pro Video Editor - Quick Fix

## ✅ The Issue Was Fixed

**Problem**: Frontend was looking for `user.subscription_tier.name` but the API returns `subscription_tier` as a string directly.

**Fix Applied**: Updated ProVideoEditorPage.tsx to correctly read `user.subscription_tier` as a string.

---

## 🔄 To See the Fix Work:

### **Option 1: Clear Browser Cache & Re-login** (Recommended)

1. **Open Developer Tools** (F12 or Cmd+Option+I)
2. **Go to Application tab** (Chrome) or Storage tab (Firefox)
3. **Clear localStorage**:
   - Find `localStorage` in the left sidebar
   - Right-click → Clear
   - Or manually delete these keys:
     - `access_token`
     - `refresh_token`
     - `user`
4. **Refresh the page** (Cmd+R or Ctrl+R)
5. **Log in again** with your credentials
6. **Navigate to Pro Video Editor**
7. ✅ You should now see the video upload interface!

### **Option 2: Hard Refresh** (Faster)

1. **Hard refresh** your browser:
   - Mac: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + Shift + F5`
2. **Log out** (if you see logout button)
3. **Log in again**
4. **Navigate to Pro Video Editor**

### **Option 3: Incognito/Private Window** (Testing)

1. Open a **new incognito/private window**
2. Go to http://localhost/
3. **Log in** with any of these Pro accounts:
   - testuser@example.com
   - demo@example.com
   - test@example.com
   - zhuchen200245@163.com
   - client@demo.com
4. Click **"Pro Video Editor"** in sidebar
5. ✅ Should work immediately!

---

## 🎯 What You Should See After Re-login:

### **Before Re-login** (Old cached data):
```
Your current plan: free
[Upgrade dialog shown]
```

### **After Re-login** (Fresh Pro data):
```
Pro Video Editor ⭐
[Amber/gold gradient header]
Progress: Upload Video → Add Segments → Process
[Video upload interface]
```

---

## 🔍 How to Verify It's Working:

### **Check in Browser Console:**

1. Open **Developer Tools** (F12)
2. Go to **Console** tab
3. Type this and press Enter:
```javascript
JSON.parse(localStorage.getItem('user'))
```

4. **Look for** `subscription_tier` in the output:
   - ✅ Should show: `"subscription_tier": "pro"`
   - ❌ If shows: `"subscription_tier": "free"` → Need to re-login

### **Check via API:**

1. Open **Developer Tools** (F12)
2. Go to **Network** tab
3. Refresh the page
4. Find the request to `/api/v1/auth/me`
5. Click on it → Go to **Response** tab
6. **Look for**: `"subscription_tier": "pro"`

---

## 🎫 Your Pro Account Credentials:

All these accounts are now **Pro tier**:

| Email | Status |
|-------|--------|
| testuser@example.com | ⭐ Pro |
| demo@example.com | ⭐ Pro |
| test@example.com | ⭐ Pro |
| zhuchen200245@163.com | ⭐ Pro |
| client@demo.com | ⭐ Pro |

---

## 🐛 If Still Not Working:

### **Debug Steps:**

1. **Check database** (verify you're Pro):
```bash
docker exec vti-backend python -c "
from backend.models.database import SessionLocal
from backend.models.user import User

db = SessionLocal()
user = db.query(User).filter(User.email == 'YOUR_EMAIL').first()
print(f'Tier: {user.subscription_tier.name}')
db.close()
"
```

2. **Check API response**:
```bash
# Get a token first by logging in, then:
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/v1/auth/me
```

3. **Clear everything**:
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## 📋 Quick Test Checklist:

- [ ] Logged out and cleared localStorage
- [ ] Logged in with Pro account
- [ ] Navigated to /editor/pro
- [ ] See amber/gold gradient (not white)
- [ ] See "Pro Video Editor ⭐" heading
- [ ] See video upload interface (not upgrade dialog)
- [ ] Browser console shows no errors

---

## ✅ Success Indicators:

When it's working, you'll see:
1. 🌟 **Gold star** icon in page header
2. 🎨 **Amber/orange gradient** background (not white)
3. 📋 **Progress stepper** with 3 steps
4. 📤 **Upload Video** interface
5. ⚙️ **No upgrade dialog**

---

**Last Updated**: 2025-10-01
**Status**: ✅ Fix Deployed - Requires Re-login to Take Effect
