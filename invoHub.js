// invoHub v4 - Complete Application with Gumroad License + PWA + Privacy
'use strict';

// ==================== CONFIGURATION ====================
const GUMROAD_PRODUCT_PERMALINK = 'QDQR3nOYx2wXbctQEB75lg=='; // Get from Gumroad Dashboard

// Gumroad product page URL — replace with your actual product URL
const GUMROAD_URL = 'https://gitsystem.gumroad.com/l/mcfjio'; // Your real Gumroad URL



// ==================== STORAGE KEYS ====================
const STORAGE_KEYS = {
    INVOICES:   'invoHub_invoices',
    CUSTOMERS:  'invoHub_customers',
    SETTINGS:   'invoHub_settings',
    LOGO:       'invoHub_logo',
    LICENSE_KEY: 'invoHub_license_key',
    LICENSE_EMAIL: 'invoHub_license_email',
    // LICENSE_DEVICES: 'invoHub_license_devices',
    LICENSE_ACTIVATED: 'invoHub_license_activated',
    DEMO_MODE: 'invoHub_demo_mode',
    PRIVACY_ACK: 'invoHub_privacy_ack',
    INVOICE_COUNTER: 'invoHub_invoice_counter' // persistent sequential counter
};
// Helper function to check if in demo mode
const DEMO_LIMITS = {
    MAX_INVOICES: 3,
    MAX_CUSTOMERS: 2,
    WATERMARKE: true
}
function isDemoMode() {
    const isActivated = localStorage.getItem(STORAGE_KEYS.LICENSE_ACTIVATED);
    return isActivated !== 'true';
}

// Helper function to get remaining demo invoices
function getDemoInvoicesRemaining() {
    if (!isDemoMode()) return Infinity;
    const invoices = getInvoices();
    return Math.max(0, DEMO_LIMITS.MAX_INVOICES - invoices.length);
}

// Helper function to get remaining demo customers
function getDemoCustomersRemaining() {
    if (!isDemoMode()) return Infinity;
    const customers = getCustomers();
    return Math.max(0, DEMO_LIMITS.MAX_CUSTOMERS - customers.length);
}

// ==================== GLOBAL STATE ====================
let currentInvoice = null;
let currentViewInvoice = null;
let currentCustomer = null;
let revenueChart = null;
let statusChart = null;

// ==================== APP INIT ====================
document.addEventListener('DOMContentLoaded', function () {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('[SW] Registered:', reg.scope);
        }).catch(err => console.warn('[SW] Registration failed:', err));
    }

    // Check if URL has action shortcuts from PWA manifest
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');

    // Check license first
    const licenseKey = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY);
    const alreadyActivated = localStorage.getItem(STORAGE_KEYS.DEVICE_ACTIVATED);

    if (licenseKey && alreadyActivated) {
        // Device already claimed a seat — do a silent background check (no seat increment)
        silentLicenseCheck(licenseKey, action);
    } else if (licenseKey && !alreadyActivated) {
        // Has a key stored but never claimed a seat (e.g. after clearing activated flag)
        showLicenseGate(licenseKey);
    } else {
        showLicenseGate();
    }
});

//===================DEMO ==============================
    function startDemoMode() {
        localStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'true');
        document.getElementById('license-gate').classList.remove('visible');
        bootApp();


        setTimeout(() => {
            alert(
                'Welcome to InvoHub Demo!\n\n' +
                'You can create up to 3 invoices and 2 customers for free.\n\n' +
                'Purchase a license anytime to unlock unlimited invoices, ' +
                'remove watermarks, and keep all your data.\n\n' +
                'Happy invoicing!'
            );
        }, 500);
    }
// ==================== LICENSE GATE ====================

function showLicenseGate(prefillKey = '') {
    document.getElementById('license-gate').classList.add('visible');
    document.getElementById('main-app').style.display = 'none';

    const input = document.getElementById('license-key-input');
    if (prefillKey) input.value = prefillKey;

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') activateLicense();
    });

    input.addEventListener('input', function () {
        this.classList.remove('error', 'success');
        document.getElementById('license-error').textContent = '';
    });
}

async function activateLicense() {
    const input = document.getElementById('license-key-input');
    const btn = document.getElementById('activate-btn');
    const btnText = document.getElementById('activate-btn-text');
    const errorEl = document.getElementById('license-error');

    const key = input.value.trim();

    if (!key || key.length < 8) {
        input.classList.add('error');
        errorEl.textContent = 'Please enter a valid license key from your Gumroad receipt email.';
        return;
    }

    btn.disabled = true;
    btnText.innerHTML = '<span class="license-loader"></span> Validating...';
    errorEl.textContent = '';

    try {
        // Validate with Gumroad API directly
        const result = await validateGumroadLicense(key, true); // true = increment uses

        if (result.success) {
            // Check if already at device limit (1 device per license)
            if (result.uses > 1) {
                input.classList.add('error');
                errorEl.textContent = `This license is already activated on another device. Please deactivate the other device first, or contact support.`;
                btn.disabled = false;
                btnText.textContent = '✓ Activate License';
                return;
            }

            // Valid and within device limit - save activation
            localStorage.setItem(STORAGE_KEYS.LICENSE_KEY, key);
            localStorage.setItem(STORAGE_KEYS.LICENSE_EMAIL, result.email || 'Verified');
            localStorage.setItem(STORAGE_KEYS.LICENSE_ACTIVATED, 'true');

            input.classList.add('success');
            btnText.innerHTML = '✓ Activated! Loading app...';

            setTimeout(() => {
                document.getElementById('license-gate').classList.remove('visible');
                bootApp();
            }, 800);
        } else {
            input.classList.add('error');
            errorEl.textContent = result.message || 'Invalid license key. Please check your Gumroad receipt email.';
            btn.disabled = false;
            btnText.textContent = '✓ Activate License';
        }
    } catch (err) {
        console.error('License validation error:', err);
        input.classList.add('error');
        errorEl.textContent = 'Could not reach activation server. Please check your internet connection and try again.';
        btn.disabled = false;
        btnText.textContent = '✓ Activate License';
    }
}

// Validate license with Gumroad API
async function validateGumroadLicense(licenseKey, incrementUses = false) {
    try {
        const formData = new URLSearchParams();
        formData.append('product_id', GUMROAD_PRODUCT_PERMALINK);
        formData.append('license_key', licenseKey);
        formData.append('increment_uses_count', incrementUses ? 'true' : 'false');

        const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });

        const data = await response.json();

        if (data.success && data.purchase) {
            // Check if refunded or chargebacked
            if (data.purchase.refunded) {
                return {
                    success: false,
                    message: 'This license has been refunded and is no longer valid.'
                };
            }

            if (data.purchase.chargebacked) {
                return {
                    success: false,
                    message: 'This license is invalid due to a chargeback.'
                };
            }

            return {
                success: true,
                email: data.purchase.email,
                uses: data.uses || 1,
                purchase: data.purchase
            };
        } else {
            return {
                success: false,
                message: data.message || 'Invalid license key.'
            };
        }
    } catch (error) {
        console.error('Gumroad API error:', error);
        throw error;
    }
}

