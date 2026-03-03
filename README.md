# InvoicePro v4 — PWA + Gumroad License + Privacy

## 🚀 Quick Setup (15 minutes)

### Step 1: Configure your Gumroad URL
1. Open `invoHub.js`
2. Find line: `const GUMROAD_URL = 'https://YOUR-STORE.gumroad.com/l/invoHub';`
3. Replace with your actual Gumroad product URL
4. Also update the `<a href="...">` in `index.html` inside the license gate section

### Step 2: Enable Gumroad License Keys
1. Log into Gumroad → your product → Edit
2. Scroll to "License keys" → toggle ON "Generate unique license keys"
3. Go to your product settings → copy your **Product ID** (from the URL or product dashboard)

### Step 3: Deploy to Netlify
1. Push this folder to a GitHub repo
2. Go to netlify.com → "Add new site" → Import from GitHub
3. Build settings: leave blank (static site)
4. Click Deploy

### Step 4: Set Environment Variable
In Netlify → Site Settings → Environment Variables → Add:
```
GUMROAD_PRODUCT_ID = your_product_id_here
```
Then redeploy.

### Step 5: Update License Validate URL (if using Vercel)
If you deploy to **Vercel** instead of Netlify:
- Move `netlify/functions/validate-license.js` → `api/validate-license.js`
- In `invoHub.js`, change: `const LICENSE_VALIDATE_URL = '/api/validate-license';`
- Set `GUMROAD_PRODUCT_ID` in Vercel → Settings → Environment Variables

---

## 📁 File Structure

```
invoHub-v4/
├── index.html                          ← Main app + license gate
├── invoHub.css                      ← All styles
├── invoHub.js                       ← All app logic + license system
├── sw.js                               ← Service worker (offline PWA)
├── manifest.json                       ← PWA manifest
├── netlify.toml                        ← Netlify config + headers
├── netlify/
│   └── functions/
│       └── validate-license.js         ← Gumroad API proxy (serverless)
├── icons/
│   ├── icon-192.png                    ← (copy from original)
│   ├── icon-512.png
│   ├── icon-192-maskable.png
│   ├── icon-512-maskable.png
│   ├── apple-touch-icon.png
│   └── favicon.ico
└── README.md
```

---

## 🔐 How the License System Works

1. **Customer buys** on Gumroad → Gumroad automatically emails them a license key
2. **Customer opens** your app URL → sees the license gate screen
3. **Customer enters** their license key → your Netlify function calls Gumroad's API
4. **Gumroad confirms** the key is valid (not refunded/chargebacked) → app unlocks
5. **Key is stored** in browser `localStorage` → no re-entry needed on same device

### First-time activation requires internet. After that, works fully offline.

---

## 🔒 Privacy Architecture

- **Zero data collection**: All invoices, customers, settings stored ONLY in browser `localStorage`
- **No analytics**: Google Analytics has been removed entirely
- **No cloud sync**: Data never leaves the device
- **One external call**: License validation (one-time, or on re-install)
- **Privacy notice**: Shown on first launch, explains everything clearly

---

## 📱 PWA Features

- **Installable**: Users can install to home screen (Android, iOS, Desktop)
- **Offline support**: Full functionality without internet after first load
- **App shortcuts**: New Invoice, Customers, Reports from home screen long-press
- **Fast**: All assets cached by service worker

---

## 🛒 Gumroad Selling Tips

1. Set price as **one-time** (not subscription)
2. Enable **license keys** in product settings
3. Add to your product description: "Works offline. Your data stays on your device."
4. Include your app URL in the Gumroad receipt content

---

## 🔧 Customization

Edit `invoHub.js` top section:
```js
const LICENSE_VALIDATE_URL = '/.netlify/functions/validate-license';
const GUMROAD_URL = 'https://your-store.gumroad.com/l/invoHub';
```

Edit `index.html` to update:
- App name/branding in the license gate
- Buy link URL

---

## ⚠️ Before Going Live

- [ ] Copy all icons from the original `icons/` folder
- [ ] Replace Gumroad URL in `index.html` and `invoHub.js`
- [ ] Set `GUMROAD_PRODUCT_ID` environment variable in Netlify
- [ ] Test license activation with a real purchase
- [ ] Test offline mode (disable internet, reload app)
