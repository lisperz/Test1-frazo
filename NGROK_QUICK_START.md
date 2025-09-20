# 🚀 NGROK QUICK START - GET PUBLIC URL IMMEDIATELY!

**Your boss/client needs the link NOW? Here's how to get it in 2 minutes:**

## 1️⃣ INSTANT SETUP (First Time Only)

```bash
# Install and configure ngrok
./scripts/setup-ngrok.sh
```

**If prompted for authtoken:**
1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken
2. Copy your token
3. Run: `ngrok config add-authtoken YOUR_TOKEN_HERE`

## 2️⃣ START PUBLIC TUNNEL

```bash
# This will start your service AND create public URL
./scripts/start-ngrok.sh
```

**🎉 DONE! You'll get a URL like: `https://abc123.ngrok.io`**

## 3️⃣ SHARE WITH BOSS/CLIENT

The URL is automatically copied to your clipboard. Just paste it!

---

## 🔄 CONTINUE DEVELOPMENT WHILE LIVE

### Make Code Changes:
```bash
# 1. Edit your code as usual
# 2. Quick redeploy (keeps same URL):
./scripts/dev-deploy.sh
```

### Get URL Anytime:
```bash
./scripts/get-ngrok-url.sh
```

### View Logs:
```bash
./scripts/logs.sh
```

### Stop Public Access:
```bash
./scripts/stop-ngrok.sh
```

---

## ⚡ EMERGENCY COMMANDS

**Service crashed?**
```bash
./scripts/start.sh && ./scripts/start-ngrok.sh
```

**Need new URL?**
```bash
./scripts/restart-ngrok.sh
```

**Check everything:**
```bash
curl http://localhost:80/health  # Local check
curl $(cat /tmp/ngrok_url.txt)/health  # Public check
```

---

## 💡 PRO TIPS

- **URL stays same** as long as ngrok runs
- **Free ngrok** = random URL each restart
- **Paid ngrok** = custom subdomain (upgrade if needed)
- **Monitor**: Visit http://localhost:4040 for ngrok dashboard

**Your service is production-ready for demos!** 🎯