// Silent background check on every app launch — no seat increment, just verifies key is still valid
async function silentLicenseCheck(key) {
    try {
        const result = await validateGumroadLicense(key, false); // false = don't increment

        if (!result.success) {
            // Key revoked / refunded — sign out
            localStorage.removeItem(STORAGE_KEYS.LICENSE_KEY);
            localStorage.removeItem(STORAGE_KEYS.LICENSE_EMAIL);
            localStorage.removeItem(STORAGE_KEYS.LICENSE_ACTIVATED);
            alert('Your license is no longer valid (possibly refunded or revoked). Please contact support if this is an error.');
            window.location.reload();
            return;
        }

        // Update email display in case it changed
        if (result.email) {
            localStorage.setItem(STORAGE_KEYS.LICENSE_EMAIL, result.email);
            const emailEl = document.getElementById('sidebar-email-text');
            if (emailEl) emailEl.textContent = result.email;
        }

    } catch (err) {
        // Offline — allow, since key is stored locally and app works offline
        console.log('[License] Offline - skipping validation check');
    }
}
async function deactivateLicense() {
    const confirmed = confirm(
        '⚠️ DEACTIVATE THIS DEVICE?\n\n' +
        'This will:\n' +
        '• Sign you out of InvoHub on THIS device\n' +
        '• Allow you to activate on a different device\n' +
        '• Your invoice data will remain on this device (but locked)\n\n' +
        'Continue with deactivation?'
    );

    if (!confirmed) return;

    // Note: Gumroad doesn't have a "decrement uses" API endpoint
    // So we just clear local activation - user must contact support if they need help

    localStorage.removeItem(STORAGE_KEYS.LICENSE_KEY);
    localStorage.removeItem(STORAGE_KEYS.LICENSE_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.LICENSE_ACTIVATED);

    alert(
        '✓ Device Deactivated\n\n' +
        'You can now activate InvoHub on another device using your license key.\n\n' +
        'Your invoice data remains on this device but the app is locked.'
    );

    window.location.reload();
}

function copyLicenseKey() {
    const key = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY);
    if (key) {
        navigator.clipboard.writeText(key).then(() => {
            alert('License key copied to clipboard!');
        });
    }
}

// ==================== BOOT APP ====================

function bootApp(action) {
    document.getElementById('license-gate').classList.remove('visible');
    document.getElementById('main-app').style.display = 'flex';

    // Show privacy notice if first run
    if (!localStorage.getItem(STORAGE_KEYS.PRIVACY_ACK)) {
        document.getElementById('privacy-notice').classList.add('visible');
    }
    if (isDemoMode()) {
        showDemoBanner();
    }

    // Set up license info in sidebar and settings
    const email = localStorage.getItem(STORAGE_KEYS.LICENSE_EMAIL) || 'Verified';
    const devices = localStorage.getItem(STORAGE_KEYS.LICENSE_DEVICES) || '';
    const emailShort = email.length > 28 ? email.substring(0, 25) + '...' : email;
    document.getElementById('sidebar-email-text').textContent = emailShort;
    const settingsEmail = document.getElementById('settings-license-email');
    if (settingsEmail) settingsEmail.textContent = `Licensed to: ${email}`;
    const settingsDevices = document.getElementById('settings-device-count');
    if (settingsDevices && devices) settingsDevices.textContent = `${devices} devices activated`;

    // Initialize app
    initApp();

    // Handle PWA shortcut actions
    if (action === 'new-invoice') {
        setTimeout(() => openInvoiceModal(), 300);
    } else if (action === 'customers') {
        navigateToPage('customers');
    } else if (action === 'reports') {
        navigateToPage('reports');
    }
}
// Demo banner function
function showDemoBanner() {
    const invoicesRemaining = getDemoInvoicesRemaining();
    const customersRemaining = getDemoCustomersRemaining();
    
    const banner = document.createElement('div');
    banner.id = 'demo-banner';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 20px;
        text-align: center;
        font-size: 14px;
        font-weight: 600;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    banner.innerHTML = `
        🎯 Demo Mode: ${invoicesRemaining} invoice${invoicesRemaining !== 1 ? 's' : ''} remaining • 
        ${customersRemaining} customer${customersRemaining !== 1 ? 's' : ''} remaining • 
        <a href="https://gitsystem.gumroad.com/l/mefijo" target="_blank" 
           style="color: white; text-decoration: underline; margin-left: 8px;">
           Upgrade to Pro ($25.42)
        </a>
    `;
    
    document.body.prepend(banner);
    
    // Adjust main app top padding to account for banner
    document.getElementById('main-app').style.paddingTop = '48px';
}
// ==================== PRIVACY =====================

function acknowledgePrivacy() {
    localStorage.setItem(STORAGE_KEYS.PRIVACY_ACK, '1');
    document.getElementById('privacy-notice').classList.remove('visible');
}

// ==================== APP INITIALIZATION ====================

function initApp() {
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoice-date').value = today;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    document.getElementById('due-date').value = dueDate.toISOString().split('T')[0];

    generateInvoiceNumber();
    loadSettings();
    applyTheme();
    renderFooter();
    loadInvoices();
    updateDashboard();
    loadCustomers();
    setupEventListeners();
    setupNavigation();
}

// ==================== NAVIGATION ====================

function setupNavigation() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', function () {
            navigateToPage(this.getAttribute('data-page'));
        });
    });
}

function navigateToPage(pageName) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-page') === pageName);
    });

    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));

    const selectedPage = document.getElementById(`${pageName}-page`);
    if (selectedPage) selectedPage.classList.remove('hidden');

    if (pageName === 'invoices') loadInvoices();
    else if (pageName === 'dashboard') updateDashboard();
    else if (pageName === 'customers') loadCustomers();
    else if (pageName === 'reports') loadReports();
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
    document.getElementById('search-input').addEventListener('input', filterInvoices);
    document.getElementById('status-filter').addEventListener('change', filterInvoices);

    const customerSearchInput = document.getElementById('customer-search-input');
    if (customerSearchInput) customerSearchInput.addEventListener('input', filterCustomers);

    document.getElementById('items-container').addEventListener('input', function (e) {
        if (e.target.classList.contains('item-quantity') || e.target.classList.contains('item-price')) {
            calculateItemTotal(e.target.closest('.item-row'));
            calculateInvoiceTotal();
        }
    });

    // Customer name autocomplete
    const customerNameInput = document.getElementById('customer-name');
    customerNameInput.addEventListener('input', function () {
        showCustomerSuggestions(this.value);
    });

    // Email settings toggle
    const emailToggle = document.getElementById('collect-emails-toggle');
    if (emailToggle) {
        emailToggle.addEventListener('change', function () {
            document.getElementById('email-settings-container').style.display = this.checked ? 'block' : 'none';
        });
    }

    // Theme preview
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.addEventListener('change', function () {
            applyTheme(this.value);
        });
    }
}

// ==================== CUSTOMER AUTOCOMPLETE ====================

