// admin.js

document.addEventListener('DOMContentLoaded', () => {

    // Global State
    let adminSecret = sessionStorage.getItem('ctvboss_admin_secret');
    let leadsData = [];

    // UI Elements
    const authScreen = document.getElementById('adminAuthScreen');
    const dashboardScreen = document.getElementById('adminDashboardScreen');
    const authForm = document.getElementById('adminAuthForm');
    const secretInput = document.getElementById('adminSecretInput');
    const authErrorMsg = document.getElementById('authErrorMsg');
    const tableBody = document.getElementById('leadsTableBody');
    const refreshBtn = document.getElementById('refreshBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Modal Elements
    const modal = document.getElementById('activationModal');
    const modalClientName = document.getElementById('modalClientName');
    const activationForm = document.getElementById('activationForm');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const modalErrorMsg = document.getElementById('modalErrorMsg');
    const confirmBtn = document.getElementById('confirmActivateBtn');

    // --- INITIALIZATION ---
    if (adminSecret) {
        // If we already typed in a password this session, try loading the dashboard immediately
        loadDashboard();
    }

    // --- AUTHENTICATION ---
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const secret = secretInput.value.trim();
        if (!secret) return;
        
        // Save to session temporarily
        sessionStorage.setItem('ctvboss_admin_secret', secret);
        adminSecret = secret;

        authErrorMsg.style.display = 'none';
        const submitBtn = authForm.querySelector('button');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';

        // We "verify" by attempting to fetch the leads. If it 401s, it was the wrong password.
        const result = await loadDashboard();
        
        if (result !== true) {
            sessionStorage.removeItem('ctvboss_admin_secret');
            adminSecret = null;
            authErrorMsg.textContent = typeof result === 'string' ? result : 'Unknown Server Error';
            authErrorMsg.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enter Command Center';
        }
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('ctvboss_admin_secret');
        window.location.reload();
    });

    refreshBtn.addEventListener('click', () => {
        refreshBtn.textContent = 'Refreshing...';
        loadDashboard().then(() => refreshBtn.textContent = '↻ Refresh Data');
    });


    // --- DATA FETCHING & RENDERING ---
    async function loadDashboard() {
        try {
            const res = await fetch('/.netlify/functions/admin-get-leads', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${adminSecret}`
                }
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Auth failed');
            }

            const data = await res.json();
            leadsData = data.leads || [];
            
            // Success! Transition UI
            authScreen.classList.add('hidden');
            dashboardScreen.classList.remove('hidden');

            renderTable();
            return true;

        } catch (err) {
            console.error(err);
            return err.message;
        }
    }

    function renderTable() {
        tableBody.innerHTML = '';
        
        if (leadsData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No leads found.</td></tr>`;
            return;
        }

        leadsData.forEach(lead => {
            const isNew = lead.status !== 'active';
            const date = new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            const tr = document.createElement('tr');
            if (!isNew) tr.style.opacity = '0.5'; // Gray out active leads slightly

            tr.innerHTML = `
                <td>${date}</td>
                <td>
                    <strong>${lead.business_name || 'N/A'}</strong>
                </td>
                <td>
                    <div style="font-weight: 500;">${lead.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${lead.email}</div>
                </td>
                <td>
                    <span class="status-badge ${isNew ? 'status-new' : 'status-active'}">
                        ${lead.status || 'new'}
                    </span>
                </td>
                <td style="text-align: right; display: flex; justify-content: flex-end; align-items: center; gap: 0.5rem; height: 100%;">
                    ${isNew ? `<button class="btn-activate" data-id="${lead.id}">Activate Client</button>` : `<span style="font-size: 0.8rem; color: var(--text-muted);">Configured ✓</span>`}
                    <button class="btn-delete" data-id="${lead.id}" title="Delete Lead">🗑️</button>
                </td>
            `;

            tableBody.appendChild(tr);
        });

        // Attach listeners to active buttons
        document.querySelectorAll('.btn-activate').forEach(btn => {
            btn.addEventListener('click', (e) => openModal(e.target.getAttribute('data-id')));
        });

        // Attach listeners to delete buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => deleteLead(e.currentTarget.getAttribute('data-id')));
        });
    }

    // --- DELETE LEAD LOGIC ---
    async function deleteLead(leadId) {
        if (!confirm("Are you sure you want to delete this lead? This cannot be undone.")) {
            return;
        }

        try {
            const res = await fetch('/.netlify/functions/admin-delete-lead', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminSecret}`
                },
                body: JSON.stringify({ lead_id: leadId })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete lead');
            }

            // Refresh table after successful deletion
            await loadDashboard();

        } catch (err) {
            console.error("Error deleting lead:", err);
            alert("Failed to delete lead: " + err.message);
        }
    }


    // --- ACTIVATION MODAL LOGIC ---
    function openModal(leadId) {
        const lead = leadsData.find(l => l.id === leadId);
        if(!lead) return;

        // Populate hidden fields
        document.getElementById('modalLeadId').value = lead.id;
        document.getElementById('modalEmail').value = lead.email;
        document.getElementById('modalName').value = lead.name;
        document.getElementById('modalBizName').value = lead.business_name || 'Business';
        
        // Auto-generate a strong password suggestion
        const randomPass = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + "!";
        document.getElementById('modalPass').value = randomPass;

        modalClientName.innerHTML = `Provisioning portal access for: <strong style="color:white;">${lead.business_name || lead.name}</strong>`;
        
        // Clear previous errors/inputs
        document.getElementById('modalMntnKey').value = '';
        document.getElementById('modalMntnId').value = '';
        modalErrorMsg.style.display = 'none';
        
        modal.classList.remove('hidden');
    }

    cancelModalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // --- ADD MANUAL LEAD MODAL LOGIC ---
    const addLeadModal = document.getElementById('addLeadModal');
    const openAddLeadBtn = document.getElementById('openAddLeadBtn');
    const cancelAddLeadBtn = document.getElementById('cancelAddLeadBtn');
    const addLeadForm = document.getElementById('addLeadForm');
    const confirmAddLeadBtn = document.getElementById('confirmAddLeadBtn');
    const newLeadErrorMsg = document.getElementById('newLeadErrorMsg');

    openAddLeadBtn.addEventListener('click', () => {
        addLeadForm.reset();
        newLeadErrorMsg.style.display = 'none';
        addLeadModal.classList.remove('hidden');
    });

    cancelAddLeadBtn.addEventListener('click', () => {
        addLeadModal.classList.add('hidden');
    });

    addLeadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        confirmAddLeadBtn.disabled = true;
        confirmAddLeadBtn.textContent = 'Creating...';
        newLeadErrorMsg.style.display = 'none';

        const payload = {
            name: document.getElementById('newLeadName').value.trim(),
            business_name: document.getElementById('newLeadBizName').value.trim(),
            email: document.getElementById('newLeadEmail').value.trim()
        };

        try {
            const res = await fetch('/.netlify/functions/admin-add-lead', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminSecret}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to add lead');
            }

            // Success! Close modal and refresh the table
            addLeadModal.classList.add('hidden');
            await loadDashboard();

        } catch (err) {
            console.error(err);
            newLeadErrorMsg.textContent = err.message;
            newLeadErrorMsg.style.display = 'block';
        } finally {
            confirmAddLeadBtn.disabled = false;
            confirmAddLeadBtn.textContent = 'Create Lead';
        }
    });

    activationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Activating...';
        modalErrorMsg.style.display = 'none';

        const payload = {
            lead_id: document.getElementById('modalLeadId').value,
            email: document.getElementById('modalEmail').value,
            name: document.getElementById('modalName').value,
            business_name: document.getElementById('modalBizName').value,
            mntn_api_key: document.getElementById('modalMntnKey').value.trim(),
            mntn_advertiser_id: document.getElementById('modalMntnId').value.trim(),
            temporary_password: document.getElementById('modalPass').value.trim()
        };

        try {
            const res = await fetch('/.netlify/functions/admin-activate-lead', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminSecret}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Activation failed');

            // Success! Close modal and refresh the table
            modal.classList.add('hidden');
            await loadDashboard();

        } catch (err) {
            console.error(err);
            modalErrorMsg.textContent = err.message;
            modalErrorMsg.style.display = 'block';
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Activate & Create User';
        }
    });

});
