// portal.js
// Isolated script for the dedicated advertiser portal (login/dashboard)

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- LOGIN PAGE LOGIC ---
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    if (loginForm) {
        // If already logged in, redirect to dashboard
        const storedToken = localStorage.getItem('ctvboss_session');
        if (storedToken) {
            window.location.href = 'dashboard.html';
            return;
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerText = 'Signing In...';
            loginError.classList.add('hidden');

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                // Call our secure Netlify Function proxy
                const response = await fetch('/.netlify/functions/auth-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok) throw new Error(data.error || 'Authentication failed');
                
                // Store the access token for future API calls
                localStorage.setItem('ctvboss_session', data.access_token);
                // Store basic user info if needed
                localStorage.setItem('ctvboss_user_email', data.user.email);
                
                // Success
                window.location.href = 'dashboard.html';

            } catch (error) {
                console.error('Login error:', error.message);
                loginError.textContent = error.message;
                loginError.classList.remove('hidden');
                btn.disabled = false;
                btn.innerText = 'Log In';
            }
        });
    }

    // --- DASHBOARD ROUTING / AUTH CHECK ---
    const dashboardContainer = document.getElementById('dashboardContainer');
    
    if (dashboardContainer) {
        // Check local session
        const storedToken = localStorage.getItem('ctvboss_session');
        
        if (!storedToken) {
            // Not authenticated, send back to login
            window.location.href = 'login.html';
            return;
        }
        
        try {
            // Fetch client data via secure Netlify Function proxy
            const response = await fetch('/.netlify/functions/fetch-client-data', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${storedToken}`
                }
            });

            if (response.status === 401) {
                // Token expired or invalid
                throw new Error('Session expired');
            }

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to fetch dashboard data');

            const client = data.client;

            // Populate the basic dashboard header info
            document.getElementById('businessNameDisplay').textContent = client.business_name || 'Your Business';
            document.getElementById('welcomeMessage').textContent = `Welcome back, ${client.name.split(' ')[0]}!`;

            // --- MNTN DATA FETCHING ---
            const fetchMntnData = async (dateRange = 'monthtodate') => {
                const metricsCards = document.getElementById('metricsCards');
                const chartContainer = document.getElementById('chartContainer');
                const errorState = document.getElementById('mntnErrorState');
                const errorText = document.getElementById('mntnErrorText');
                
                // Show loading state on cards
                document.getElementById('valImpressions').textContent = '...';
                document.getElementById('valVisits').textContent = '...';
                document.getElementById('valConversions').textContent = '...';
                document.getElementById('valCPV').textContent = '...';

                try {
                    const mRes = await fetch(`/.netlify/functions/fetch-mntn-data?begin=${dateRange}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${storedToken}`
                        }
                    });

                    const mData = await mRes.json();

                    if (!mRes.ok || !mData.metrics) throw new Error(mData.error || 'Your campaign data is loading — check back shortly');

                    // Success: Hide error state, show cards
                    errorState.classList.add('hidden');
                    metricsCards.style.opacity = '1';
                    chartContainer.style.opacity = '1';

                    // Parse MNTN Response (assuming it returns an object or array we can reduce)
                    // The MNTN API structure might vary, so we implement a robust parsing attempt
                    let totalImps = 0;
                    let totalVisits = 0;
                    let totalConvs = 0;
                    let totalCost = 0;

                    const records = Array.isArray(mData.metrics) ? mData.metrics : [mData.metrics];
                    
                    records.forEach(row => {
                        totalImps += parseInt(row['Campaign.Impressions'] || 0, 10);
                        totalVisits += parseInt(row['Campaign.Visits'] || 0, 10);
                        totalConvs += parseInt(row['Campaign.Conversions'] || 0, 10);
                        totalCost += parseFloat(row['Campaign.Cost'] || 0);
                    });

                    // Calculations
                    const cpv = totalVisits > 0 ? (totalCost / totalVisits) : 0;

                    // Update DOM Elements
                    document.getElementById('valImpressions').textContent = totalImps.toLocaleString();
                    document.getElementById('valVisits').textContent = totalVisits.toLocaleString();
                    document.getElementById('valConversions').textContent = totalConvs.toLocaleString();
                    document.getElementById('valCPV').textContent = cpv > 0 ? `$${cpv.toFixed(2)}` : 'N/A';

                } catch (err) {
                    console.error("MNTN Integration Error:", err.message);
                    // Show error state, fade out cards
                    errorText.textContent = err.message || 'Your campaign data is loading — check back shortly';
                    errorState.classList.remove('hidden');
                    metricsCards.style.opacity = '0.3';
                    chartContainer.style.opacity = '0.3';
                }
            };

            // Initial Fetch
            await fetchMntnData('monthtodate');

            // Handle Date Range changes
            const dateRangeSelect = document.getElementById('dateRangeSelect');
            if (dateRangeSelect) {
                dateRangeSelect.addEventListener('change', (e) => {
                    fetchMntnData(e.target.value);
                });
            }

            // Un-hide dashboard content now that data is loaded
            dashboardContainer.classList.remove('hidden');
            
            // Remove the loading overlay
            const loader = document.getElementById('loadingOverlay');
            if(loader) loader.classList.add('hidden');

            // Handle Logout
            document.getElementById('logoutBtn').addEventListener('click', async (e) => {
                e.preventDefault();
                localStorage.removeItem('ctvboss_session');
                localStorage.removeItem('ctvboss_user_email');
                window.location.href = 'login.html';
            });

        } catch (err) {
            console.error('Data pipeline error:', err.message);
            // If session expired or failed validation, wipe local state and kick to login
            if (err.message.includes('expired') || err.message.includes('missing')) {
                localStorage.removeItem('ctvboss_session');
                localStorage.removeItem('ctvboss_user_email');
                window.location.href = 'login.html';
            } else {
                // Other dashboard load errors
                alert("Error loading dashboard data. Please try refreshing.");
                const loader = document.getElementById('loadingOverlay');
                if(loader) loader.classList.add('hidden');
            }
        }
    }
});
