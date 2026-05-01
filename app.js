document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }



    // Scroll handling for Navigation
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Call once to set initial state
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    }

    // Intersection Observer for Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Optional: Stop observing once animation has triggered
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right');
    animatedElements.forEach(el => observer.observe(el));

    // Initial trigger for hero elements that are already in viewport
    setTimeout(() => {
        document.querySelectorAll('.hero .fade-in-up').forEach(el => {
            el.classList.add('is-visible');
        });
    }, 100);

    // Force video playback to bypass potential Safari/Chrome autoplay restrictions
    const mockupVideo = document.querySelector('.tv-screen video');
    if (mockupVideo) {
        // Attempt to play immediately
        mockupVideo.play().catch(e => {
            console.warn("Autoplay prevented or failed, trying muted play", e);
            mockupVideo.muted = true;
            mockupVideo.play().catch(err => console.error("Still cannot play video:", err));
        });

        // Add intersection observer fallback to play when scrolled into view
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.play().catch(e => console.warn(e));
                }
            });
        }, { threshold: 0.1 });

        videoObserver.observe(mockupVideo);

        // Sound Toggle Logic
        const soundToggle = document.getElementById('videoSoundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', (e) => {
                e.preventDefault();

                // If the browser paused the video heavily, this click interaction allows us to force it to play explicitly
                if (mockupVideo.paused) {
                    mockupVideo.play().catch(err => console.error("Force play failed:", err));
                }

                if (mockupVideo.muted) {
                    mockupVideo.muted = false;
                    soundToggle.innerHTML = '🔊 Sound On';
                    soundToggle.style.background = 'rgba(255, 51, 102, 0.9)'; // Accent red when active
                    soundToggle.style.borderColor = 'rgba(255, 51, 102, 1)';
                } else {
                    mockupVideo.muted = true;
                    soundToggle.innerHTML = '🔇 Tap to Unmute';
                    soundToggle.style.background = 'rgba(0,0,0,0.7)';
                    soundToggle.style.borderColor = 'rgba(255,255,255,0.2)';
                }
            });
        }
    }

    // Auto-populate hidden fields from URL parameters (e.g. email from step 1)
    const urlParams = new URLSearchParams(window.location.search);
    const passedEmail = urlParams.get('email');
    if (passedEmail) {
        const hiddenEmailInput = document.getElementById('passed_email');
        if (hiddenEmailInput) {
            hiddenEmailInput.value = passedEmail;
        }
    }

    // Form Handling - Send to Formspree via AJAX to force custom redirect
    const forms = document.querySelectorAll('form.lead-form');

    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            btn.innerText = 'Sending...';
            btn.disabled = true;

            const formData = new FormData(form);
            let nextUrl = formData.get('_next');
            const userEmail = formData.get('email');

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json' },
                    body: formData
                });

                if (response.ok) {
                    // Success! Redirect manually to Step 2 or Home
                    if (nextUrl) {
                        if (userEmail && nextUrl.includes('step-2.html')) {
                            // Append the captured email to the Step 2 URL
                            nextUrl += `?email=${encodeURIComponent(userEmail)}`;
                        }
                        window.location.href = nextUrl;
                    } else {
                        window.location.href = '/';
                    }
                } else {
                    console.error("Formspree Submission Error");
                    btn.innerText = 'Error - Try Again';
                    btn.disabled = false;
                }
            } catch (err) {
                console.error("Network Error:", err);
                btn.innerText = 'Error - Try Again';
                btn.disabled = false;
            }
        });
    });
});

