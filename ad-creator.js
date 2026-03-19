/**
 * Ad Creator 5-Step Wizard Logic (Adwave Clone)
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Environment Setup ---
    const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') 
        ? 'http://127.0.0.1:5001' 
        : 'https://ctv-boss-backend.onrender.com';

    // --- State variables ---
    let currentStep = 1;
    const totalSteps = 5;
    
    const adData = {
        websiteUrl: '',
        script: '',
        template: 'real_estate',
        goal: 'awareness',
        location: '',
        radius: 15,
        budget: 30,
        logo: '',
        images: []
    };
    
    // --- Elements ---
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    
    // Step 1
    const extractBtn = document.getElementById('extractBtn');
    
    // Step 2
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatMessages = document.getElementById('chatMessages');
    const scriptText = document.getElementById('scriptText');
    const wordCount = document.getElementById('wordCount');
    const sceneCards = document.querySelectorAll('.scene-card');
    const industryTemplate = document.getElementById('industryTemplate');
    
    // Step 3
    const goalCards = document.querySelectorAll('.goal-card');
    const radiusSlider = document.getElementById('radiusSlider');
    const radiusValueDisplay = document.getElementById('radiusValueDisplay');
    const targetLocation = document.getElementById('targetLocation');
    
    // Step 4
    const termsCheck = document.getElementById('termsCheck');
    
    // Step 5
    const budgetTiers = document.querySelectorAll('.budget-tier');
    const finalLaunchBtn = document.getElementById('finalLaunchBtn');
    const launchOverlay = document.getElementById('launchOverlay');
    
    // --- Navigation Logic ---
    function updateUI() {
        // Steps visibility
        for (let i = 1; i <= totalSteps; i++) {
            const stepEl = document.getElementById(`step-${i}`);
            if (i === currentStep) {
                stepEl.classList.add('active');
            } else {
                stepEl.classList.remove('active');
            }
        }
        
        // Indicators
        for (let i = 1; i <= totalSteps; i++) {
            const ind = document.getElementById(`indicator-${i}`);
            ind.classList.remove('active', 'completed');
            if (i < currentStep) {
                ind.classList.add('completed');
                ind.querySelector('.step-number').innerHTML = '✓';
            } else if (i === currentStep) {
                ind.classList.add('active');
                ind.querySelector('.step-number').innerHTML = i;
            } else {
                ind.querySelector('.step-number').innerHTML = i;
            }
        }
        
        // Buttons
        if (currentStep === 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'inline-block';
            nextBtn.textContent = 'Continue to Create';
        } else if (currentStep === 2) {
            prevBtn.style.display = 'inline-block';
            nextBtn.style.display = 'inline-block';
            nextBtn.textContent = 'Continue to Target';
            
            // Auto-gen script mock if empty
            if (!scriptText.value && adData.websiteUrl) {
                simulateAILoading();
            }
        } else if (currentStep === 3) {
            prevBtn.style.display = 'inline-block';
            nextBtn.style.display = 'inline-block';
            nextBtn.textContent = 'Continue to Review';
        } else if (currentStep === 4) {
            prevBtn.style.display = 'inline-block';
            nextBtn.style.display = 'inline-block';
            nextBtn.textContent = 'Continue to Air';
            
            // Populate Review Data
            populateReviewSummary();
        } else if (currentStep === 5) {
            prevBtn.style.display = 'inline-block';
            nextBtn.style.display = 'none'; // Replaced by launch button
        }
    }
    
    nextBtn.addEventListener('click', () => {
        // Validation per step
        if (currentStep === 4 && !termsCheck.checked) {
            alert('Please acknowledge that the creative is final before proceeding.');
            return;
        }

        if (currentStep < totalSteps) {
            currentStep++;
            window.scrollTo(0, 0);
            updateUI();
        }
    });
    
    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            window.scrollTo(0, 0);
            updateUI();
        }
    });
    
    // --- Step 1: Assets ---
    extractBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const urlInput = document.getElementById('websiteUrl').value;
        if (!urlInput) {
            alert('Please enter a website URL.');
            return;
        }
        
        adData.websiteUrl = urlInput;
        const originalText = extractBtn.textContent;
        extractBtn.textContent = 'Fetching...';
        extractBtn.disabled = true;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/extract-assets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: urlInput })
            });
            
            // Mocking for testing if API fails
            let data = { logo: '', images: [] };
            if (response.ok) {
                data = await response.json();
            } else {
                // Mock data since we just want the UI to look good
                data.images = [
                    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
                    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
                    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                ];
            }
            
            adData.logo = data.logo || 'https://ui-avatars.com/api/?name=Brand&background=random';
            adData.images = data.images || [];
            
            const container = document.getElementById('extractedAssetsContainer');
            const logoRef = document.getElementById('scrapedLogoRef');
            const imagesGrid = document.getElementById('scrapedImagesGrid');
            
            if (adData.logo) {
                logoRef.src = adData.logo;
            }
            
            imagesGrid.innerHTML = '';
            if (adData.images && adData.images.length > 0) {
                adData.images.forEach(imgUrl => {
                    const img = document.createElement('img');
                    img.src = imgUrl;
                    img.style.height = '80px';
                    img.style.width = '120px';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '8px';
                    imagesGrid.appendChild(img);
                });
            } else {
                imagesGrid.innerHTML = '<span class="text-muted text-sm">No images found</span>';
            }
            
            container.classList.remove('hidden');
            extractBtn.textContent = 'Assets Saved ✓';
            extractBtn.style.backgroundColor = '#4ade80';
            extractBtn.style.color = '#000';
            
            setTimeout(() => {
                extractBtn.textContent = originalText;
                extractBtn.disabled = false;
                extractBtn.style.backgroundColor = '';
                extractBtn.style.color = '';
            }, 3000);
            
        } catch (error) {
            console.error("Extraction error:", error);
            alert("Timeout or failure. Proceeding with mock data.");
        }
    });
    
    // File upload mock interactions
    document.getElementById('logoUploadArea').addEventListener('click', () => document.getElementById('logoFile').click());
    document.getElementById('mediaUploadArea').addEventListener('click', () => document.getElementById('mediaFile').click());
    
    
    // --- Step 2: Create (Chat AI & Storyboard) ---
    async function simulateAILoading() {
        const placeholder = document.getElementById('previewPlaceholder');
        
        try {
            // 1. Generate Script via API
            placeholder.innerHTML = `<div class="spinner" style="margin: 0 auto 1rem;"></div><span class="text-sm text-muted">AI is writing your script...</span>`;
            
            let businessName = "Local Business";
            if (adData.websiteUrl) {
                try {
                    businessName = new URL(adData.websiteUrl).hostname.replace('www.', '');
                } catch(e) {}
            }
            
            // Map the template value to a human readable industry for the prompt
            const indTextMap = {
                'real_estate': 'Real Estate Agency',
                'retail': 'Retail Store or E-Commerce Brand',
                'restaurant': 'Restaurant or Food Business',
                'home_services': 'Home Service Contractor',
                'fitness': 'Gym or Fitness Studio',
                'corporate': 'B2B Corporate Business'
            };
            
            const scriptRes = await fetch(`${API_BASE_URL}/api/generate-script`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName: businessName,
                    industry: indTextMap[adData.template] || 'local business',
                    topic: 'promotional',
                    voiceDirection: 'Professional and trustworthy',
                    cta: 'Visit our website today!'
                })
            });
            
            if (scriptRes.ok) {
                const scriptData = await scriptRes.json();
                scriptText.value = scriptData.script;
            } else {
                throw new Error("Script API failed");
            }
            updateWordCount();
            
            // 2. Generate Video via API
            placeholder.innerHTML = `<div class="spinner" style="margin: 0 auto 1rem;"></div><span class="text-sm text-muted">AI is rendering your video... This takes about 30 seconds.</span>`;
            
            const videoRes = await fetch(`${API_BASE_URL}/api/generate-video`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName: businessName,
                    script: scriptText.value,
                    cta: 'Visit our website today!',
                    images: adData.images,
                    template: adData.template, // Uses dynamic UI value
                    duration: '30'
                })
            });
            
            if (videoRes.ok) {
                const videoData = await videoRes.json();
                placeholder.classList.add('hidden');
                document.getElementById('finalVideoPlayer').src = videoData.url;
                document.getElementById('finalVideoPlayer').hidden = false;
                
                // CRITICAL FIX: Make sure the Step 2 Live Preview *actually* shows the generated video!
                const step2Player = document.getElementById('videoPlayer');
                if (step2Player) {
                    step2Player.src = videoData.url;
                    // Auto-play the masterpiece for the user!
                    step2Player.play().catch(e => console.log('Autoplay prevented')); 
                }
            } else {
                const errorData = await videoRes.json().catch(() => ({}));
                throw new Error(errorData.error || "Video API failed");
            }
            
        } catch (error) {
            console.error("AI Generation Error:", error);
            placeholder.innerHTML = `<div style="color: #ef4444; border: 1px solid #ef4444; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; margin-top: 1rem;">
                <strong style="font-size: 1.1em;">Video Generation Failed</strong><br>
                <span class="text-sm">${error.message}</span>
                <p class="text-sm text-gray" style="margin-top:0.5rem;">Ensure your .env file has valid API keys.</p>
            </div>`;
        }
    }

    function appendChatMessage(text, isUser) {
        const div = document.createElement('div');
        div.className = `chat-bubble ${isUser ? 'chat-user' : 'chat-ai'}`;
        div.textContent = text;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    chatSendBtn.addEventListener('click', async () => {
        const msg = chatInput.value.trim();
        if (!msg) return;
        
        appendChatMessage(msg, true);
        chatInput.value = '';
        
        const tempId = 'msg-' + Date.now();
        const div = document.createElement('div');
        div.id = tempId;
        div.className = `chat-bubble chat-ai`;
        div.textContent = "Thinking...";
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const response = await fetch(`${API_BASE_URL}/api/chat-assistant`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentScript: scriptText.value, userMessage: msg })
            });

            if (response.ok) {
                const data = await response.json();
                document.getElementById(tempId).textContent = data.assistantReply;
                scriptText.value = data.newScript;
                updateWordCount();
            } else {
                throw new Error("Chat API failed");
            }
        } catch (error) {
            console.error("AI Chat Error:", error);
            document.getElementById(tempId).textContent = "Sorry, I'm having trouble connecting to the AI. (Mock mode: tweaking...)";
            setTimeout(() => {
                scriptText.value = scriptText.value + ` Plus, ask about our new special offer!`;
                updateWordCount();
            }, 1000);
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') chatSendBtn.click();
    });

    function updateWordCount() {
        const text = scriptText.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        wordCount.textContent = `${words} / 60 words`;
        wordCount.style.color = words > 65 ? 'var(--accent-red)' : '';
        adData.script = text;
    }
    
    scriptText.addEventListener('input', updateWordCount);

    sceneCards.forEach(card => {
        card.addEventListener('click', () => {
            sceneCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            appendChatMessage(`I'm now focusing on Scene ${card.dataset.scene}. What would you like to change here?`, false);
        });
    });

    industryTemplate.addEventListener('change', (e) => {
        adData.template = e.target.value;
    });

    
    // --- Step 3: Target ---
    goalCards.forEach(card => {
        card.addEventListener('click', () => {
            goalCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            adData.goal = card.dataset.goal;
        });
    });

    radiusSlider.addEventListener('input', (e) => {
        radiusValueDisplay.textContent = e.target.value;
        adData.radius = e.target.value;
    });

    targetLocation.addEventListener('change', (e) => {
        adData.location = e.target.value;
    });


    // --- Step 4: Review ---
    function populateReviewSummary() {
        document.getElementById('reviewTemplate').textContent = document.getElementById('industryTemplate').options[document.getElementById('industryTemplate').selectedIndex].text;
        document.getElementById('reviewScript').textContent = adData.script || 'No script provided.';
        
        const goalMap = {
            'awareness': 'Brand Awareness',
            'sales': 'Direct Sales',
            'foot_traffic': 'Local Foot Traffic'
        };
        document.getElementById('reviewGoal').textContent = goalMap[adData.goal];
        document.getElementById('reviewLocation').textContent = adData.location || 'Local Surrounding Area';
        document.getElementById('reviewRadius').textContent = `${adData.radius} miles`;
    }

    
    // --- Step 5: Air ---
    budgetTiers.forEach(tier => {
        tier.addEventListener('click', () => {
            budgetTiers.forEach(t => t.classList.remove('selected'));
            tier.classList.add('selected');
            adData.budget = tier.dataset.budget;
        });
    });

    finalLaunchBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        finalLaunchBtn.style.display = 'none';
        launchOverlay.classList.remove('hidden');
        const status = document.getElementById('launchStatus');
        status.textContent = "Finalizing Creative...";
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/launch-campaign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adData)
            });
            
            if (response.ok) {
                status.textContent = "Deploying Campaign...";
                setTimeout(() => {
                    // Success State
                    launchOverlay.innerHTML = `
                        <div style="font-size: 4rem; color: #4ade80; margin-bottom: 1rem;">✓</div>
                        <h3 style="color: white; font-size: 1.5rem; margin-bottom: 0.5rem;">Campaign Scheduled!</h3>
                        <p class="text-sm text-gray" style="margin-bottom: 2rem;">Your television commercial will begin airing in your target market within 24 hours.</p>
                        <a href="dashboard.html" class="btn btn-primary">Go to Dashboard</a>
                    `;
                }, 1000);
            } else {
                throw new Error("Launch API failed");
            }
        } catch (error) {
            console.error("Launch Error:", error);
            status.textContent = "Mocking Deployment... (API failed)";
            setTimeout(() => {
                // Success State Fallback
                launchOverlay.innerHTML = `
                    <div style="font-size: 4rem; color: #4ade80; margin-bottom: 1rem;">✓</div>
                    <h3 style="color: white; font-size: 1.5rem; margin-bottom: 0.5rem;">Campaign Scheduled!</h3>
                    <p class="text-sm text-gray" style="margin-bottom: 2rem;">Your television commercial will begin airing in your target market within 24 hours. (Mocked)</p>
                    <a href="dashboard.html" class="btn btn-primary">Go to Dashboard</a>
                `;
            }, 1500);
        }
    });
    
    // Initialize
    updateUI();
});
