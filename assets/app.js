// ============================================
// MINEGUARD - WORKPLACE HAZARD REPORTING SYSTEM
// Main Application JavaScript
// ============================================

// Global state management
const app = {
    currentUser: null,
    reports: [],
    users: [],
    notifications: [],
    notificationCheckInterval: null,
    reportsRefreshInterval: null,
    isNavigating: false,
    apiUrl: window.MINEGUARD_API_URL || (() => {
        // In production, API is same origin. In development, use localhost
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3001/api';
        }
        // Production: same origin
        return window.location.origin + '/api';
    })(),
    currentSection: 'home',
    eventListeners: {} // Simple pub/sub system for real-time updates
};

// ============================================
// EVENT SYSTEM FOR REAL-TIME UPDATES
// ============================================

function addEventListener(eventName, callback) {
    if (!app.eventListeners[eventName]) {
        app.eventListeners[eventName] = [];
    }
    app.eventListeners[eventName].push(callback);
    console.log(`📡 Event listener registered for: ${eventName}`);
}

function removeEventListener(eventName, callback) {
    if (app.eventListeners[eventName]) {
        app.eventListeners[eventName] = app.eventListeners[eventName].filter(cb => cb !== callback);
    }
}

function dispatchEvent(eventName, data) {
    console.log(`🎯 Dispatching event: ${eventName}`, data);
    if (app.eventListeners[eventName]) {
        app.eventListeners[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${eventName}:`, error);
            }
        });
    }
}

console.log('🚀 MineGuard App Initializing');
console.log('📍 API URL:', app.apiUrl);
console.log('🌐 Current origin:', window.location.origin);

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadInitialData();
    
    // Handle hash changes (browser back/forward)
    window.addEventListener('hashchange', () => {
        if (app.isNavigating) {
            console.log('⏭️ Skipping hashchange - already navigating');
            return;
        }
        const hash = window.location.hash.substring(1) || 'home';
        console.log('🔗 Hash changed to:', hash);
        navigateToSection(hash);
    });
});

function initializeApp() {
    // Check if user is logged in
    const user = localStorage.getItem('currentUser');
    if (user) {
        try {
            app.currentUser = JSON.parse(user);
            updateUIForLoggedInUser();
            // Start polling for updates
            startNotificationPolling();
            startReportsPolling();
        } catch (e) {
            console.error('Error parsing stored user:', e);
            localStorage.removeItem('currentUser');
        }
    }

    // Set initial section based on URL hash, fallback to home
    const initialSection = window.location.hash.substring(1) || 'home';
    console.log('🔗 Initial section from URL hash:', initialSection);
    navigateToSection(initialSection);
}

function setupEventListeners() {
    // Hamburger menu
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navbarMenu = document.getElementById('navbarMenu');

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('active');
            navbarMenu.classList.toggle('active');
        });
    }

    // Notification button
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationPanel = document.getElementById('notificationPanel');

    if (notificationBtn && notificationPanel) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationPanel.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            notificationPanel.classList.remove('active');
        });
    }

    // Modal outside click to close
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// ============================================
// NAVIGATION & SECTIONS
// ============================================

function navigateToSection(sectionId) {
    console.log(`🔄 Navigating to section: ${sectionId}`);
    console.log(`📌 Current hash: ${window.location.hash}, Current user:`, app.currentUser);
    
    // Set flag to prevent recursion
    app.isNavigating = true;
    
    // Track current section
    app.currentSection = sectionId;
    console.log(`📍 Current section set to: ${sectionId}`);
    
    // PRIORITY: Update URL hash FIRST to preserve route on refresh
    const currentHash = window.location.hash.substring(1);
    if (currentHash !== sectionId) {
        window.location.hash = sectionId;
        console.log(`✅ Hash updated: #${currentHash} → #${sectionId} | Current URL:`, window.location.href);
    } else {
        console.log(`⏭️ Hash already set to #${sectionId}`);
    }
    
    // Hide all sections
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(section => section.classList.remove('active'));

    // Update navigation menu active state - find all navbar links and remove active
    const allNavLinks = document.querySelectorAll('.navbar-link');
    console.log(`📍 Found ${allNavLinks.length} navbar links`);
    
    allNavLinks.forEach(link => {
        link.classList.remove('active');
        // Check if this link's onclick matches the section we're navigating to
        const onclickText = link.getAttribute('onclick') || '';
        if (onclickText.includes(`navigateToSection('${sectionId}')`)) {
            link.classList.add('active');
            console.log(`✨ Set active on link: ${link.textContent.trim()}`);
        }
    });

    // Show selected section
    const section = document.getElementById(sectionId + 'Section');
    if (section) {
        section.classList.add('active');

        // Close mobile menu
        const hamburger = document.getElementById('hamburgerBtn');
        const menu = document.getElementById('navbarMenu');
        if (hamburger && menu) {
            hamburger.classList.remove('active');
            menu.classList.remove('active');
        }

        // 🧹 Clean up event listeners from previous sections
        if (app.dashboardUpdateListener) {
            console.log('🧹 Removing dashboard update listener');
            removeEventListener('reportStatusUpdated', app.dashboardUpdateListener);
            app.dashboardUpdateListener = null;
        }
        if (app.adminDashboardListener) {
            console.log('🧹 Removing admin dashboard update listener');
            removeEventListener('reportStatusUpdated', app.adminDashboardListener);
            app.adminDashboardListener = null;
        }

        // Load section-specific data
        if (sectionId === 'dashboard') {
            loadDashboard();
        } else if (sectionId === 'profile') {
            if (!app.currentUser) {
                console.log('⚠️ Redirecting to home: User not logged in for profile');
                app.isNavigating = false;
                navigateToSection('home');
                showNotification('Please login to view your profile', 'info');
                return;
            }
            loadProfile();
        } else if (sectionId === 'admin') {
            const isAdmin = isUserAdmin();
            console.log(`🔐 Admin check: isUserAdmin=${isAdmin}, currentUser=`, app.currentUser);
            if (!isAdmin) {
                console.log('⚠️ Redirecting to home: User is not admin');
                app.isNavigating = false;
                navigateToSection('home');
                showNotification('Access denied', 'error');
                return;
            }
            console.log('✅ User is admin, loading admin dashboard');
            loadAdminDashboard();
        }

        // Scroll to top
        window.scrollTo(0, 0);
    } else {
        console.log(`⚠️ Section element not found: ${sectionId}Section`);
    }
    
    // Clear flag after navigation completes
    setTimeout(() => {
        app.isNavigating = false;
        console.log(`✅ Navigation flag cleared for section: ${sectionId}`);
    }, 100);
}

function scrollToFeatures() {
    const featuresSection = document.getElementById('featuresSection');
    if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// ============================================
// AUTHENTICATION
// ============================================

function showAuthModal(formType) {
    const modal = document.getElementById('authModal');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (formType === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
    }

    modal.classList.add('active');
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('active');
}

function switchAuthForm(formType) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (formType === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    console.log('🔐 Login attempt:', { email, apiUrl: app.apiUrl });

    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    try {
        const loginUrl = `${app.apiUrl}/users/login`;
        console.log('📡 Fetching:', loginUrl);
        
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        console.log('📊 Response status:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('📨 Response data:', data);

        if (!response.ok) {
            console.error('❌ Login failed:', data.message);
            showNotification(data.message || 'Login failed', 'error');
            return;
        }

        app.currentUser = data.user;
        localStorage.setItem('currentUser', JSON.stringify(data.user));

        console.log('✅ Login successful!');
        showNotification('Login successful!', 'success');
        closeAuthModal();
        updateUIForLoggedInUser();
        startNotificationPolling();
        startReportsPolling();
        navigateToSection('dashboard');

        // Reset form
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
    } catch (error) {
        console.error('❌ Login error:', error);
        console.error('Error details:', error.message, error.stack);
        showNotification('Login failed. Please try again. Check console (F12) for details.', 'error');
    }
}

async function handleSignup(event) {
    event.preventDefault();

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const department = document.getElementById('signupDept').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    console.log('📝 Signup attempt:', { name, email, department, apiUrl: app.apiUrl });

    if (!name || !email || !password || !confirmPassword) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        const signupUrl = `${app.apiUrl}/users`;
        console.log('📡 Fetching:', signupUrl);
        
        const response = await fetch(signupUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, department, password })
        });

        console.log('📊 Response status:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('📨 Response data:', data);

        if (!response.ok) {
            console.error('❌ Signup failed:', data.message);
            showNotification(data.message || 'Signup failed', 'error');
            return;
        }

        app.currentUser = data.user;
        localStorage.setItem('currentUser', JSON.stringify(data.user));

        console.log('✅ Signup successful!');
        showNotification('Account created successfully!', 'success');
        closeAuthModal();
        updateUIForLoggedInUser();
        startNotificationPolling();
        startReportsPolling();
        navigateToSection('dashboard');

        // Reset form
        document.getElementById('signupName').value = '';
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupDept').value = '';
        document.getElementById('signupPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    } catch (error) {
        console.error('❌ Signup error:', error);
        console.error('Error details:', error.message, error.stack);
        showNotification('Signup failed. Please try again. Check console (F12) for details.', 'error');
    }
}

function handleLogout() {
    app.currentUser = null;
    localStorage.removeItem('currentUser');
    stopNotificationPolling();
    stopReportsPolling();
    updateUIForLoggedInUser();
    navigateToSection('home');
    showNotification('Logged out successfully', 'success');
}

function updateUIForLoggedInUser() {
    const authLinks = document.getElementById('authLinks');
    const userLinks = document.getElementById('userLinks');
    const notificationContainer = document.querySelector('.notification-container');
    const adminLink = document.getElementById('adminLink');
    const ctaSection = document.getElementById('ctaSection');

    console.log('🔄 Updating UI for logged in user:', { hasCurrentUser: !!app.currentUser, authLinks, userLinks, adminLink });

    if (app.currentUser) {
        if (authLinks) authLinks.style.display = 'none';
        if (userLinks) userLinks.style.display = 'flex';
        if (notificationContainer) notificationContainer.style.display = 'flex';
        if (ctaSection) ctaSection.style.display = 'none';

        // Show admin link if user is admin
        if (isUserAdmin() && adminLink) {
            adminLink.style.display = 'block';
        }
    } else {
        if (authLinks) authLinks.style.display = 'flex';
        if (userLinks) userLinks.style.display = 'none';
        if (notificationContainer) notificationContainer.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        if (ctaSection) ctaSection.style.display = 'block';
    }
}

function isUserAdmin() {
    return app.currentUser && app.currentUser.role === 'admin';
}

// ============================================
// HAZARD REPORTING
// ============================================

async function handleHazardReport(event) {
    event.preventDefault();
    console.log('📝 Hazard report submission started');

    if (!app.currentUser) {
        console.log('⚠️ User not logged in');
        showNotification('Please login to submit a report', 'info');
        showAuthModal('login');
        return;
    }

    const formData = {
        hazardType: document.getElementById('hazardType').value,
        severity: document.getElementById('severity').value,
        location: document.getElementById('location').value,
        description: document.getElementById('description').value,
        affectedPeople: parseInt(document.getElementById('affectedPeople').value) || 0,
        immediateAction: document.getElementById('immediateAction').value,
        userId: app.currentUser.id,
        submittedDate: new Date().toISOString(),
        status: 'pending'
    };

    console.log('📋 Form data:', formData);

    try {
        const response = await fetch(`${app.apiUrl}/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        console.log('📊 Response status:', response.status);
        const data = await response.json();
        console.log('📨 Response data:', data);

        if (!response.ok) {
            console.error('❌ Report submission failed:', data.message);
            showNotification(data.message || 'Failed to submit report', 'error');
            return;
        }

        console.log('✅ Report submitted successfully!', data);
        showNotification('✅ Your hazard report has been submitted successfully!', 'success');
        document.getElementById('hazardForm').reset();
        console.log('🔄 Form reset complete, staying on report section');
    } catch (error) {
        console.error('❌ Report submission error:', error);
        showNotification('Failed to submit report. Please try again.', 'error');
    }
}

// ============================================
// DASHBOARD
// ============================================

async function loadDashboard() {
    console.log('📊 loadDashboard called');
    console.log('👤 Current user:', app.currentUser);
    
    if (!app.currentUser) {
        console.log('❌ No current user in loadDashboard, redirecting to home');
        navigateToSection('home');
        return;
    }

    console.log('✅ User exists, loading dashboard data');
    try {
        const response = await fetch(`${app.apiUrl}/reports?userId=${app.currentUser.id}`);
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        const reports = await response.json();
        app.reports = Array.isArray(reports) ? reports : [];

        updateDashboardStats();
        updateReportsTable();
        
        // 📡 Set up event listener for dashboard real-time updates
        console.log('📡 Setting up event listener for user dashboard');
        const dashboardUpdateListener = (data) => {
            console.log('🔄 Dashboard detected status update:', data);
            // Find and update the report in the list
            const reportIndex = app.reports.findIndex(r => r.id === data.reportId);
            if (reportIndex >= 0) {
                app.reports[reportIndex] = data.updatedReport;
                console.log('✅ Updated report in dashboard at index:', reportIndex);
            }
            // Refresh dashboard views
            updateDashboardStats();
            updateReportsTable();
            console.log('✅ Dashboard UI refreshed');
        };
        
        app.dashboardUpdateListener = dashboardUpdateListener;
        addEventListener('reportStatusUpdated', dashboardUpdateListener);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        // Only show error if it's not a network/CORS issue
        if (error.message && !error.message.includes('Failed to fetch')) {
            // For network errors, just use empty reports
            app.reports = [];
            updateDashboardStats();
            updateReportsTable();
        }
    }
}

function updateDashboardStats() {
    const total = app.reports.length;
    const pending = app.reports.filter(r => r.status === 'pending').length;
    const resolved = app.reports.filter(r => r.status === 'resolved').length;
    const critical = app.reports.filter(r => r.severity === 'critical').length;

    document.getElementById('totalReports').textContent = total;
    document.getElementById('pendingReports').textContent = pending;
    document.getElementById('resolvedReports').textContent = resolved;
    document.getElementById('criticalReports').textContent = critical;
}

function updateReportsTable() {
    const tbody = document.getElementById('reportsTableBody');
    console.log('🖼️ updateReportsTable called, tbody element:', !!tbody);
    console.log('📋 Reports to render:', app.reports.length, app.reports.map(r => ({ id: r.id.substring(0, 8), status: r.status })));

    if (!tbody) {
        console.error('❌ reportsTableBody element not found!');
        return;
    }

    if (app.reports.length === 0) {
        console.log('ℹ️ No reports to display');
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No reports yet</td></tr>';
        return;
    }

    const html = app.reports.map(report => {
        console.log(`📝 Rendering report ${report.id.substring(0, 8)}: status=${report.status}`);
        return `
        <tr>
            <td>#${report.id.substring(0, 8)}</td>
            <td>${formatType(report.hazardType)}</td>
            <td><span class="severity-badge severity-${report.severity}">${report.severity}</span></td>
            <td>${report.location}</td>
            <td><span class="status-badge status-${report.status.toLowerCase()}">${report.status.toUpperCase()}</span></td>
            <td>${formatDate(report.submittedDate)}</td>
            <td>
                <button class="btn btn-small" onclick="viewReportDetails('${report.id}')">View</button>
            </td>
        </tr>
    `;
    }).join('');
    
    tbody.innerHTML = html;
    console.log('✅ Table HTML updated in DOM');
}

// ============================================
// REPORT DETAILS
// ============================================

async function viewReportDetails(reportId) {
    try {
        const response = await fetch(`${app.apiUrl}/reports/${reportId}`);
        const report = await response.json();

        const modal = document.getElementById('reportModal');
        const content = document.getElementById('reportModalContent');

        content.innerHTML = `
            <h2>Report Details</h2>
            <div class="report-details">
                <div class="detail-row">
                    <label>Report ID:</label>
                    <p>#${report.id.substring(0, 8)}</p>
                </div>
                <div class="detail-row">
                    <label>Hazard Type:</label>
                    <p>${formatType(report.hazardType)}</p>
                </div>
                <div class="detail-row">
                    <label>Severity:</label>
                    <p><span class="severity-badge severity-${report.severity}">${report.severity}</span></p>
                </div>
                <div class="detail-row">
                    <label>Location:</label>
                    <p>${report.location}</p>
                </div>
                <div class="detail-row">
                    <label>Status:</label>
                    <p><span class="status-badge status-${report.status}">${report.status}</span></p>
                </div>
                <div class="detail-row">
                    <label>Description:</label>
                    <p>${report.description}</p>
                </div>
                <div class="detail-row">
                    <label>Affected People:</label>
                    <p>${report.affectedPeople || 'Not specified'}</p>
                </div>
                <div class="detail-row">
                    <label>Immediate Action:</label>
                    <p>${report.immediateAction || 'None specified'}</p>
                </div>
                <div class="detail-row">
                    <label>Submitted:</label>
                    <p>${formatDatetime(report.submittedDate)}</p>
                </div>
                ${isUserAdmin() ? `
                    <div class="admin-actions">
                        <select id="statusUpdate" onchange="updateReportStatus('${report.id}', this.value)">
                            <option value="">Change Status</option>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                ` : ''}
            </div>
        `;

        modal.classList.add('active');
        
        // 📡 Set up event listener for real-time updates in the modal
        console.log(`📡 Setting up event listener for report ${reportId.substring(0, 8)}`);
        const refreshModalListener = async (data) => {
            if (data.reportId === reportId) {
                console.log(`🔄 Modal event detected for report ${reportId.substring(0, 8)}, refreshing modal content...`);
                // Fetch the latest report data
                try {
                    const updatedResponse = await fetch(`${app.apiUrl}/reports/${reportId}`);
                    const updatedReport = await updatedResponse.json();
                    
                    // Update only the status badge without closing the modal
                    const statusBadge = content.querySelector('[class*="status-badge"]');
                    if (statusBadge) {
                        statusBadge.textContent = updatedReport.status;
                        statusBadge.className = `status-badge status-${updatedReport.status}`;
                        console.log(`✅ Modal status badge updated to: ${updatedReport.status}`);
                    }
                } catch (error) {
                    console.error('Error refreshing modal:', error);
                }
            }
        };
        
        // Store the listener on the modal element so we can remove it later
        modal.reportRefreshListener = refreshModalListener;
        addEventListener('reportStatusUpdated', refreshModalListener);
        
    } catch (error) {
        console.error('Error loading report details:', error);
        showNotification('Failed to load report details', 'error');
    }
}

async function updateReportStatus(reportId, newStatus) {
    console.log('🔄 updateReportStatus called with:', { reportId, newStatus });
    console.log('📋 Current reports in memory:', app.reports.length, app.reports.map(r => ({ id: r.id, status: r.status })));
    
    if (!newStatus) {
        console.log('⚠️ No status provided, returning');
        return;
    }

    try {
        // Temporarily stop polling to prevent interference
        console.log('⏸️ Temporarily stopping reports polling...');
        if (app.reportsRefreshInterval) {
            clearInterval(app.reportsRefreshInterval);
        }

        console.log('📡 Sending PUT request to update status');
        const response = await fetch(`${app.apiUrl}/reports/${reportId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        console.log('📊 Response status:', response.status);

        if (!response.ok) {
            console.error('❌ Update failed with status:', response.status);
            showNotification('Failed to update report status', 'error');
            startReportsPolling();
            return;
        }

        // Immediately close modal first
        closeReportModal();
        
        // Immediately fetch the updated report from server
        console.log('🔄 Fetching updated report from server...');
        const reportResponse = await fetch(`${app.apiUrl}/reports/${reportId}`);
        if (reportResponse.ok) {
            const updatedReport = await reportResponse.json();
            console.log('📥 Got updated report from server:', updatedReport);
            
            // Find and replace the report in local array
            const reportIndex = app.reports.findIndex(r => r.id === reportId);
            console.log('🔍 Found report at index:', reportIndex);
            
            if (reportIndex >= 0) {
                app.reports[reportIndex] = updatedReport;
                console.log('✅ Updated report in local array at index:', reportIndex);
                console.log('📊 Updated report now has status:', app.reports[reportIndex].status);
            } else {
                console.warn('⚠️ Report not found in local array, adding it:', reportId);
                app.reports.push(updatedReport);
            }
            
            // 🎯 DISPATCH EVENT for real-time synchronization
            console.log('📡 Dispatching reportStatusUpdated event...');
            dispatchEvent('reportStatusUpdated', {
                reportId: reportId,
                newStatus: newStatus,
                updatedReport: updatedReport
            });
            
            // Update UI immediately
            console.log('🎨 Updating dashboard and table...');
            updateDashboardStats();
            updateReportsTable();
            updateAdminStats();
            loadAdminReports();
            console.log('✅ UI updated');
        }
        
        const statusLabel = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        console.log(`✅ Report status updated to: ${statusLabel}`);
        showNotification(`✅ Report status changed to: ${statusLabel}`, 'success');
        
        // Restart polling after a brief delay
        console.log('▶️ Restarting reports polling...');
        setTimeout(() => {
            startReportsPolling();
        }, 1000);
    } catch (error) {
        console.error('❌ Error updating report:', error);
        showNotification('Failed to update report', 'error');
        startReportsPolling();
    }
}

function closeReportModal() {
    const modal = document.getElementById('reportModal');
    
    // 📡 Clean up event listener when modal closes
    if (modal.reportRefreshListener) {
        console.log('🧹 Removing report refresh event listener');
        removeEventListener('reportStatusUpdated', modal.reportRefreshListener);
        modal.reportRefreshListener = null;
    }
    
    modal.classList.remove('active');
}

// ============================================
// PROFILE
// ============================================

async function loadProfile() {
    if (!app.currentUser) {
        console.log('⚠️ No current user found, redirecting to home');
        navigateToSection('home');
        return;
    }

    console.log('📋 Loading profile for:', app.currentUser);
    console.log('👤 User data:', {
        name: app.currentUser.name,
        email: app.currentUser.email,
        department: app.currentUser.department,
        role: app.currentUser.role,
        id: app.currentUser.id
    });

    // Update profile information
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileDept = document.getElementById('profileDept');
    const profileStatus = document.getElementById('profileStatus');

    console.log('🔍 Found elements:', {
        profileName: !!profileName,
        profileEmail: !!profileEmail,
        profileDept: !!profileDept,
        profileStatus: !!profileStatus
    });

    if (profileName) {
        profileName.textContent = app.currentUser.name || '-';
        console.log('✅ Set name to:', profileName.textContent);
    } else {
        console.error('❌ profileName element not found');
    }

    if (profileEmail) {
        profileEmail.textContent = app.currentUser.email || '-';
        console.log('✅ Set email to:', profileEmail.textContent);
    } else {
        console.error('❌ profileEmail element not found');
    }

    if (profileDept) {
        profileDept.textContent = app.currentUser.department || '-';
        console.log('✅ Set department to:', profileDept.textContent);
    } else {
        console.error('❌ profileDept element not found');
    }

    if (profileStatus) {
        const statusText = app.currentUser.role === 'admin' ? 'Administrator' : 'User';
        profileStatus.textContent = statusText;
        console.log('✅ Set status to:', profileStatus.textContent);
    } else {
        console.error('❌ profileStatus element not found');
    }

    console.log('✅ Profile information updated');

    // Load user's reports
    try {
        console.log('📡 Fetching reports for user:', app.currentUser.id);
        const response = await fetch(`${app.apiUrl}/reports?userId=${app.currentUser.id}`);
        console.log('📊 Reports response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        const reports = await response.json();
        console.log('📊 Reports loaded:', reports);
        console.log('📈 Number of reports:', Array.isArray(reports) ? reports.length : 0);

        const reportsContainer = document.getElementById('myReports');
        if (!reportsContainer) {
            console.error('❌ myReports container not found');
            return;
        }

        if (!reports || reports.length === 0) {
            reportsContainer.innerHTML = '<p class="empty-message">No reports submitted yet</p>';
            console.log('📭 No reports, showing empty message');
        } else {
            reportsContainer.innerHTML = reports.map(report => `
                <div class="report-item">
                    <h4>#${report.id.substring(0, 8)} - ${formatType(report.hazardType)}</h4>
                    <p>Severity: <span class="severity-badge severity-${report.severity}">${report.severity}</span></p>
                    <p>Status: <span class="status-badge status-${report.status}">${report.status}</span></p>
                    <p>Location: ${report.location}</p>
                    <p>Submitted: ${formatDate(report.submittedDate)}</p>
                </div>
            `).join('');
            console.log('📋 Rendered', reports.length, 'reports');
        }
        console.log('✅ Profile reports loaded successfully');
    } catch (error) {
        console.error('❌ Error loading user reports:', error);
        console.error('Error details:', error.message);
        const reportsContainer = document.getElementById('myReports');
        if (reportsContainer) {
            reportsContainer.innerHTML = '<p class="empty-message">No reports submitted yet</p>';
        }
    }

    // Populate edit form with current values
    const editName = document.getElementById('editName');
    const editDept = document.getElementById('editDept');
    if (editName) editName.value = app.currentUser.name || '';
    if (editDept) editDept.value = app.currentUser.department || '';
}

function toggleEditProfile() {
    console.log('✏️ Toggling edit profile mode');
    const viewMode = document.getElementById('profileViewMode');
    const editMode = document.getElementById('profileEditMode');
    const editBtn = document.getElementById('editProfileBtn');
    
    if (viewMode && editMode) {
        if (editMode.style.display === 'none') {
            // Switch to edit mode
            viewMode.style.display = 'none';
            editMode.style.display = 'block';
            editBtn.textContent = 'Cancel';
            console.log('✅ Edit mode activated');
        } else {
            // Switch to view mode
            viewMode.style.display = 'block';
            editMode.style.display = 'none';
            editBtn.textContent = 'Edit';
            console.log('✅ View mode activated');
        }
    }
}

async function saveProfileChanges() {
    console.log('💾 Saving profile changes');
    
    const name = document.getElementById('editName').value;
    const department = document.getElementById('editDept').value;
    const password = document.getElementById('editPassword').value;

    if (!name || name.trim() === '') {
        showNotification('Name is required', 'error');
        return;
    }

    if (password && password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        const updateData = {
            name: name.trim(),
            department: department.trim() || null
        };

        if (password) {
            updateData.password = password;
        }

        console.log('📡 Sending update request:', updateData);
        const response = await fetch(`${app.apiUrl}/users/${app.currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        console.log('📊 Update response status:', response.status);
        const data = await response.json();
        console.log('📨 Response data:', data);

        if (!response.ok) {
            console.error('❌ Update failed:', data.message);
            showNotification(data.message || 'Failed to update profile', 'error');
            return;
        }

        // Update local user data
        app.currentUser.name = data.user.name;
        app.currentUser.department = data.user.department;
        localStorage.setItem('currentUser', JSON.stringify(app.currentUser));

        console.log('✅ Profile updated successfully');
        showNotification('✅ Profile updated successfully!', 'success');
        
        // Reload profile and switch to view mode
        await loadProfile();
        toggleEditProfile();
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        showNotification('Failed to update profile. Please try again.', 'error');
    }
}

// ============================================
// ADMIN DASHBOARD
// ============================================

async function loadAdminDashboard() {
    if (!isUserAdmin()) {
        navigateToSection('home');
        return;
    }

    try {
        // Load all reports
        const reportsResponse = await fetch(`${app.apiUrl}/reports`);
        app.reports = await reportsResponse.json();

        // Load all users
        const usersResponse = await fetch(`${app.apiUrl}/users`);
        app.users = await usersResponse.json();

        updateAdminStats();
        loadAdminReports();
        loadAdminUsers();
        
        // 📡 Set up event listener for admin dashboard real-time updates
        console.log('📡 Setting up event listener for admin dashboard');
        const adminUpdateListener = (data) => {
            console.log('🔄 Admin dashboard detected status update:', data);
            // Find and update the report in the list
            const reportIndex = app.reports.findIndex(r => r.id === data.reportId);
            if (reportIndex >= 0) {
                app.reports[reportIndex] = data.updatedReport;
                console.log('✅ Updated report in admin list at index:', reportIndex);
            }
            // Refresh admin views
            updateAdminStats();
            loadAdminReports();
            loadConsolidatedView();
            console.log('✅ Admin dashboard UI refreshed');
        };
        
        app.adminDashboardListener = adminUpdateListener;
        addEventListener('reportStatusUpdated', adminUpdateListener);
        
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        showNotification('Failed to load admin dashboard', 'error');
    }
}

function updateAdminStats() {
    const totalReports = app.reports.length;
    const totalUsers = app.users.length;
    const pendingCount = app.reports.filter(r => r.status === 'pending').length;
    const resolvedCount = app.reports.filter(r => r.status === 'resolved').length;

    document.getElementById('adminTotalReports').textContent = totalReports;
    document.getElementById('adminTotalUsers').textContent = totalUsers;
    document.getElementById('adminPendingCount').textContent = pendingCount;
    document.getElementById('adminResolvedCount').textContent = resolvedCount;
}

function loadAdminReports() {
    const tbody = document.getElementById('adminReportsBody');

    if (app.reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No reports</td></tr>';
        return;
    }

    tbody.innerHTML = app.reports.map(report => {
        const user = app.users.find(u => u.id === report.userId);
        return `
            <tr>
                <td>#${report.id.substring(0, 8)}</td>
                <td>${user ? user.name : 'Unknown'}</td>
                <td>${formatType(report.hazardType)}</td>
                <td><span class="severity-badge severity-${report.severity}">${report.severity}</span></td>
                <td><span class="status-badge status-${report.status}">${report.status}</span></td>
                <td>${formatDate(report.submittedDate)}</td>
                <td>
                    <button class="btn btn-small" onclick="viewReportDetails('${report.id}')">View</button>
                </td>
            </tr>
        `;
    }).join('');
}

function loadAdminUsers() {
    const tbody = document.getElementById('usersTableBody');

    if (app.users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No users</td></tr>';
        return;
    }

    tbody.innerHTML = app.users.map(user => {
        const userReports = app.reports.filter(r => r.userId === user.id).length;
        return `
            <tr>
                <td>#${user.id.substring(0, 8)}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.department || '-'}</td>
                <td>${user.role === 'admin' ? 'Admin' : 'User'}</td>
                <td>${userReports}</td>
                <td>
                    <div class="action-buttons">
                        ${user.role !== 'admin' ? `<button class="btn btn-small" onclick="makeUserAdmin('${user.id}')">Make Admin</button>` : '<span>Admin</span>'}
                        <button class="btn btn-small btn-danger" onclick="deleteUser('${user.id}', '${user.name}')">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function makeUserAdmin(userId) {
    if (!confirm('Make this user an admin?')) return;

    try {
        console.log('🔐 Making user admin:', userId);
        const response = await fetch(`${app.apiUrl}/users/${userId}/make-admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('📊 Response status:', response.status);

        if (!response.ok) {
            console.error('❌ Failed to update user role');
            showNotification('Failed to update user role', 'error');
            return;
        }

        console.log('✅ User promoted to admin');
        showNotification('✅ User is now an admin', 'success');
        
        // Reload admin data without navigating away
        console.log('🔄 Reloading admin data...');
        try {
            const usersResponse = await fetch(`${app.apiUrl}/users`);
            const reportsResponse = await fetch(`${app.apiUrl}/reports`);
            
            if (usersResponse.ok && reportsResponse.ok) {
                app.users = await usersResponse.json();
                app.reports = await reportsResponse.json();
                updateAdminStats();
                loadAdminUsers();
                loadAdminReports();
                loadConsolidatedView();
                console.log('✅ Admin data reloaded successfully');
            }
        } catch (error) {
            console.error('❌ Error reloading admin data:', error);
        }
    } catch (error) {
        console.error('❌ Error updating user role:', error);
        showNotification('Failed to update user role', 'error');
    }
}

async function deleteUser(userId, userName) {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone. Their email will be available for reuse.`)) {
        return;
    }

    try {
        console.log('🗑️ Deleting user:', { userId, userName });
        const response = await fetch(`${app.apiUrl}/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('📊 Delete response status:', response.status);

        if (!response.ok) {
            console.error('❌ Delete failed');
            showNotification('Failed to delete user', 'error');
            return;
        }

        console.log('✅ User deleted successfully');
        showNotification(`✅ ${userName} has been deleted. Their email is now available for reuse.`, 'success');
        
        // Reload admin data without navigating away
        console.log('🔄 Reloading admin data...');
        try {
            const usersResponse = await fetch(`${app.apiUrl}/users`);
            const reportsResponse = await fetch(`${app.apiUrl}/reports`);
            
            if (usersResponse.ok && reportsResponse.ok) {
                app.users = await usersResponse.json();
                app.reports = await reportsResponse.json();
                updateAdminStats();
                loadAdminUsers();
                loadAdminReports();
                loadConsolidatedView();
                console.log('✅ Admin data reloaded successfully');
            }
        } catch (error) {
            console.error('❌ Error reloading admin data:', error);
        }
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        showNotification('Failed to delete user', 'error');
    }
}

function filterAdminReports() {
    const statusFilter = document.getElementById('statusFilter').value;
    const tbody = document.getElementById('adminReportsBody');

    let filtered = app.reports;
    if (statusFilter) {
        filtered = app.reports.filter(r => r.status === statusFilter);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No reports found</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(report => {
        const user = app.users.find(u => u.id === report.userId);
        return `
            <tr>
                <td>#${report.id.substring(0, 8)}</td>
                <td>${user ? user.name : 'Unknown'}</td>
                <td>${formatType(report.hazardType)}</td>
                <td><span class="severity-badge severity-${report.severity}">${report.severity}</span></td>
                <td><span class="status-badge status-${report.status}">${report.status}</span></td>
                <td>${formatDate(report.submittedDate)}</td>
                <td>
                    <button class="btn btn-small" onclick="viewReportDetails('${report.id}')">View</button>
                </td>
            </tr>
        `;
    }).join('');
}

function switchAdminTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');

    // Load consolidated view if requested
    if (tabName === 'consolidated') {
        loadConsolidatedView();
    }
}

function loadConsolidatedView() {
    const container = document.getElementById('consolidatedContainer');
    
    if (!app.users || app.users.length === 0) {
        container.innerHTML = '<p class="text-center">No users found</p>';
        return;
    }

    let html = '<div class="users-reports-list">';
    
    app.users.forEach(user => {
        const userReports = app.reports.filter(r => r.userId === user.id);
        const roleLabel = user.role === 'admin' ? '<span class="role-badge admin-badge">Admin</span>' : '<span class="role-badge user-badge">User</span>';
        
        html += `
            <div class="user-report-card">
                <div class="user-header">
                    <div class="user-info">
                        <h3>${user.name}</h3>
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Department:</strong> ${user.department || 'Not specified'}</p>
                        <p><strong>Role:</strong> ${roleLabel}</p>
                        <p><strong>Reports Submitted:</strong> ${userReports.length}</p>
                    </div>
                    ${user.role !== 'admin' ? `<button class="btn btn-small" onclick="makeUserAdmin('${user.id}')">Make Admin</button>` : ''}
                </div>
                <div class="user-reports">
                    <h4>Reported Hazards (${userReports.length})</h4>
                    ${userReports.length === 0 ? 
                        '<p class="empty-message">No reports submitted yet</p>' :
                        '<div class="reports-list">' +
                        userReports.map(report => `
                            <div class="report-item">
                                <div class="report-header">
                                    <strong>#${report.id.substring(0, 8)} - ${formatType(report.hazardType)}</strong>
                                    <span class="severity-badge severity-${report.severity}">${report.severity}</span>
                                    <span class="status-badge status-${report.status}">${report.status}</span>
                                </div>
                                <p><strong>Location:</strong> ${report.location}</p>
                                <p><strong>Description:</strong> ${report.description}</p>
                                <p><strong>Submitted:</strong> ${formatDate(report.submittedDate)}</p>
                                <button class="btn btn-small" onclick="viewReportDetails('${report.id}')">View Details</button>
                            </div>
                        `).join('') +
                        '</div>'
                    }
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// ============================================
// FAQ
// ============================================

function toggleFAQ(button) {
    const item = button.parentElement;
    item.classList.toggle('open');
}

// ============================================
// UTILITIES & HELPERS
// ============================================

async function loadInitialData() {
    try {
        const response = await fetch(`${app.apiUrl}/reports`);
        app.reports = await response.json();
    } catch (error) {
        console.warn('Could not load initial data:', error);
    }
}

function formatType(type) {
    const types = {
        'physical': 'Physical Hazard',
        'chemical': 'Chemical Exposure',
        'biological': 'Biological Hazard',
        'ergonomic': 'Ergonomic Issue',
        'environmental': 'Environmental Hazard',
        'equipment': 'Equipment Malfunction',
        'other': 'Other'
    };
    return types[type] || type;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDatetime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// NOTIFICATIONS
// ============================================

async function loadNotifications() {
    if (!app.currentUser) return;

    try {
        const response = await fetch(`${app.apiUrl}/notifications?userId=${app.currentUser.id}`);
        if (!response.ok) throw new Error(`API returned ${response.status}`);

        const notifications = await response.json();
        app.notifications = Array.isArray(notifications) ? notifications : [];
        console.log(`📬 Loaded ${app.notifications.length} notifications`);
        
        displayNotifications();
        updateNotificationBadge();
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function displayNotifications() {
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;

    if (app.notifications.length === 0) {
        notificationList.innerHTML = '<p class="empty-message">No notifications</p>';
        return;
    }

    notificationList.innerHTML = app.notifications.map(notif => `
        <div class="notification-item ${notif.read ? '' : 'unread'}" onclick="markNotificationAsRead('${notif.id}')">
            <p>${notif.message}</p>
            <small>${formatDatetime(notif.createdAt)}</small>
        </div>
    `).join('');
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    const unreadCount = app.notifications.filter(n => !n.read).length;

    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
}

async function markNotificationAsRead(notificationId) {
    try {
        const response = await fetch(`${app.apiUrl}/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error(`API returned ${response.status}`);

        // Update local state
        const notif = app.notifications.find(n => n.id === notificationId);
        if (notif) {
            notif.read = 1;
        }

        displayNotifications();
        updateNotificationBadge();
        console.log('✓ Notification marked as read');
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

function startNotificationPolling() {
    console.log('🔔 Starting notification polling...');
    
    if (app.notificationCheckInterval) {
        clearInterval(app.notificationCheckInterval);
    }

    // Load notifications immediately
    loadNotifications();

    // Then check every 5 seconds
    app.notificationCheckInterval = setInterval(() => {
        loadNotifications();
    }, 5000);
}

function stopNotificationPolling() {
    console.log('🔕 Stopping notification polling...');
    
    if (app.notificationCheckInterval) {
        clearInterval(app.notificationCheckInterval);
        app.notificationCheckInterval = null;
    }

    app.notifications = [];
    const notificationList = document.getElementById('notificationList');
    if (notificationList) {
        notificationList.innerHTML = '<p class="empty-message">No notifications</p>';
    }
}

function startReportsPolling() {
    console.log('📊 Starting reports polling...');
    
    if (app.reportsRefreshInterval) {
        clearInterval(app.reportsRefreshInterval);
    }

    // Check for report updates every 3 seconds, but only if we're in a section that needs it
    app.reportsRefreshInterval = setInterval(async () => {
        // Only poll if we're in dashboard or admin section and there's no modal open
        const modal = document.getElementById('reportModal');
        const isModalOpen = modal && modal.classList.contains('active');
        
        if ((app.currentSection === 'dashboard' || app.currentSection === 'admin') && !isModalOpen) {
            try {
                let response;
                
                // Different polling based on current section
                if (app.currentSection === 'admin') {
                    console.log('📡 Polling for admin dashboard (all reports)');
                    response = await fetch(`${app.apiUrl}/reports`);
                } else if (app.currentSection === 'dashboard' && app.currentUser) {
                    console.log(`📡 Polling for user dashboard (userId: ${app.currentUser.id})`);
                    response = await fetch(`${app.apiUrl}/reports?userId=${app.currentUser.id}`);
                }
                
                if (response && response.ok) {
                    const reports = await response.json();
                    app.reports = Array.isArray(reports) ? reports : [];
                    
                    // Only update UI if we're still in the same section
                    if (app.currentSection === 'dashboard' || app.currentSection === 'admin') {
                        updateDashboardStats();
                        updateReportsTable();
                        if (app.currentSection === 'admin') {
                            updateAdminStats();
                            loadAdminReports();
                        }
                    }
                }
            } catch (error) {
                console.warn('Error polling reports:', error);
            }
        }
    }, 3000);
}

function stopReportsPolling() {
    console.log('📊 Stopping reports polling...');
    
    if (app.reportsRefreshInterval) {
        clearInterval(app.reportsRefreshInterval);
        app.reportsRefreshInterval = null;
    }
}

function showNotification(message, type = 'info') {
    const toast = document.getElementById('notificationToast');
    toast.textContent = message;
    toast.className = `notification-toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// API Health Check
async function checkAPIHealth() {
    try {
        const response = await fetch(`${app.apiUrl}/../health`);
        return response.ok;
    } catch (error) {
        console.warn('API health check failed:', error);
        return false;
    }
}

// Initialize API check on page load
window.addEventListener('load', async () => {
    const isHealthy = await checkAPIHealth();
    if (!isHealthy) {
        console.warn('Backend API may not be available');
    }
});
