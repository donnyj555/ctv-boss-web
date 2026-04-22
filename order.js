document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---

    // Toggles
    const planRadios = document.querySelectorAll('input[name="planTier"]');
    const creativeToggle = document.getElementById('creativeToggle');
    const videoLinkInput = document.getElementById('videoLinkInput');

    // Slider
    const sliderContainer = document.getElementById('sliderContainer');
    const budgetSlider = document.getElementById('budgetSlider');
    const displayBudget = document.getElementById('displayBudget');

    // Summary Panel Displays
    const summaryTier = document.getElementById('summaryTier');
    const summaryImpressions = document.getElementById('summaryImpressions');
    const summaryCreative = document.getElementById('summaryCreative');
    const summaryTotal = document.getElementById('summaryTotal');
    const recurringText = document.getElementById('recurringText');

    // Hidden Form Inputs (for Netlify)
    const hiddenTier = document.getElementById('hiddenTier');
    const hiddenBudget = document.getElementById('hiddenBudget');
    const hiddenImpressions = document.getElementById('hiddenImpressions');
    const hiddenCreativeFee = document.getElementById('hiddenCreativeFee');
    const hiddenAdminFee = document.getElementById('hiddenAdminFee'); // Represents Management or Agency Fee
    const hiddenTotal = document.getElementById('hiddenTotal');

    // Conditional Form Inputs
    const customTargetingGroup = document.getElementById('customTargetingGroup');
    const idealCustomerInput = document.getElementById('idealCustomerInput');

    // Constants
    const BASE_PRICE = 499;
    const BASE_IMPRESSIONS = 10000;
    const CUSTOM_CPM = 60; // $60 per 1,000 views
    const ADMIN_FEE = 0; // Management fee removed
    const AGENCY_FEE_PERCENTAGE = 0.15;
    const CREATIVE_FEE = 0; // CTV HOMES automated creation is free

    // --- State Variables ---
    let currentTier = 'base'; // 'base' or 'custom'
    let currentBudget = BASE_PRICE;
    let currentImpressions = BASE_IMPRESSIONS;
    let hasCreativeFee = false;

    // --- Functions ---

    const formatCurrency = (num) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US').format(num);
    };

    const calculateCustomImpressions = (budget) => {
        // (Budget / CPM) * 1000
        const calculated = (budget / CUSTOM_CPM) * 1000;
        // Round to nearest 100 for a slightly cleaner number, or just Math.floor
        return Math.floor(calculated);
    };

    const updateUI = () => {
        let finalImpressions = 0;
        let finalMonthlyBudget = 0;
        let tierName = "";

        let agencyFee = 0;

        let actualFee = 0;
        let feeLabel = "";

        if (currentTier === 'base') {
            sliderContainer.classList.remove('active');
            customTargetingGroup.style.display = 'none';
            idealCustomerInput.required = false;
            finalMonthlyBudget = BASE_PRICE;
            finalImpressions = BASE_IMPRESSIONS;
            actualFee = ADMIN_FEE;
            feeLabel = "Management Fee ($0)";
            tierName = "Neighborhood Farming";
            recurringText.textContent = `Recurring monthly cost: ${formatCurrency(BASE_PRICE)}/mo thereafter.`;
        } else {
            sliderContainer.classList.add('active');
            customTargetingGroup.style.display = 'block';
            idealCustomerInput.required = true;
            finalMonthlyBudget = parseInt(budgetSlider.value);
            finalImpressions = calculateCustomImpressions(finalMonthlyBudget);
            actualFee = finalMonthlyBudget * AGENCY_FEE_PERCENTAGE;
            feeLabel = "Agency Fee (15%)";
            tierName = "Geo & Demo Precision";
            displayBudget.textContent = formatCurrency(finalMonthlyBudget);
            recurringText.textContent = `Recurring monthly cost: ${formatCurrency(finalMonthlyBudget + actualFee)}/mo thereafter.`;
        }

        // Handle Creative Fee
        hasCreativeFee = creativeToggle.checked;
        const creativeCost = hasCreativeFee ? CREATIVE_FEE : 0;

        // Provide custom logic depending on whether they use Zillow link or provide their own ad
        if (hasCreativeFee) {
            videoLinkInput.placeholder = "https://www.zillow.com/homedetails/...";
            summaryCreative.textContent = `CTV HOMES ($0)`;
        } else {
            videoLinkInput.placeholder = "Link to Google Drive / YouTube...";
            summaryCreative.innerHTML = `Provided by Client ($0)`;
        }

        const totalInitialCharge = finalMonthlyBudget + creativeCost + actualFee;

        // Update Visible Summary
        summaryTier.textContent = tierName;
        summaryImpressions.textContent = formatNumber(finalImpressions);
        
        // Map Admin fee row visibility
        const summaryAdminFeeDisplay = document.getElementById('summaryAdminFee');
        const summaryAdminFeeLabel = document.getElementById('summaryAdminFeeLabel');
        const summaryAdminFeeRow = document.getElementById('summaryAdminFeeRow');
        
        if (currentTier === 'base' && summaryAdminFeeRow) {
            summaryAdminFeeRow.style.display = 'none';
        } else if (summaryAdminFeeRow) {
            summaryAdminFeeRow.style.display = 'flex';
        }

        if (summaryAdminFeeDisplay) {
            summaryAdminFeeDisplay.textContent = formatCurrency(actualFee);
        }
        if (summaryAdminFeeLabel) {
            summaryAdminFeeLabel.textContent = feeLabel;
        }

        summaryTotal.textContent = formatCurrency(totalInitialCharge);

        // Update Hidden Form Inputs
        hiddenTier.value = tierName;
        hiddenBudget.value = finalMonthlyBudget;
        hiddenImpressions.value = finalImpressions;
        hiddenCreativeFee.value = creativeCost;
        if (hiddenAdminFee) hiddenAdminFee.value = actualFee;
        hiddenTotal.value = totalInitialCharge;
    };


    // --- Event Listeners ---

    planRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentTier = e.target.value;
            updateUI();
        });
    });

    budgetSlider.addEventListener('input', () => {
        updateUI();
    });

    creativeToggle.addEventListener('change', () => {
        updateUI();
    });

    // Initialize UI on load
    updateUI();
});