function showCustomerSuggestions(query) {
    const suggestionsDiv = document.getElementById('customer-suggestions');
    if (!query || query.length < 2) {
        suggestionsDiv.innerHTML = '';
        return;
    }

    const customers = getCustomers();
    const matches = customers.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    if (matches.length === 0) {
        suggestionsDiv.innerHTML = '';
        return;
    }

    suggestionsDiv.innerHTML = `
        <div style="position:absolute;left:0;right:0;background:var(--card-bg);border:1px solid var(--border);border-radius:8px;z-index:100;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
            ${matches.map(c => `
                <div onclick="selectCustomer('${c.id}')"
                     style="padding:12px 16px;cursor:pointer;border-bottom:1px solid var(--border);font-size:14px;"
                     onmouseenter="this.style.background='rgba(255,255,255,0.05)'"
                     onmouseleave="this.style.background=''">
                    <strong>${c.name}</strong>
                    ${c.email ? `<span style="color:var(--text-muted);margin-left:8px;font-size:12px;">${c.email}</span>` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function selectCustomer(id) {
    const customers = getCustomers();
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    document.getElementById('customer-name').value = customer.name;
    document.getElementById('customer-address').value = customer.address || '';
    document.getElementById('customer-email').value = customer.email || '';
    document.getElementById('customer-phone').value = customer.phone || '';
    document.getElementById('customer-suggestions').innerHTML = '';
}

// ==================== INVOICE NUMBER ====================

// peekNextInvoiceNumber — shows what the next number WILL be without committing it.
// The number only gets locked in when saveInvoice() actually saves a new invoice.
function peekNextInvoiceNumber() {
    const year = new Date().getFullYear();
    const stored = localStorage.getItem(STORAGE_KEYS.INVOICE_COUNTER);
    let lastYear = 0, lastCount = 0;
    if (stored) {
        const parts = stored.split(':');
        lastYear  = parseInt(parts[0], 10);
        lastCount = parseInt(parts[1], 10);
    }
    const next = (lastYear === year) ? lastCount + 1 : 1;
    return `INV-${year}-${String(next).padStart(4, '0')}`;
}

// commitNextInvoiceNumber — locks in the counter. Call ONLY when a new invoice is saved.
function commitNextInvoiceNumber() {
    const year = new Date().getFullYear();
    const stored = localStorage.getItem(STORAGE_KEYS.INVOICE_COUNTER);
    let lastYear = 0, lastCount = 0;
    if (stored) {
        const parts = stored.split(':');
        lastYear  = parseInt(parts[0], 10);
        lastCount = parseInt(parts[1], 10);
    }
    const next = (lastYear === year) ? lastCount + 1 : 1;
    localStorage.setItem(STORAGE_KEYS.INVOICE_COUNTER, `${year}:${next}`);
    return `INV-${year}-${String(next).padStart(4, '0')}`;
}

// generateInvoiceNumber — kept for compatibility, used when opening modal
function generateInvoiceNumber() {
    document.getElementById('invoice-number').value = peekNextInvoiceNumber();
}

// syncCounterToInvoices — call after a backup restore to ensure the counter
// is always ahead of the highest existing invoice number.
function syncCounterToInvoices(invoices) {
    const year = new Date().getFullYear();
    let highest = 0;

    invoices.forEach(inv => {
        if (!inv.number) return;
        // Match format INV-YYYY-NNNN
        const match = inv.number.match(/^INV-(\d{4})-(\d+)$/);
        if (match && parseInt(match[1], 10) === year) {
            highest = Math.max(highest, parseInt(match[2], 10));
        }
    });

    if (highest > 0) {
        const stored = localStorage.getItem(STORAGE_KEYS.INVOICE_COUNTER);
        let currentCount = 0;
        if (stored) {
            const parts = stored.split(':');
            if (parseInt(parts[0], 10) === year) currentCount = parseInt(parts[1], 10);
        }
        // Only update if restored data has a higher number
        if (highest > currentCount) {
            localStorage.setItem(STORAGE_KEYS.INVOICE_COUNTER, `${year}:${highest}`);
        }
    }
}

// ==================== STORAGE FUNCTIONS ====================

function getInvoices() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function saveInvoices(invoices) {
    try {
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
        return true;
    } catch (e) {
        alert('Failed to save. Your browser storage may be full.');
        return false;
    }
}

function getSettings() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return data ? JSON.parse(data) : {
            currency: 'NGN', currencySymbol: '₦', theme: 'dark',
            taxRate: 10, dateFormat: 'us',
            companyName: '', companyAddress: '', companyEmail: '',
            companyPhone: '', companyWebsite: '', companyTaxId: '',
            bankName: '', accountName: '', accountNumber: '',
            routingNumber: '', swiftCode: '', iban: '',
            footerCompanyName: 'GIT System Software', footerTagline: '',
            footerTermsUrl: '', footerPrivacyUrl: '', footerSupportUrl: '',
            collectEmails: false,
            emailConsentMessage: 'I agree to receive promotional emails. You can unsubscribe at any time.'
        };
    } catch (e) {
        return {};
    }
}

function saveSettingsData(settings) {
    try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        return true;
    } catch (e) {
        return false;
    }
}

function getLogo() { return localStorage.getItem(STORAGE_KEYS.LOGO); }

function saveLogo(logoData) {
    try { localStorage.setItem(STORAGE_KEYS.LOGO, logoData); return true; }
    catch (e) { return false; }
}

function getCustomers() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function saveCustomers(customers) {
    try {
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
        return true;
    } catch (e) {
        alert('Failed to save customers.');
        return false;
    }
}

// ==================== LOAD & DISPLAY INVOICES ====================