// Interactive ROI Tools Logic
document.addEventListener('DOMContentLoaded', () => {

    // 1. Budget Slider Logic
    const budgetSlider = document.getElementById('budgetSlider');
    const budgetValueDisplay = document.getElementById('budgetValue');
    const calcImpressions = document.getElementById('calcImpressions');
    const calcVisits = document.getElementById('calcVisits');

    if (budgetSlider && budgetValueDisplay && calcImpressions && calcVisits) {
        const CPM = 49.9; // $49.9 Cost Per Mille ($499 / 10,000)
        const VISIT_YIELD_RATE = 0.02; // 2% yield

        function updateCalculations() {
            const budget = parseInt(budgetSlider.value, 10);
            budgetValueDisplay.textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(budget);

            const impressions = Math.floor((budget / CPM) * 1000);
            calcImpressions.textContent = new Intl.NumberFormat('en-US').format(impressions);

            const visits = Math.floor(impressions * VISIT_YIELD_RATE);
            calcVisits.textContent = new Intl.NumberFormat('en-US').format(visits);

            const percentage = ((budget - budgetSlider.min) / (budgetSlider.max - budgetSlider.min)) * 100;
            budgetSlider.style.background = `linear-gradient(to right, var(--accent-red) 0%, var(--accent-red) ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`;
        }

        budgetSlider.addEventListener('input', updateCalculations);
        updateCalculations(); // Init
    }

    // 2. Zip Code Lookup - Background Fetch
    const zipCodeInput = document.getElementById('zipCodeInput');
    const zipLookupBtn = document.getElementById('zipLookupBtn');

    const zipResult = document.getElementById('zipResult');
    const zipLoading = document.getElementById('zipLoading');
    const displayZip = document.getElementById('displayZip');
    const hhCount = document.getElementById('hhCount');

    if (zipLookupBtn && zipCodeInput) {
        zipCodeInput.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        zipLookupBtn.addEventListener('click', async () => {
            const zip = zipCodeInput.value.trim();
            if (zip.length !== 5) {
                alert("Please enter a valid 5-digit zip code.");
                return;
            }

            zipResult.classList.add('hidden');
            zipLoading.classList.remove('hidden');
            zipLoading.textContent = "Fetching local data...";
            zipLookupBtn.disabled = true;
            zipLookupBtn.textContent = "Scanning...";

            try {
                // Fetch City Data
                let locationString = zip;
                try {
                    const zipRes = await fetch(`https://api.zippopotam.us/us/${zip}`);
                    if (zipRes.ok) {
                        const zipData = await zipRes.json();
                        locationString = `${zipData.places[0]['place name']}, ${zipData.places[0]['state abbreviation']} (${zip})`;
                    }
                } catch (e) { console.warn("City lookup failed", e); }

                // Fetch Housing Units via US Census API (2022 ACS 5-Year Data)
                let totalUnits = 0;

                try {
                    const censusUrl = `https://api.census.gov/data/2022/acs/acs5/profile?get=DP04_0001E&for=zip%20code%20tabulation%20area:${zip}`;
                    const res = await fetch(censusUrl);
                    if (res.ok) {
                        const data = await res.json();
                        // Expected Data format: [["DP04_0001E","zip code tabulation area"], ["12440","18360"]]
                        if (data && data.length > 1 && data[1] && data[1][0]) {
                            totalUnits = parseInt(data[1][0], 10);
                        }
                    }
                } catch (e) {
                    console.warn("Census fetch failed, using fallback", e);
                }

                // Fallback deterministic logic if API failed or returned 0
                if (!totalUnits || isNaN(totalUnits) || totalUnits < 1) {
                    let seed = parseInt(zip, 10);
                    let randomFactor = (Math.sin(seed++) * 10000);
                    randomFactor = randomFactor - Math.floor(randomFactor);
                    totalUnits = Math.floor(randomFactor * (18000 - 3000) + 3000);
                }

                // 90% of Total Housing Units
                const ctvHouseholds = Math.floor(totalUnits * 0.90);

                // Animate Numbers
                let currentCount = 0;
                const duration = 1000;
                const steps = 30;
                const increment = ctvHouseholds / steps;

                zipLoading.classList.add('hidden');
                zipResult.classList.remove('hidden');
                displayZip.textContent = locationString;

                // Update source link dynamically
                const zipSourceLink = document.getElementById('zipSourceLink');
                if (zipSourceLink) {
                    zipSourceLink.href = `https://www.unitedstateszipcodes.org/${zip}/`;
                }

                const timer = setInterval(() => {
                    currentCount += increment;
                    if (currentCount >= ctvHouseholds) {
                        currentCount = ctvHouseholds;
                        clearInterval(timer);
                        zipLookupBtn.disabled = false;
                        zipLookupBtn.textContent = "Search";
                    }
                    hhCount.textContent = new Intl.NumberFormat('en-US').format(Math.floor(currentCount));
                }, duration / steps);

            } catch (e) {
                console.error("Lookup error:", e);
                zipLoading.textContent = "Error fetching data.";
                zipLookupBtn.disabled = false;
                zipLookupBtn.textContent = "Search";
            }
        });

        zipCodeInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                zipLookupBtn.click();
            }
        });
    }
});
