# InvoHub 📄

> Professional invoicing that works offline. No subscriptions. Your data stays on your device.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-enabled-brightgreen.svg)](https://invohub-ecru.vercel.app)
[![Offline](https://img.shields.io/badge/offline-supported-orange.svg)](https://invohub-ecru.vercel.app)

[**Live Demo**](https://invohub-ecru.vercel.app) • [**Purchase**](https://gitsystem.gumroad.com/l/mefijo) • [**Documentation**](#documentation)

---

## 🎯 Overview

InvoHub is a privacy-first, offline-capable Progressive Web App (PWA) for creating professional invoices. Built for freelancers and small business owners who value privacy and hate recurring subscription fees.

### Why InvoHub?

- ✅ **Works Completely Offline** - Create invoices anywhere, even without internet
- ✅ **One-Time Payment** - $25.42 once, use forever. No subscriptions.
- ✅ **Privacy First** - All data stored locally on your device, never on our servers
- ✅ **Cross-Platform** - Works on iPhone, Android, Windows, Mac, and Linux
- ✅ **No Account Required** - Just activate with your license key

---

## ✨ Features

### Core Functionality
- 📄 **Professional Invoice Templates** - Clean, customizable designs
- 💰 **Smart Calculations** - Automatic tax, discounts, and totals
- 👥 **Client Management** - Save customer details for quick reuse
- 📊 **Payment Tracking** - Track paid, pending, and overdue invoices
- 🌍 **Multi-Currency Support** - Work with clients worldwide
- 📱 **Responsive Design** - Works perfectly on all screen sizes
- 🖨️ **PDF Export** - Generate print-ready invoices instantly

### Advanced Features
- 🎨 **Custom Branding** - Add your logo and brand colors
- 📈 **Dashboard Analytics** - Visualize revenue and invoice status
- 💾 **Data Backup/Restore** - Export and import your data anytime
- 🔒 **Offline-First Architecture** - Full functionality without internet
- 🚀 **Progressive Web App** - Installs like a native app
- 🌙 **Dark/Light Themes** - Choose your preferred interface

---

## 🚀 Quick Start

### For Users

1. **Visit the App**
   ```
   https://invohub-ecru.vercel.app
   ```

2. **Try Demo Mode** (Optional)
   - Click "Try Demo" on the license screen
   - Create up to 3 invoices for free
   - No credit card required

3. **Purchase License**
   - Go to [Gumroad](https://gitsystem.gumroad.com/l/mefijo)
   - Complete purchase ($25.42 one-time)
   - Receive license key via email

4. **Activate**
   - Enter your license key in the app
   - Start creating unlimited invoices!

5. **Install as App** (Optional)
   - **Mobile:** Tap Share → "Add to Home Screen"
   - **Desktop:** Click install icon in address bar

---

## 💻 For Developers

### Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Storage:** LocalStorage API
- **Charts:** Chart.js
- **License Validation:** Gumroad API
- **Hosting:** Vercel
- **PWA:** Service Worker + Web Manifest

### Installation

```bash
# Clone the repository
git clone https://github.com/donalDaboiku/invohub.git

# Navigate to project directory
cd invohub

# No build step required - it's vanilla JS!
# Just open index.html in a browser or use a local server

# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Or deploy directly to Vercel
vercel
```

### Project Structure

```
invohub/
├── index.html              # Main HTML file
├── invoHub.js              # Core application logic
├── invoHub.css             # Styles and themes
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker for offline support
├── icons/                  # App icons for PWA
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   └── icon-*.png
└── README.md               # This file
```

 
 
## 🔧 How It Works

### License Validation

InvoHub uses Gumroad's API for license validation:

1. User purchases on Gumroad → receives unique license key
2. User enters key in app → app validates with Gumroad API
3. Gumroad confirms validity → app activates
4. Activation stored locally → works offline forever

**Key Features:**
- ✅ One device per license (enforced via API)
- ✅ Offline support after first activation
- ✅ Deactivation/reactivation on new devices
- ✅ Automatic refund/chargeback detection

### Data Storage

All data is stored using the browser's LocalStorage API:

```javascript
Storage Keys:
├── invoHub_invoices        // All invoice data
├── invoHub_customers       // Customer information
├── invoHub_settings        // User preferences
├── invoHub_logo            // Company logo (base64)
├── invoHub_license_key     // Encrypted license key
└── invoHub_license_activated // Activation status
```

**Privacy Guarantee:**
- 🔒 No data ever sent to external servers (except license validation)
- 🔒 No tracking or analytics
- 🔒 No accounts or user profiles
- 🔒 Full data ownership

---

## 📱 PWA Installation

### iOS/iPadOS
1. Open in Safari
2. Tap the Share button (box with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### Android
1. Open in Chrome
2. Tap the menu (⋮) → "Install app" or "Add to Home Screen"
3. Tap "Install"

### Desktop (Chrome/Edge)
1. Look for the install icon (⊕) in the address bar
2. Click it and select "Install"

---

## 🎨 Customization

### Themes
Choose between dark and light modes in Settings.

### Branding
- Upload your company logo
- Set company details (name, address, email, phone)
- Customize invoice prefix (e.g., "INV-", "BILL-")
- Adjust tax rates
- Choose currency (USD, EUR, GBP, NGN, etc.)
- Select date format (US, EU, ISO)

### Invoice Templates
All invoices include:
- Company branding
- Client information
- Itemized services/products
- Automatic calculations
- Notes and terms
- Professional formatting

---

## 📊 Features Breakdown

### Dashboard
- Total revenue tracking
- Invoice count statistics
- Pending payments overview
- Overdue invoice alerts
- Recent invoice list
- Quick access to create new invoices

### Invoice Management
- Create/edit/delete invoices
- Sequential invoice numbering
- Status tracking (Paid, Pending, Overdue)
- PDF export for printing/emailing
- Search and filter capabilities
- Bulk operations

### Customer Management
- Save customer information
- Email and phone records
- Address storage
- Quick customer selection
- Customer history
- Export customer email list

### Reports
- Revenue trends chart
- Invoice status breakdown
- Top customers by revenue
- Monthly/yearly analytics
- Exportable data (CSV)

### Settings
- Company profile management
- Logo upload and management
- Currency and tax configuration
- Date format preferences
- Theme customization
- License management
- Data backup/restore

---

## 🔐 Security & Privacy

### What We Do
- ✅ Store all data locally on your device
- ✅ Validate licenses via encrypted API calls
- ✅ Use HTTPS for all connections
- ✅ No tracking or analytics
- ✅ No data collection

### What We DON'T Do
- ❌ Send invoice data to servers
- ❌ Store customer information remotely
- ❌ Track user behavior
- ❌ Sell or share any data
- ❌ Require account creation

### Data Portability
- Export full backup anytime (JSON format)
- Import data to new device
- No vendor lock-in
- You own your data 100%

---

## 💡 Use Cases

### Perfect For:
- 👨‍💻 Freelance developers, designers, writers
- 🎨 Creative professionals
- 💼 Consultants and coaches
- 🏗️ Contractors and tradespeople
- 📸 Photographers and videographers
- 🎓 Tutors and educators
- 🏪 Small business owners
- 🌍 Digital nomads needing offline access

### Not Suitable For:
- Large enterprises needing multi-user access
- Businesses requiring cloud sync
- Companies needing full accounting software
- Teams requiring collaboration features

---

## 🆘 Support

### Common Issues

**Q: License key not validating?**
- ✅ Check for typos (keys are case-sensitive)
- ✅ Ensure you have internet for first activation
- ✅ Verify you're using the correct product ID
- ✅ Contact support if issues persist

**Q: Can I use on multiple devices?**
- ⚠️ One license = one device at a time
- ✅ Deactivate old device in Settings to move to new device
- ✅ Your data stays on each device separately

**Q: Lost my license key?**
- 📧 Check your Gumroad receipt email
- 📧 Search email for "InvoHub" or "Gumroad"
- 🆘 Contact Gumroad support with order details

**Q: How do I backup my data?**
- Settings → Data Management → Export Data
- Save the JSON file somewhere safe
- Import on new device if needed

**Q: Works offline but won't activate?**
- ⚠️ First activation requires internet
- ✅ After first activation, works 100% offline
- ✅ License is validated once, then cached locally

### Contact Support

- 📧 Email: donalddaboiku@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/donaldDaboiku/invohub/issues)
- 💬 Gumroad: Reply to your receipt email

---

## 🛣️ Roadmap

### Planned Features
- [ ] Recurring invoices
- [ ] Expense tracking
- [ ] Multiple invoice templates
- [ ] Email integration (send invoices directly)
- [ ] Payment gateway integration
- [ ] Multi-language support
- [ ] Advanced reporting

### Under Consideration
- Cloud backup option (optional, opt-in)
- Mobile apps (iOS/Android native)
- Browser extensions
- API for integrations

**Note:** All features will maintain our privacy-first, offline-capable philosophy.

---

## 📜 License

This project is proprietary software. Purchase a license at [Gumroad](https://gitsystem.gumroad.com/l/mefijo).

### License Terms
- ✅ One license per device
- ✅ Lifetime updates included
- ✅ No recurring fees
- ✅ 14-day money-back guarantee
- ❌ No redistribution or resale
- ❌ No reverse engineering

---

## 🙏 Acknowledgments

Built with:
- [Chart.js](https://www.chartjs.org/) - Beautiful charts
- [Gumroad](https://gumroad.com/) - Payment processing & license management
- [Vercel](https://vercel.com/) - Hosting and deployment

---

## 📈 Stats

- 🚀 **Launched:** January 2025
- 💾 **Size:** < 500KB (lightning fast!)
- 📱 **Platforms:** iOS, Android, Windows, Mac, Linux
- 🌍 **Languages:** English (more coming soon)
- ⭐ **Rating:** 5/5 (based on early users)

---

## 🤝 Contributing

This is a commercial project, but we welcome:
- 🐛 Bug reports
- 💡 Feature suggestions
- 📝 Documentation improvements
- 🌍 Translations

Please open an issue on GitHub or contact us directly.

---

## 📞 Contact

- **Developer:** Donald Daboiku
- **Email:** donalddaboiku@gmail.com
- **Website:** [invohub-ecru.vercel.app](https://invohub-ecru.vercel.app)
- **Gumroad:** [gitsystem.gumroad.com](https://gitsystem.gumroad.com/l/mefijo)
- **Twitter:** [@donalddaboiku](https://twitter.com/donalddaboiku)

---

## ⚖️ Disclaimer

InvoHub is invoicing software, not accounting software. For tax compliance, bookkeeping, or financial advice, please consult with a qualified accountant or tax professional.

---

<div align="center">

**Made with ❤️ for freelancers and small business owners**

[Get InvoHub](https://gitsystem.gumroad.com/l/mefijo) • [Try Demo](https://invohub-ecru.vercel.app) • [Documentation](#documentation)

---

© 2026 InvoHub. All rights reserved.

</div>