function loadInvoices() {
    const invoices = getInvoices();
    const container = document.getElementById('invoices-container');
    const dashboardContainer = document.getElementById('dashboard-invoices-container');

    if (invoices.length === 0) {
        const emptyHTML = `
            <div class="empty-state">
                <div class="empty-icon">📄</div>
                <div class="empty-title">No invoices yet</div>
                <div class="empty-text">Create your first invoice to get started</div>
            </div>`;
        container.innerHTML = emptyHTML;
        dashboardContainer.innerHTML = emptyHTML;
        return;
    }

    // Sort newest first
    const sorted = [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = buildInvoiceTable(sorted, true);
    dashboardContainer.innerHTML = buildInvoiceTable(sorted.slice(0, 5), false);
}

function buildInvoiceTable(invoices, showDueDate) {
    return `
        <table class="invoice-table">
            <thead>
                <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    ${showDueDate ? '<th>Due</th>' : ''}
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${invoices.map(inv => `
                    <tr>
                        <td><strong>${inv.number}</strong></td>
                        <td>${inv.customerName}</td>
                        <td>${formatDate(inv.date)}</td>
                        ${showDueDate ? `<td>${formatDate(inv.dueDate)}</td>` : ''}
                        <td><strong>${formatCurrency(inv.total)}</strong></td>
                        <td>
                            <span class="status-badge ${inv.status}">
                                ${inv.status === 'paid' ? '✓' : inv.status === 'overdue' ? '⚠' : '⏱'}
                                ${inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                            </span>
                        </td>
                        <td>
                            <button class="actions-btn" onclick="viewInvoice('${inv.id}')" title="View">👁</button>
                            <button class="actions-btn" onclick="editInvoice('${inv.id}')" title="Edit">✏️</button>
                            <button class="actions-btn" onclick="deleteInvoice('${inv.id}')" title="Delete">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

// ==================== FILTER INVOICES ====================

function filterInvoices() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    let invoices = getInvoices();

    if (searchTerm) {
        invoices = invoices.filter(inv =>
            inv.number.toLowerCase().includes(searchTerm) ||
            inv.customerName.toLowerCase().includes(searchTerm)
        );
    }
    if (statusFilter !== 'all') {
        invoices = invoices.filter(inv => inv.status === statusFilter);
    }

    const container = document.getElementById('invoices-container');
    if (invoices.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <div class="empty-title">No invoices found</div>
                <div class="empty-text">Try adjusting your search or filters</div>
            </div>`;
        return;
    }

    invoices.sort((a, b) => new Date(b.date) - new Date(a.date));
    container.innerHTML = buildInvoiceTable(invoices, true);
}

// ==================== DASHBOARD ====================

function updateDashboard() {
    const invoices = getInvoices();
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const pendingCount = invoices.filter(inv => inv.status === 'pending').length;
    const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;

    document.getElementById('total-revenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('total-invoices').textContent = invoices.length;
    document.getElementById('pending-invoices').textContent = pendingCount;
    document.getElementById('overdue-invoices').textContent = overdueCount;

    loadInvoices();
}

// ==================== INVOICE MODAL ====================

function openInvoiceModal() {
    currentInvoice = null;
    document.getElementById('modal-title').textContent = 'Create New Invoice';
    document.getElementById('invoice-form').reset();
    document.getElementById('customer-suggestions').innerHTML = '';

    document.getElementById('items-container').innerHTML = `
        <div class="item-row">
            <div class="form-group">
                <input type="text" class="form-input item-description" placeholder="Description" required>
            </div>
            <div class="form-group">
                <input type="number" class="form-input item-quantity" placeholder="Qty" min="1" value="1" required>
            </div>
            <div class="form-group">
                <input type="number" class="form-input item-price" placeholder="Price" step="0.01" min="0" required>
            </div>
            <div class="form-group">
                <input type="number" class="form-input item-total" placeholder="Total" readonly>
            </div>
            <button type="button" class="remove-item-btn" onclick="removeItem(this)" style="visibility:hidden;">×</button>
        </div>`;

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoice-date').value = today;
    const due = new Date();
    due.setDate(due.getDate() + 30);
    document.getElementById('due-date').value = due.toISOString().split('T')[0];
    generateInvoiceNumber();
    calculateInvoiceTotal();

    document.getElementById('invoice-modal').classList.add('active');
}

function closeInvoiceModal() {
    document.getElementById('invoice-modal').classList.remove('active');
    currentInvoice = null;
}

// ==================== SAVE INVOICE ====================

function saveInvoice() {

    const form = document.getElementById('invoice-form');
    if (!form.checkValidity()){
        form.reportValidity();
        return;
    }

    // Check demo limits

    if (isDemoMode() && !currentInvoice) {
        const remaining = getDemoInvoicesRemaining();
        if (remaining <= 0) {
            const upgrade = confirm(
                'Demo Limit Reached\n\n' +
                'You\'ve created 3 invoices (demo limit). \n\n' +
                'Purchase a license to create unlimited invoices and unlock all features. \n\n' +
                'Buy now?'
            );
            if  (upgrade) {
                window.open('https://gitsystem.gumroad.com/l/mefijo', '_blank');
            }
            return;
        }
    }
    const number = document.getElementById('invoice-number').value.trim();
    const status = document.getElementById('invoice-status').value;
    const date = document.getElementById('invoice-date').value;
    const dueDate = document.getElementById('due-date').value;
    const customerName = document.getElementById('customer-name').value.trim();
    const customerAddress = document.getElementById('customer-address').value.trim();
    const customerEmail = document.getElementById('customer-email').value.trim();
    const customerPhone = document.getElementById('customer-phone').value.trim();
    const notes = document.getElementById('invoice-notes').value.trim();

    if (!number || !date || !dueDate || !customerName) {
        alert('Please fill in all required fields (Invoice #, Date, Due Date, Customer Name).');
        return;
    }

    const items = [];
    document.querySelectorAll('.item-row').forEach(row => {
        const description = row.querySelector('.item-description').value.trim();
        const quantity = parseFloat(row.querySelector('.item-quantity').value);
        const price = parseFloat(row.querySelector('.item-price').value);
        if (description && quantity > 0 && price >= 0) {
            items.push({ description, quantity, price, total: quantity * price });
        }
    });

    if (items.length === 0) {
        alert('Please add at least one item with a description and price.');
        return;
    }

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const settings = getSettings();
    const taxRate = (settings.taxRate || 0) / 100;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const invoice = {
        id: currentInvoice ? currentInvoice.id : generateId(),
        // For new invoices: lock in the next sequential number now.
        // For edits: keep the original number unchanged.
        number: currentInvoice ? number : commitNextInvoiceNumber(),
        status, date, dueDate,
        customerName, customerAddress, customerEmail, customerPhone,
        items, subtotal, tax, total, notes,
        createdAt: currentInvoice ? currentInvoice.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const invoices = getInvoices();
    if (currentInvoice) {
        const idx = invoices.findIndex(inv => inv.id === currentInvoice.id);
        if (idx !== -1) invoices[idx] = invoice;
    } else {
        invoices.push(invoice);
    }

    if (saveInvoices(invoices)) {
        // Auto-sync customer to Customer Management
        syncCustomerFromInvoice({ customerName, customerAddress, customerEmail, customerPhone });
        closeInvoiceModal();
        loadInvoices();
        updateDashboard();
        showToast('Invoice saved successfully!');
    }
}


// ==================== AUTO-SYNC CUSTOMER FROM INVOICE ====================
// When an invoice is saved, automatically create or update the customer record.
// - New customer name → creates a new customer entry silently
// - Existing customer name (exact match) → updates their address/email/phone
//   only if the invoice fields are non-empty (never blanks out existing data)

function syncCustomerFromInvoice({ customerName, customerAddress, customerEmail, customerPhone }) {
    if (!customerName) return;

    const customers = getCustomers();
    const existing = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());

    if (existing) {
        // Update contact details only if the invoice provided them
        let changed = false;
        if (customerAddress && customerAddress !== existing.address) { existing.address = customerAddress; changed = true; }
        if (customerEmail   && customerEmail   !== existing.email)   { existing.email   = customerEmail;   changed = true; }
        if (customerPhone   && customerPhone   !== existing.phone)   { existing.phone   = customerPhone;   changed = true; }
        if (changed) {
            existing.updatedAt = new Date().toISOString();
            saveCustomers(customers);
        }
    } else {
        // Brand new customer — create silently
        const newCustomer = {
            id: generateId(),
            name: customerName,
            address: customerAddress || '',
            email: customerEmail || '',
            phone: customerPhone || '',
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        customers.push(newCustomer);
        saveCustomers(customers);
    }

    updateEmailCount();
}

// ==================== EDIT / DELETE / VIEW INVOICE ====================

function editInvoice(id) {
    const invoice = getInvoices().find(inv => inv.id === id);
    if (!invoice) return;

    currentInvoice = invoice;
    document.getElementById('modal-title').textContent = 'Edit Invoice';
    document.getElementById('invoice-number').value = invoice.number;
    document.getElementById('invoice-status').value = invoice.status;
    document.getElementById('invoice-date').value = invoice.date;
    document.getElementById('due-date').value = invoice.dueDate;
    document.getElementById('customer-name').value = invoice.customerName;
    document.getElementById('customer-address').value = invoice.customerAddress || '';
    document.getElementById('customer-email').value = invoice.customerEmail || '';
    document.getElementById('customer-phone').value = invoice.customerPhone || '';
    document.getElementById('invoice-notes').value = invoice.notes || '';
    document.getElementById('customer-suggestions').innerHTML = '';

    const itemsContainer = document.getElementById('items-container');
    itemsContainer.innerHTML = '';
    invoice.items.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <div class="form-group">
                <input type="text" class="form-input item-description" value="${escapeHtml(item.description)}" placeholder="Description" required>
            </div>
            <div class="form-group">
                <input type="number" class="form-input item-quantity" min="1" value="${item.quantity}" placeholder="Qty" required>
            </div>
            <div class="form-group">
                <input type="number" class="form-input item-price" step="0.01" min="0" value="${item.price}" placeholder="Price" required>
            </div>
            <div class="form-group">
                <input type="number" class="form-input item-total" value="${item.total.toFixed(2)}" placeholder="Total" readonly>
            </div>
            <button type="button" class="remove-item-btn" onclick="removeItem(this)" ${index === 0 ? 'style="visibility:hidden;"' : ''}>×</button>`;
        itemsContainer.appendChild(row);
    });

    calculateInvoiceTotal();
    document.getElementById('invoice-modal').classList.add('active');
}

function deleteInvoice(id) {
    if (!confirm('Delete this invoice? This cannot be undone.')) return;
    const filtered = getInvoices().filter(inv => inv.id !== id);
    if (saveInvoices(filtered)) {
        loadInvoices();
        updateDashboard();
        showToast('Invoice deleted.');
    }
}

function viewInvoice(id) {
    const invoice = getInvoices().find(inv => inv.id === id);
    if (!invoice) return;

    currentViewInvoice = invoice;
    generateInvoicePreview(invoice);
    document.getElementById('view-invoice-modal').classList.add('active');
}

function closeViewModal() {
    document.getElementById('view-invoice-modal').classList.remove('active');
    currentViewInvoice = null;
}

function editCurrentInvoice() {
    if (currentViewInvoice) {
        closeViewModal();
        editInvoice(currentViewInvoice.id);
    }
}

// ==================== INVOICE PREVIEW ====================

function generateInvoicePreview(invoice) {
    const settings = getSettings();
    const logo = getLogo();
    const isPaid = invoice.status === 'paid';
    const docType = isPaid ? 'RECEIPT' : 'INVOICE';
    const docTitle = isPaid ? 'Payment Receipt' : 'Invoice';

    const html = `
        <div class="invoice-preview-header">
        <div class="invoice-document">
            ${isDemoMode() ? '<div class="demo-watermart">DEMO VERSION- Purchase license to remove watermark</div>' : ''}
        
            <div class="company-info">
                ${logo ? `<img src="${logo}" alt="Logo" class="company-logo">` : ''}
                <h2>${escapeHtml(settings.companyName || 'Your Company Name')}</h2>
                <p>${settings.companyAddress ? escapeHtml(settings.companyAddress).replace(/\n/g, '<br>') : 'Company Address'}</p>
                ${settings.companyEmail ? `<p>Email: ${escapeHtml(settings.companyEmail)}</p>` : ''}
                ${settings.companyPhone ? `<p>Phone: ${escapeHtml(settings.companyPhone)}</p>` : ''}
            </div>
            <div class="invoice-details">
                <div style="font-size:24px;font-weight:700;color:${isPaid ? '#00ba88' : '#000'}">${docType}</div>
                <div style="font-size:18px;font-weight:700;margin-bottom:16px;">${escapeHtml(invoice.number)}</div>
                ${isPaid ? `<p style="color:#00ba88;font-weight:600;">✓ PAID</p>` : ''}
                <p><strong>Date:</strong> ${formatDate(invoice.date)}</p>
                ${!isPaid ? `<p><strong>Due:</strong> ${formatDate(invoice.dueDate)}</p>` : ''}
            </div>
        </div>

        <div class="invoice-preview-parties">
            <div class="party-section">
                <h3>${isPaid ? 'Received From:' : 'Bill To:'}</h3>
                <div class="party-details">
                    <strong>${escapeHtml(invoice.customerName)}</strong><br>
                    ${invoice.customerAddress ? escapeHtml(invoice.customerAddress).replace(/\n/g, '<br>') + '<br>' : ''}
                    ${invoice.customerEmail ? `Email: ${escapeHtml(invoice.customerEmail)}<br>` : ''}
                    ${invoice.customerPhone ? `Phone: ${escapeHtml(invoice.customerPhone)}` : ''}
                </div>
            </div>
            <div class="party-section">
                <h3>${isPaid ? 'Received By:' : 'From:'}</h3>
                <div class="party-details">
                    <strong>${escapeHtml(settings.companyName || 'Your Company Name')}</strong><br>
                    ${settings.companyAddress ? escapeHtml(settings.companyAddress).replace(/\n/g, '<br>') + '<br>' : ''}
                    ${settings.companyEmail ? `Email: ${escapeHtml(settings.companyEmail)}<br>` : ''}
                    ${settings.companyPhone ? `Phone: ${escapeHtml(settings.companyPhone)}` : ''}
                </div>
            </div>
        </div>

        ${isPaid ? '<p style="text-align:center;color:#00ba88;font-weight:600;margin-bottom:24px;">Payment received in full. Thank you for your business!</p>' : ''}

        <table class="invoice-preview-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.items.map(item => `
                    <tr>
                        <td>${escapeHtml(item.description)}</td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">${formatCurrency(item.price)}</td>
                        <td class="text-right">${formatCurrency(item.total)}</td>
                    </tr>`).join('')}
            </tbody>
        </table>

        <div class="invoice-preview-summary">
            <div class="summary-row" style="color:#000;"><span>Subtotal:</span><span>${formatCurrency(invoice.subtotal)}</span></div>
            <div class="summary-row" style="color:#000;"><span>Tax (${settings.taxRate || 0}%):</span><span>${formatCurrency(invoice.tax)}</span></div>
            <div class="summary-row total" style="color:#000;">
                <span>${isPaid ? 'Amount Paid:' : 'Total Due:'}</span>
                <span>${formatCurrency(invoice.total)}</span>
            </div>
        </div>

        ${invoice.notes ? `
            <div style="margin-top:40px;">
                <h3 style="font-size:13px;text-transform:uppercase;color:#666;margin-bottom:10px;">Notes:</h3>
                <p style="line-height:1.8;">${escapeHtml(invoice.notes).replace(/\n/g, '<br>')}</p>
            </div>` : ''}

        ${!isPaid && (settings.bankName || settings.accountName || settings.accountNumber) ? `
            <div class="invoice-preview-footer">
                <div class="bank-details">
                    <h3>Payment Details:</h3>
                    ${settings.bankName ? `<p><strong>Bank:</strong> ${escapeHtml(settings.bankName)}</p>` : ''}
                    ${settings.accountName ? `<p><strong>Account Name:</strong> ${escapeHtml(settings.accountName)}</p>` : ''}
                    ${settings.accountNumber ? `<p><strong>Account Number:</strong> ${escapeHtml(settings.accountNumber)}</p>` : ''}
                    ${settings.routingNumber ? `<p><strong>Routing/Sort Code:</strong> ${escapeHtml(settings.routingNumber)}</p>` : ''}
                    ${settings.swiftCode ? `<p><strong>SWIFT/BIC:</strong> ${escapeHtml(settings.swiftCode)}</p>` : ''}
                    ${settings.iban ? `<p><strong>IBAN:</strong> ${escapeHtml(settings.iban)}</p>` : ''}
                </div>
            </div>` : ''}
            </div>
    `;

    document.getElementById('invoice-preview-container').innerHTML = html;
    document.getElementById('view-modal-title').textContent = docTitle;
}

function printInvoice() {
    window.print();
}

// ==================== ITEMS ====================

function addItem() {
    const container = document.getElementById('items-container');
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
        <div class="form-group">
            <input type="text" class="form-input item-description" placeholder="Description" required>
        </div>
        <div class="form-group">
            <input type="number" class="form-input item-quantity" placeholder="Qty" min="1" value="1" required>
        </div>
        <div class="form-group">
            <input type="number" class="form-input item-price" placeholder="Price" step="0.01" min="0" required>
        </div>
        <div class="form-group">
            <input type="number" class="form-input item-total" placeholder="Total" readonly>
        </div>
        <button type="button" class="remove-item-btn" onclick="removeItem(this)">×</button>`;
    container.appendChild(row);

    // Make first item remove button always hidden
    const firstRow = container.querySelector('.item-row:first-child .remove-item-btn');
    if (firstRow) firstRow.style.visibility = container.children.length === 1 ? 'hidden' : 'visible';
}

function removeItem(button) {
    const container = document.getElementById('items-container');
    if (container.children.length > 1) {
        button.closest('.item-row').remove();
        calculateInvoiceTotal();
    }
}

function calculateItemTotal(row) {
    const qty = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    row.querySelector('.item-total').value = (qty * price).toFixed(2);
}

function calculateInvoiceTotal() {
    const settings = getSettings();
    const taxRate = (settings.taxRate || 0) / 100;
    let subtotal = 0;

    document.querySelectorAll('.item-row').forEach(row => {
        const qty = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const total = qty * price;
        row.querySelector('.item-total').value = total.toFixed(2);
        subtotal += total;
    });

    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    const sym = getCurrencySymbol();

    document.getElementById('subtotal').textContent = `${sym}${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `${sym}${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `${sym}${total.toFixed(2)}`;

    const taxLabel = document.getElementById('tax-label');
    if (taxLabel) taxLabel.textContent = `Tax (${settings.taxRate || 0}%):`;
}

// ==================== SETTINGS ====================

function loadSettings() {
    const settings = getSettings();
    const logo = getLogo();

    document.getElementById('currency-select').value = settings.currency || 'NGN';
    document.getElementById('theme-select').value = settings.theme || 'dark';
    document.getElementById('tax-rate').value = settings.taxRate ?? 10;
    document.getElementById('date-format').value = settings.dateFormat || 'us';

    document.getElementById('company-name').value = settings.companyName || '';
    document.getElementById('company-address').value = settings.companyAddress || '';
    document.getElementById('company-email').value = settings.companyEmail || '';
    document.getElementById('company-phone').value = settings.companyPhone || '';
    document.getElementById('company-website').value = settings.companyWebsite || '';
    document.getElementById('company-tax-id').value = settings.companyTaxId || '';

    document.getElementById('bank-name').value = settings.bankName || '';
    document.getElementById('account-name').value = settings.accountName || '';
    document.getElementById('account-number').value = settings.accountNumber || '';
    document.getElementById('routing-number').value = settings.routingNumber || '';
    document.getElementById('swift-code').value = settings.swiftCode || '';
    document.getElementById('iban').value = settings.iban || '';

    const emailToggle = document.getElementById('collect-emails-toggle');
    if (emailToggle) {
        emailToggle.checked = settings.collectEmails || false;
        document.getElementById('email-settings-container').style.display = settings.collectEmails ? 'block' : 'none';
    }
    document.getElementById('email-consent-message').value = settings.emailConsentMessage || '';

    if (logo) {
        document.getElementById('logo-preview').innerHTML = `<img src="${logo}" alt="Logo">`;
    }

    updateEmailCount();
}

function saveSettings() {
    const currencySelect = document.getElementById('currency-select').value;
    const currencySymbols = {
        'NGN': '₦', 'USD': '$', 'EUR': '€', 'GBP': '£', 'ZAR': 'R',
        'KES': 'KSh', 'GHS': 'GH₵', 'XOF': 'CFA', 'JPY': '¥', 'CNY': '¥', 'INR': '₹'
    };

    const settings = {
        currency: currencySelect,
        currencySymbol: currencySymbols[currencySelect] || '₦',
        theme: document.getElementById('theme-select').value,
        taxRate: parseFloat(document.getElementById('tax-rate').value) || 0,
        dateFormat: document.getElementById('date-format').value,
        companyName: document.getElementById('company-name').value,
        companyAddress: document.getElementById('company-address').value,
        companyEmail: document.getElementById('company-email').value,
        companyPhone: document.getElementById('company-phone').value,
        companyWebsite: document.getElementById('company-website').value,
        companyTaxId: document.getElementById('company-tax-id').value,
        bankName: document.getElementById('bank-name').value,
        accountName: document.getElementById('account-name').value,
        accountNumber: document.getElementById('account-number').value,
        routingNumber: document.getElementById('routing-number').value,
        swiftCode: document.getElementById('swift-code').value,
        iban: document.getElementById('iban').value,
        footerCompanyName: 'GIT System Software',
        footerTagline: '',
        footerTermsUrl: '',
        footerPrivacyUrl: '',
        footerSupportUrl: '',
        collectEmails: document.getElementById('collect-emails-toggle').checked,
        emailConsentMessage: document.getElementById('email-consent-message').value
    };

    if (saveSettingsData(settings)) {
        applyTheme(settings.theme);
        showToast('Settings saved!');
    }
}

function applyTheme(theme) {
    const settings = getSettings();
    const t = theme || settings.theme || 'dark';
    document.body.classList.toggle('light-theme', t === 'light');
}

function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please upload an image file.'); return; }
    if (file.size > 2 * 1024 * 1024) { alert('File must be under 2MB.'); return; }

    const reader = new FileReader();
    reader.onload = function (e) {
        saveLogo(e.target.result);
        document.getElementById('logo-preview').innerHTML = `<img src="${e.target.result}" alt="Logo">`;
        showToast('Logo uploaded!');
    };
    reader.readAsDataURL(file);
}

function removeLogo() {
    if (!confirm('Remove company logo?')) return;
    localStorage.removeItem(STORAGE_KEYS.LOGO);
    document.getElementById('logo-preview').innerHTML = '<div class="logo-preview-empty">No logo uploaded</div>';
    document.getElementById('logo-input').value = '';
    showToast('Logo removed.');
}

// ==================== FOOTER (hardcoded) ====================

function renderFooter() {
    const year = new Date().getFullYear();
    const footerEl = document.getElementById('footer-content');
    if (!footerEl) return;
    footerEl.innerHTML = `
        <div>© ${year} GIT System Software. All rights reserved.</div>
        <div style="margin-top: 6px; display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
            <a href="https://gitsystem.com/terms" target="_blank" rel="noopener" style="color:var(--text-muted);text-decoration:none;">Terms of Service</a>
            <a href="https://gitsystem.com/privacy" target="_blank" rel="noopener" style="color:var(--text-muted);text-decoration:none;">Privacy Policy</a>
            <a href="https://gitsystem.com/support" target="_blank" rel="noopener" style="color:var(--text-muted);text-decoration:none;">Support</a>
        </div>
    `;
}

// ==================== CUSTOMERS ====================

function loadCustomers() {
    const customers = getCustomers().sort((a, b) => a.name.localeCompare(b.name));
    const container = document.getElementById('customers-container');

    if (customers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <div class="empty-title">No customers yet</div>
                <div class="empty-text">Add your first customer to get started</div>
            </div>`;
        return;
    }

    const invoices = getInvoices();
    container.innerHTML = `
        <table class="invoice-table">
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Invoices</th>
                    <th>Revenue</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${customers.map(c => {
                    const cInvoices = invoices.filter(inv => inv.customerName === c.name);
                    const revenue = cInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
                    return `
                        <tr>
                            <td><strong>${escapeHtml(c.name)}</strong></td>
                            <td>${c.email || '—'}</td>
                            <td>${c.phone || '—'}</td>
                            <td>${cInvoices.length}</td>
                            <td><strong>${formatCurrency(revenue)}</strong></td>
                            <td>
                                <button class="actions-btn" onclick="viewCustomer('${c.id}')" title="View">👁</button>
                                <button class="actions-btn" onclick="editCustomer('${c.id}')" title="Edit">✏️</button>
                                <button class="actions-btn" onclick="deleteCustomer('${c.id}')" title="Delete">🗑️</button>
                            </td>
                        </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

function filterCustomers() {
    const searchTerm = document.getElementById('customer-search-input').value.toLowerCase();
    let customers = getCustomers();

    if (searchTerm) {
        customers = customers.filter(c =>
            c.name.toLowerCase().includes(searchTerm) ||
            (c.email && c.email.toLowerCase().includes(searchTerm)) ||
            (c.phone && c.phone.includes(searchTerm))
        );
    }

    const container = document.getElementById('customers-container');
    if (customers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <div class="empty-title">No customers found</div>
                <div class="empty-text">Try adjusting your search</div>
            </div>`;
        return;
    }

    const invoices = getInvoices();
    customers.sort((a, b) => a.name.localeCompare(b.name));
    container.innerHTML = `
        <table class="invoice-table">
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Invoices</th>
                    <th>Revenue</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${customers.map(c => {
                    const cInvoices = invoices.filter(inv => inv.customerName === c.name);
                    const revenue = cInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
                    return `
                        <tr>
                            <td><strong>${escapeHtml(c.name)}</strong></td>
                            <td>${c.email || '—'}</td>
                            <td>${c.phone || '—'}</td>
                            <td>${cInvoices.length}</td>
                            <td><strong>${formatCurrency(revenue)}</strong></td>
                            <td>
                                <button class="actions-btn" onclick="viewCustomer('${c.id}')">👁</button>
                                <button class="actions-btn" onclick="editCustomer('${c.id}')">✏️</button>
                                <button class="actions-btn" onclick="deleteCustomer('${c.id}')">🗑️</button>
                            </td>
                        </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

function openCustomerModal() {
    currentCustomer = null;
    document.getElementById('customer-modal-title').textContent = 'Add New Customer';
    document.getElementById('customer-form').reset();
    document.getElementById('customer-modal').classList.add('active');
}

function closeCustomerModal() {
    document.getElementById('customer-modal').classList.remove('active');
    currentCustomer = null;
}

function saveCustomer() {

    const form = document.getElementById('customer-form');
    if(!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    if (isDemoMode() && !currentCustomer) {
        const remaining = getDemoCustomersRemaining();
        if (remaining <= 0) {
            const upgrade = confirm(
                'Demo Limit Reached\n\n' +
                'You\'ve added 2 customers (demo limit).\n\n' +
                'Purchase a license to add unlimited customers.\n\n' +
                'Buy now?'
            );
            if (upgrade) {
                window.open('https://gitsystem.gumroad.com/l/mefijo', '_blank');
            }
            return;
        }
    }
    const name = document.getElementById('customer-form-name').value.trim();
    if (!name) { alert('Customer name is required.'); return; }

    const customer = {
        id: currentCustomer ? currentCustomer.id : generateId(),
        name,
        email: document.getElementById('customer-form-email').value.trim(),
        phone: document.getElementById('customer-form-phone').value.trim(),
        address: document.getElementById('customer-form-address').value.trim(),
        notes: document.getElementById('customer-form-notes').value.trim(),
        createdAt: currentCustomer ? currentCustomer.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const customers = getCustomers();
    if (currentCustomer) {
        const idx = customers.findIndex(c => c.id === currentCustomer.id);
        if (idx !== -1) customers[idx] = customer;
    } else {
        customers.push(customer);
    }

    if (saveCustomers(customers)) {
        closeCustomerModal();
        loadCustomers();
        updateEmailCount();
        showToast('Customer saved!');
    }
}

function editCustomer(id) {
    const customer = getCustomers().find(c => c.id === id);
    if (!customer) return;

    currentCustomer = customer;
    document.getElementById('customer-modal-title').textContent = 'Edit Customer';
    document.getElementById('customer-form-name').value = customer.name;
    document.getElementById('customer-form-email').value = customer.email || '';
    document.getElementById('customer-form-phone').value = customer.phone || '';
    document.getElementById('customer-form-address').value = customer.address || '';
    document.getElementById('customer-form-notes').value = customer.notes || '';
    document.getElementById('customer-modal').classList.add('active');
}

function deleteCustomer(id) {
    if (!confirm('Delete this customer?')) return;
    const filtered = getCustomers().filter(c => c.id !== id);
    if (saveCustomers(filtered)) {
        loadCustomers();
        showToast('Customer deleted.');
    }
}

function viewCustomer(id) {
    const customer = getCustomers().find(c => c.id === id);
    if (!customer) return;

    const invoices = getInvoices().filter(inv => inv.customerName === customer.name);
    const revenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    alert(
        `👤 ${customer.name}\n` +
        `📧 ${customer.email || 'No email'}\n` +
        `📱 ${customer.phone || 'No phone'}\n` +
        `📄 ${invoices.length} invoice(s)\n` +
        `💰 ${formatCurrency(revenue)} total revenue` +
        (customer.notes ? `\n\nNotes: ${customer.notes}` : '')
    );
}

// ==================== EMAIL MARKETING ====================

function updateEmailCount() {
    const count = getCustomers().filter(c => c.email && c.email.trim()).length;
    const el = document.getElementById('email-count');
    if (el) el.textContent = count;
}

function viewEmailList() {
    const settings = getSettings();
    if (!settings.collectEmails) {
        alert('Enable email collection in Settings first.');
        return;
    }

    const customers = getCustomers().filter(c => c.email && c.email.trim());
    const container = document.getElementById('email-list-container');

    if (customers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📧</div>
                <div class="empty-title">No emails collected yet</div>
                <div class="empty-text">Add customers with email addresses to see them here</div>
            </div>`;
    } else {
        container.innerHTML = `
            <table class="invoice-table">
                <thead>
                    <tr><th>Name</th><th>Email</th><th>Phone</th><th>Added</th></tr>
                </thead>
                <tbody>
                    ${customers.map(c => `
                        <tr>
                            <td><strong>${escapeHtml(c.name)}</strong></td>
                            <td>${escapeHtml(c.email)}</td>
                            <td>${c.phone || '—'}</td>
                            <td>${formatDate(c.createdAt)}</td>
                        </tr>`).join('')}
                </tbody>
            </table>`;
    }

    document.getElementById('email-list-modal').classList.add('active');
}

function closeEmailListModal() {
    document.getElementById('email-list-modal').classList.remove('active');
}

function exportEmailList() {
    const customers = getCustomers().filter(c => c.email && c.email.trim());
    if (customers.length === 0) { alert('No emails to export.'); return; }

    let csv = 'Name,Email,Phone,Address,Added\n';
    customers.forEach(c => {
        const addr = (c.address || '').replace(/\n/g, ' ').replace(/"/g, '""');
        csv += `"${c.name}","${c.email}","${c.phone || ''}","${addr}","${formatDate(c.createdAt)}"\n`;
    });

    downloadFile(csv, `email-list-${today()}.csv`, 'text/csv');
    showToast(`Exported ${customers.length} emails.`);
}

// ==================== REPORTS ====================

function loadReports() {
    const invoices = getInvoices();
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const paid = invoices.filter(inv => inv.status === 'paid');
    const paidRevenue = paid.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const avg = invoices.length > 0 ? totalRevenue / invoices.length : 0;
    const collectionRate = invoices.length > 0 ? (paid.length / invoices.length * 100) : 0;
    const activeCustomers = new Set(invoices.map(inv => inv.customerName)).size;

    document.getElementById('report-total-revenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('report-avg-invoice').textContent = formatCurrency(avg);
    document.getElementById('report-collection-rate').textContent = `${collectionRate.toFixed(1)}%`;
    document.getElementById('report-active-customers').textContent = activeCustomers;

    loadRevenueChart(invoices);
    loadStatusChart(invoices);
    loadTopCustomers(invoices);
}

function loadRevenueChart(invoices) {
    const ctx = document.getElementById('revenue-chart');
    if (!ctx) return;

    const monthlyRevenue = {};
    const months = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months.push(d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        monthlyRevenue[key] = 0;
    }

    invoices.forEach(inv => {
        const d = new Date(inv.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyRevenue.hasOwnProperty(key)) monthlyRevenue[key] += inv.total || 0;
    });

    if (revenueChart) revenueChart.destroy();

    const settings = getSettings();
    const sym = settings.currencySymbol || '₦';

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Revenue',
                data: Object.values(monthlyRevenue),
                borderColor: '#ff6b35',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#ff6b35',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${sym}${Number(ctx.raw).toLocaleString('en', { minimumFractionDigits: 2 })}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grace: '10%',
                    ticks: {
                        maxTicksLimit: 6,
                        callback: v => {
                            if (v >= 1_000_000) return `${sym}${(v / 1_000_000).toFixed(1)}M`;
                            if (v >= 1_000)     return `${sym}${(v / 1_000).toFixed(0)}K`;
                            return `${sym}${v}`;
                        }
                    }
                },
                x: {
                    ticks: { maxRotation: 0 }
                }
            }
        }
    });
}

function loadStatusChart(invoices) {
    const ctx = document.getElementById('status-chart');
    if (!ctx) return;

    if (statusChart) statusChart.destroy();

    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Paid', 'Pending', 'Overdue'],
            datasets: [{
                data: [
                    invoices.filter(inv => inv.status === 'paid').length,
                    invoices.filter(inv => inv.status === 'pending').length,
                    invoices.filter(inv => inv.status === 'overdue').length
                ],
                backgroundColor: [
                    'rgba(0, 186, 136, 0.8)',
                    'rgba(255, 165, 0, 0.8)',
                    'rgba(249, 24, 128, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function loadTopCustomers(invoices) {
    const container = document.getElementById('top-customers-container');
    const customerRevenue = {};

    invoices.forEach(inv => {
        if (!customerRevenue[inv.customerName]) {
            customerRevenue[inv.customerName] = { name: inv.customerName, total: 0, count: 0 };
        }
        customerRevenue[inv.customerName].total += inv.total || 0;
        customerRevenue[inv.customerName].count++;
    });

    const top = Object.values(customerRevenue).sort((a, b) => b.total - a.total).slice(0, 5);

    if (top.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <div class="empty-title">No data yet</div>
                <div class="empty-text">Create invoices to see top customers</div>
            </div>`;
        return;
    }

    container.innerHTML = `
        <table class="invoice-table">
            <thead>
                <tr><th>Customer</th><th>Invoices</th><th>Revenue</th></tr>
            </thead>
            <tbody>
                ${top.map(c => `
                    <tr>
                        <td><strong>${escapeHtml(c.name)}</strong></td>
                        <td>${c.count}</td>
                        <td><strong>${formatCurrency(c.total)}</strong></td>
                    </tr>`).join('')}
            </tbody>
        </table>`;
}

function exportReportData() {
    const invoices = getInvoices();
    let csv = 'Invoice Number,Customer,Date,Due Date,Subtotal,Tax,Total,Status\n';
    invoices.forEach(inv => {
        csv += `"${inv.number}","${inv.customerName}","${inv.date}","${inv.dueDate}","${inv.subtotal || 0}","${inv.tax || 0}","${inv.total}","${inv.status}"\n`;
    });
    downloadFile(csv, `invoHub-report-${today()}.csv`, 'text/csv');
    showToast('Report exported!');
}

// ==================== DATA BACKUP / RESTORE ====================

function exportData() {
    const data = {
        invoices: getInvoices(),
        customers: getCustomers(),
        settings: getSettings(),
        logo: getLogo(),
        exportDate: new Date().toISOString(),
        version: '4.0'
    };
    downloadFile(JSON.stringify(data, null, 2), `invoHub-backup-${today()}.json`, 'application/json');
    showToast('Backup downloaded!');
}

function importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!confirm(`This will merge ${data.invoices?.length || 0} invoices and ${data.customers?.length || 0} customers into your current data. Continue?`)) return;

            if (data.invoices) saveInvoices(data.invoices);
            if (data.customers) saveCustomers(data.customers);
            if (data.settings) saveSettingsData(data.settings);
            if (data.logo) saveLogo(data.logo);

            // Resync the sequential counter to the highest invoice number in restored data
            if (data.invoices && data.invoices.length > 0) {
                syncCounterToInvoices(data.invoices);
            }

            loadSettings();
            loadInvoices();
            updateDashboard();
            loadCustomers();
            applyTheme();
            renderFooter();
            showToast('Backup restored successfully!');
        } catch (err) {
            alert('Failed to restore backup. Please check the file is a valid invoHub backup.');
        }
    };
    reader.readAsText(file);
}

// ==================== UTILITY FUNCTIONS ====================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString + 'T00:00:00'); // avoid timezone shifts
    const settings = getSettings();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    switch (settings.dateFormat || 'us') {
        case 'eu': return `${day}/${month}/${year}`;
        case 'iso': return `${year}-${month}-${day}`;
        default: return `${month}/${day}/${year}`;
    }
}

function formatCurrency(amount) {
    const settings = getSettings();
    const currency = settings.currency || 'NGN';
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency', currency,
            minimumFractionDigits: 2
        }).format(Number(amount) || 0);
    } catch {
        return `${settings.currencySymbol || '₦'}${(Number(amount) || 0).toFixed(2)}`;
    }
}

function getCurrencySymbol() {
    return getSettings().currencySymbol || '₦';
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function today() {
    return new Date().toISOString().split('T')[0];
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function showToast(message) {
    // Simple toast notification
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.style.cssText = `
            position: fixed; bottom: 80px; right: 24px; z-index: 9998;
            background: var(--success); color: white;
            padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            transition: opacity 0.3s; pointer-events: none;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}
