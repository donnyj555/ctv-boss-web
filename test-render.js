const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const realEstateTemplate = require('./netlify/functions/templates/real_estate.js');

async function testRender() {
    console.log("Starting test render via API...");
    
    // Simulate what generate-video.js does
    const template = 'real_estate';
    let defaultImages = [];
    
    if (process.env.PEXELS_API_KEY) {
        console.log("Fetching Pexels...");
        try {
            const pexelsRes = await fetch(`https://api.pexels.com/videos/search?query=luxury+house+exterior&per_page=4&orientation=landscape`, {
                headers: { 'Authorization': process.env.PEXELS_API_KEY }
            });
            const pexelsData = await pexelsRes.json();
            defaultImages = pexelsData.videos.map(v => v.video_files[0].link);
        } catch(e) { console.error(e); }
    }
    
    if (defaultImages.length === 0) {
        defaultImages = [
            "https://loremflickr.com/1920/1080/mansion,exterior?random=1",
            "https://loremflickr.com/1920/1080/kitchen,interior?random=2",
            "https://loremflickr.com/1920/1080/livingroom,modern?random=3",
            "https://loremflickr.com/1920/1080/backyard,pool?random=4"
        ];
    }

    const images = [
        "https://loremflickr.com/1920/1080/house?random=5",
        "https://loremflickr.com/1920/1080/house?random=6",
        "https://ui-avatars.com/api/?name=Brand",
    ];
    
    const finalMedia = [];
    finalMedia[0] = defaultImages[0] || "https://creatomate-static.s3.amazonaws.com/demo/video1.mp4"; // Stock
    finalMedia[1] = images[0] || defaultImages[1] || finalMedia[0]; // Scraped 1
    finalMedia[2] = defaultImages[1] || defaultImages[0] || finalMedia[0]; // Stock
    finalMedia[3] = images[1] || defaultImages[2] || finalMedia[0]; // Scraped 2
    finalMedia[4] = defaultImages[2] || defaultImages[1] || finalMedia[0]; // Stock
    finalMedia[5] = images[2] || defaultImages[3] || finalMedia[0]; // Scraped 3
    finalMedia[6] = images[3] || images[0] || defaultImages[3] || finalMedia[0]; // Scraped Logo/CTA

    const creatomatePayload = {
      output_format: "mp4",
      modifications: {},
      source: realEstateTemplate
    };

    console.log("MODS:", JSON.stringify(creatomatePayload.modifications, null, 2));

    const response = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CREATOMATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(creatomatePayload)
    });

    const data = await response.json();
    console.log("Render ID:", data[0]?.id || data);
    
    if (!data[0]?.id) return;
    
    let isDone = false;
    let attempts = 0;
    while (!isDone && attempts < 15) {
        await new Promise(r => setTimeout(r, 4000));
        const statusRes = await fetch(`https://api.creatomate.com/v1/renders/${data[0].id}`, {
            headers: { 'Authorization': `Bearer ${process.env.CREATOMATE_API_KEY}` }
        });
        const statusData = await statusRes.json();
        console.log("Status:", statusData.status);
        if (statusData.status === 'succeeded') {
            isDone = true;
            console.log("\nFINAL VIDEO URL:");
            console.log(statusData.url);
        } else if (statusData.status === 'failed') {
            console.log("FAILED:", statusData.error_message);
            isDone = true;
        }
        attempts++;
    }
}
testRender();
