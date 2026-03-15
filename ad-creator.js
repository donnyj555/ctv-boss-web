/**
 * Ad Creator Wizard Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Environment Setup ---
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://127.0.0.1:5001' 
        : 'https://ctv-boss-backend.onrender.com';

    // --- State variables ---
    let currentStep = 1;
    const totalSteps = 3;
    
    // --- Elements ---
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    
    const extractBtn = document.getElementById('extractBtn');
    const aiScriptBtn = document.getElementById('aiScriptBtn');
    const generateVideoBtn = document.getElementById('generateVideoBtn');
    
    // --- Navigation Logic ---
    function updateUI() {
        // Update steps visibility
        for (let i = 1; i <= totalSteps; i++) {
            const stepEl = document.getElementById(`step-${i}`);
            if (i === currentStep) {
                stepEl.classList.add('active');
            } else {
                stepEl.classList.remove('active');
            }
        }
        
        // Update indicators
        for (let i = 1; i <= totalSteps; i++) {
            const ind = document.getElementById(`indicator-${i}`);
            ind.classList.remove('active', 'completed');
            if (i < currentStep) {
                ind.classList.add('completed');
            } else if (i === currentStep) {
                ind.classList.add('active');
            }
        }
        
        // Update buttons
        if (currentStep === 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'inline-flex';
            nextBtn.textContent = 'Continue to Template';
        } else if (currentStep === 2) {
            prevBtn.style.display = 'inline-flex';
            nextBtn.style.display = 'inline-flex';
            nextBtn.textContent = 'Continue to Review';
        } else if (currentStep === 3) {
            prevBtn.style.display = 'inline-flex';
            nextBtn.style.display = 'none'; // Replaced by Generate button inside step 3
        }
    }
    
    nextBtn.addEventListener('click', () => {
        if (currentStep < totalSteps) {
            currentStep++;
            updateUI();
        }
    });
    
    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateUI();
        }
    });
    
    // --- Step 1 functionality ---
    extractBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const urlInput = document.getElementById('websiteUrl').value;
        if (!urlInput) {
            alert('Please enter a website URL first.');
            return;
        }
        
        const originalText = extractBtn.textContent;
        extractBtn.textContent = 'Extracting...';
        extractBtn.disabled = true;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/extract-assets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: urlInput })
            });
            
            if (!response.ok) throw new Error("API request failed");
            
            const data = await response.json();
            
            // Render the extracted assets into the UI
            const container = document.getElementById('extractedAssetsContainer');
            const logoRef = document.getElementById('scrapedLogoRef');
            const imagesGrid = document.getElementById('scrapedImagesGrid');
            
            // Set Logo
            if (data.logo) {
                logoRef.src = data.logo;
            } else {
                logoRef.src = '';
                logoRef.alt = 'No logo found';
            }
            
            // Build Images Grid
            imagesGrid.innerHTML = '';
            if (data.images && data.images.length > 0) {
                data.images.forEach(imgUrl => {
                    const img = document.createElement('img');
                    img.src = imgUrl;
                    img.style.height = '100px';
                    img.style.width = '100px';
                    img.style.objectFit = 'contain';
                    img.style.borderRadius = '8px';
                    img.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    img.style.border = '1px solid rgba(255,255,255,0.1)';
                    imagesGrid.appendChild(img);
                });
            } else {
                imagesGrid.innerHTML = '<span class="text-muted text-sm" style="line-height: 100px;">No images found</span>';
            }
            
            // Show the container
            container.classList.remove('hidden');
            
            extractBtn.textContent = 'Assets Extracted! ✓';
            extractBtn.style.backgroundColor = '#4ade80';
            extractBtn.style.borderColor = '#4ade80';
            
            setTimeout(() => {
                extractBtn.textContent = originalText;
                extractBtn.disabled = false;
                extractBtn.style.backgroundColor = '';
                extractBtn.style.borderColor = '';
                // The user can now review the assets and click "Continue to Template" manually
            }, 2000);
            
        } catch (error) {
            console.error("Extraction error:", error);
            alert("Failed to extract assets from that URL. Does the website block bots?");
            extractBtn.textContent = originalText;
            extractBtn.disabled = false;
        }
    });
    
    // Upload Area Interactivity (Mock)
    const setupUploadArea = (areaId, fileInputId) => {
        const area = document.getElementById(areaId);
        const input = document.getElementById(fileInputId);
        
        if(!area || !input) return;
        
        area.addEventListener('click', () => {
            input.click();
        });
        
        input.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const count = e.target.files.length;
                area.innerHTML = `<div style="font-size: 2rem; margin-bottom: 0.5rem; color: #4ade80;">✓</div><span style="color:#4ade80;">${count} file(s) selected</span>`;
                area.style.borderColor = '#4ade80';
                area.style.background = 'rgba(74, 222, 128, 0.05)';
            }
        });
    };
    
    setupUploadArea('logoUploadArea', 'logoFile');
    setupUploadArea('imagesUploadArea', 'imagesFile');
    
    // --- Step 2 functionality ---
    // Template selection
    const templateCards = document.querySelectorAll('.template-card');
    templateCards.forEach(card => {
        card.addEventListener('click', () => {
            templateCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
    });
    
    // AI Script generation via Python Backend
    aiScriptBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const originalText = aiScriptBtn.textContent;
        aiScriptBtn.textContent = 'Generating...';
        aiScriptBtn.disabled = true;
        
        const topicEl = document.getElementById('adTopic');
        const voiceDirectionEl = document.getElementById('voiceDirection');
        const ctaEl = document.getElementById('ctaText');
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/generate-script`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: topicEl ? topicEl.value : '',
                    voiceDirection: voiceDirectionEl ? voiceDirectionEl.options[voiceDirectionEl.selectedIndex].text : '',
                    cta: ctaEl ? ctaEl.value : ''
                })
            });
            
            if (!response.ok) throw new Error("API request failed");
            
            const data = await response.json();
            if (data.script) {
                document.getElementById('scriptText').value = data.script;
                document.getElementById('scriptText').dispatchEvent(new Event('input'));
            } else if (data.error) {
                alert("Error from script generator: " + data.error);
            }
        } catch (error) {
            console.error(error);
            alert("Could not connect to the backend script generator. Is the Netlify dev server running?");
        } finally {
            aiScriptBtn.textContent = originalText;
            aiScriptBtn.disabled = false;
        }
    });
    
    // Word counter
    const scriptText = document.getElementById('scriptText');
    const wordCount = document.getElementById('wordCount');
    
    scriptText.addEventListener('input', () => {
        const text = scriptText.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        wordCount.textContent = `${words} / 60 words`;
        
        if (words > 70) {
            wordCount.style.color = 'var(--accent-red)';
        } else {
            wordCount.style.color = '';
        }
    });

    // Presenter Style / Avatar Options Visibility
    const presenterStyle = document.getElementById('presenterStyle');
    const avatarModelContainer = document.getElementById('avatarModelContainer');
    if (presenterStyle && avatarModelContainer) {
        presenterStyle.addEventListener('change', (e) => {
            if (e.target.value === 'avatar') {
                avatarModelContainer.style.display = 'block';
            } else {
                avatarModelContainer.style.display = 'none';
            }
        });
    }
    
    // --- Step 3 functionality ---
    generateVideoBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const placeholder = document.getElementById('previewPlaceholder');
        const overlay = document.getElementById('generatingOverlay');
        const status = document.getElementById('generationStatus');
        const progress = document.getElementById('generationProgress');
        const player = document.getElementById('finalVideoPlayer');
        const postActions = document.getElementById('postGenerationActions');
        
        if (!placeholder || !overlay || !status || !progress || !player || !postActions) {
            console.error("Missing elements in generation step");
            return;
        }

        placeholder.style.display = 'none';
        overlay.classList.remove('hidden');
        
        // Visual progress stages simulation
        const stages = [
            { t: 0, text: "Analyzing Assets...", p: "0%" },
            { t: 1500, text: "Synthesizing AI Voiceover...", p: "25%" },
            { t: 3000, text: "Applying Visual Template...", p: "50%" },
            { t: 4500, text: "Rendering Frames...", p: "80%" }
        ];
        
        stages.forEach(stage => {
            setTimeout(() => {
                if(!overlay.classList.contains('hidden')) {
                    status.textContent = stage.text;
                    progress.textContent = stage.p;
                }
            }, stage.t);
        });
        
        // Gather form data to send to the backend
        const topicEl = document.getElementById('adTopic');
        const languageEl = document.getElementById('adLanguage');
        const durationEl = document.getElementById('adDuration');
        const voiceDirectionEl = document.getElementById('voiceDirection');
        const presenterStyleEl = document.getElementById('presenterStyle');
        const avatarIdEl = document.getElementById('avatarId');
        const scriptEl = document.getElementById('scriptText');
        const ctaEl = document.getElementById('ctaText');

        const topic = topicEl ? topicEl.value : '';
        const language = languageEl ? languageEl.value : 'en-US';
        const duration = durationEl ? durationEl.value : '30';
        const voiceDirection = voiceDirectionEl ? voiceDirectionEl.value : '';
        const presenterStyle = presenterStyleEl ? presenterStyleEl.value : 'voiceover';
        const avatarId = avatarIdEl ? avatarIdEl.value : '';
        const script = scriptEl ? scriptEl.value : '';
        const cta = ctaEl ? ctaEl.value : '';

        try {
            // Send payload to Node Express API mapped to Creatomate
            const response = await fetch(`${API_BASE_URL}/api/generate-video`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    script: script,
                    template: document.querySelector('.template-card.selected')?.dataset.template || 'modern',
                    voice: voiceDirectionEl ? voiceDirectionEl.value : 'rachel',
                    presenterStyle: presenterStyle,
                    avatarId: avatarId
                })
            });
            
            if (!response.ok) throw new Error("API request failed");
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            status.textContent = "Finalizing Cloud Export (Creatomate)...";
            progress.textContent = "95%";
            
            // The backend handles the polling now, so `await fetch()` above doesn't resolve 
            // until the video is physically ready (status: 'succeeded').
            overlay.classList.add('hidden');
            
            // Show the returned video from the API
            player.src = data.url;
            player.hidden = false;
            postActions.style.display = 'block';
            
            // Auto play
            player.play().catch(e => console.log("Auto-play prevented", e));
            
        } catch (error) {
            console.error("Error generating video sync sequence:", error);
            overlay.classList.add('hidden');
            placeholder.style.display = 'block';
            alert("Failed to generate video via Backend. " + error.message);
        }
    });
    
    // Initialize
    updateUI();
});
