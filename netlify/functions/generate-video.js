const fetch = require('node-fetch');
const realEstateTemplate = require('./templates/real_estate.js');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { businessName = '', script = '', cta = '', images = [], voice = 'rachel', template = 'real_estate', duration = '30' } = data;

    if (!process.env.CREATOMATE_API_KEY || process.env.CREATOMATE_API_KEY === "PASTE_YOUR_CREATOMATE_KEY_HERE") {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Creatomate API key is missing or invalid in .env file." })
        };
    }

    if (!script) {
        return { statusCode: 400, body: JSON.stringify({ error: "Script text is required" }) };
    }

    console.log("Sending render request to Creatomate...");
    
    // Map industry selections + duration to specific Creatomate template UUIDs
    // The keys are structured as: {templateName}_{duration}
    const templateMap = {
      'real_estate_30': 'b573fbe0-e1f2-4edc-a7fb-f358ee95bb0a', // Reverting broken UUID
      'real_estate_15': 'b573fbe0-e1f2-4edc-a7fb-f358ee95bb0a', 
      'restaurant_30': '11a7819a-1c77-4741-a39e-b8f3e26959ec', 
      'restaurant_15': '11a7819a-1c77-4741-a39e-b8f3e26959ec', 
      'home_services_30': 'd003b551-8628-42f8-a9ee-ea94e608208d',
      'home_services_15': 'd003b551-8628-42f8-a9ee-ea94e608208d',
      'retail_30': 'RETAIL_TEMPLATE_UUID_HERE',
      'retail_15': 'RETAIL_TEMPLATE_UUID_HERE',
      'fitness_30': 'FITNESS_TEMPLATE_UUID_HERE',
      'fitness_15': 'FITNESS_TEMPLATE_UUID_HERE',
      'corporate_30': 'CORPORATE_TEMPLATE_UUID_HERE',
      'corporate_15': 'CORPORATE_TEMPLATE_UUID_HERE'
    };
    
    // Construct the lookup key, e.g. "real_estate_30"
    const mapKey = `${template}_${duration}`;
    const templateId = templateMap[mapKey] || templateMap['real_estate_30'];
    
    // Smart Fallback images using zero-config keyword stock libraries matching the industry
    let defaultImages = [];
    
    // Dynamic Stock Video fetching via Pexels
    if (process.env.PEXELS_API_KEY) {
        try {
            console.log(`Fetching dynamic stock videos for ${template}...`);
            let query = 'business';
            if (template === 'real_estate') query = "luxury house exterior";
            else if (template === 'restaurant') query = "fine dining food chef";
            else if (template === 'retail') query = "retail shopping clothing";
            
            const pexelsRes = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=4&orientation=landscape`, {
                headers: { 'Authorization': process.env.PEXELS_API_KEY }
            });
            if (pexelsRes.ok) {
                const pexelsData = await pexelsRes.json();
                if (pexelsData.videos && pexelsData.videos.length >= 4) {
                    defaultImages = pexelsData.videos.slice(0, 4).map(v => {
                        // find the HD quality link or fallback to first
                        const hdFile = v.video_files.find(f => f.quality === 'hd') || v.video_files[0];
                        return hdFile.link;
                    });
                }
            }
        } catch (e) {
            console.error("Pexels fetch failed, falling back to static libraries", e);
        }
    }
    
    if (defaultImages.length === 0) {
        if (template === 'real_estate') {
            defaultImages = [
                "https://loremflickr.com/1920/1080/mansion,exterior?random=1",
                "https://loremflickr.com/1920/1080/kitchen,interior?random=2",
                "https://loremflickr.com/1920/1080/livingroom,modern?random=3",
                "https://loremflickr.com/1920/1080/backyard,pool?random=4"
            ];
        } else if (template === 'restaurant') {
            defaultImages = [
                "https://loremflickr.com/1920/1080/restaurant,food?random=1",
                "https://loremflickr.com/1920/1080/chef,cooking?random=2",
                "https://loremflickr.com/1920/1080/dining,table?random=3",
                "https://loremflickr.com/1920/1080/delicious,meal?random=4"
            ];
        } else if (template === 'retail') {
            defaultImages = [
                "https://loremflickr.com/1920/1080/boutique,shopping?random=1",
                "https://loremflickr.com/1920/1080/apparel,clothing?random=2",
                "https://loremflickr.com/1920/1080/store,interior?random=3",
                "https://loremflickr.com/1920/1080/happy,customer?random=4"
            ];
        } else {
            defaultImages = [
                "https://creatomate-static.s3.amazonaws.com/demo/video1.mp4",
                "https://creatomate-static.s3.amazonaws.com/demo/video2.mp4",
                "https://creatomate-static.s3.amazonaws.com/demo/video1.mp4",
                "https://creatomate-static.s3.amazonaws.com/demo/video2.mp4"
            ];
        }
    }
    
    // Elegant Intermixing Strategy: 
    // Alternate between Pexels HD Stock Videos and the User's scraped images from their website
    const finalMedia = [];
    finalMedia[0] = defaultImages[0] || "https://creatomate-static.s3.amazonaws.com/demo/video1.mp4"; // Stock Video
    finalMedia[1] = images[0] || defaultImages[1] || finalMedia[0]; // User's 1st image
    finalMedia[2] = defaultImages[1] || defaultImages[0] || finalMedia[0]; // Stock Video
    finalMedia[3] = images[1] || defaultImages[2] || finalMedia[0]; // User's 2nd image 
    finalMedia[4] = defaultImages[2] || defaultImages[1] || finalMedia[0]; // Stock Video
    finalMedia[5] = images[2] || images[0] || defaultImages[3] || finalMedia[0]; // User's Logo/CTA image

    // Build the payload by matching the template's required modification keys
    const creatomatePayload = {
      output_format: "mp4",
      modifications: {
        "Voiceover": script,
        "Subtext": cta || "Contact Us Today!",
        "Video-1": finalMedia[0],
        "Video-2": finalMedia[1],
        "Video-3": finalMedia[2],
        "Video-4": finalMedia[3],
        "Video-5": finalMedia[4],
        "Video-6": finalMedia[5],
        "Picture": images[0] || finalMedia[1],
        "Brand-Name": businessName || "CTV Boss Client",
        "Phone-Number": "555-123-4567",
        "Email": "info@ctvbossclient.com",
        "Name": "" // Clear placeholder
      }
    };

    if (template === 'real_estate') {
        creatomatePayload.source = realEstateTemplate;
        delete creatomatePayload.modifications["Picture"];
        delete creatomatePayload.modifications["Name"];
    } else {
        creatomatePayload.template_id = templateId;
    }

    const response = await fetch('https://api.creatomate.com/v1/renders', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.CREATOMATE_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(creatomatePayload)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Creatomate API Error: ${response.status} ${errText}`);
    }

    const renderData = await response.json();
    
    // Creatomate returns a render array. We need the ID and status.
    if (Array.isArray(renderData) && renderData.length > 0) {
        const renderId = renderData[0].id;
        let status = renderData[0].status;
        let url = renderData[0].url;
        
        // Poll Creatomate until the video finishes rendering
        let attempts = 0;
        const maxAttempts = 30; // Max 60 seconds (2s * 30)
        
        while (status !== 'succeeded' && status !== 'failed' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2 seconds
            
            const pollRes = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.CREATOMATE_API_KEY}`
                }
            });
            
            if (pollRes.ok) {
                const pollData = await pollRes.json();
                status = pollData.status;
                
                // Force .mp4 extension on the returned URL to prevent frontend player failure 
                // if Creatomate tries to return the thumbnail preview URL string.
                if (pollData.url) {
                    url = pollData.url.replace('.png', '.mp4').replace('.jpg', '.mp4');
                }
            }
            attempts++;
        }
        
        if (status === 'failed') {
             throw new Error("Creatomate render failed.");
        }
         
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({
                render_id: renderId,
                status: status,
                url: url,
                message: "Render complete."
            })
        };
    } else {
        throw new Error("Unexpected API response from Creatomate");
    }

  } catch (error) {
    console.error("Video Generation Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate video via Cloud API. " + error.message }),
    };
  }
};
