const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const oldTemplate = require('/Users/donjordan/.gemini/antigravity/brain/ff0b44bf-cf52-4879-9906-ad293eab5fe3/real_estate_template.json');

async function testOldCount(count) {
    const templateCopy = JSON.parse(JSON.stringify(oldTemplate));
    // Remove the audio element
    if (templateCopy.elements[0].type === "audio") {
        templateCopy.elements.splice(0, 1);
    }
    templateCopy.elements = templateCopy.elements.slice(0, count);

    const creatomatePayload = {
      output_format: "mp4",
      modifications: {},
      source: templateCopy
    };

    const response = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CREATOMATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(creatomatePayload)
    });

    const data = await response.json();
    if (!data[0]?.id) {
       console.log(`Failed immediately at ${count} elements:`, data);
       return false;
    }
    
    let isDone = false;
    let attempts = 0;
    while (!isDone && attempts < 15) {
        await new Promise(r => setTimeout(r, 2000));
        const statusRes = await fetch(`https://api.creatomate.com/v1/renders/${data[0].id}`, {
            headers: { 'Authorization': `Bearer ${process.env.CREATOMATE_API_KEY}` }
        });
        const statusData = await statusRes.json();
        if (statusData.status === 'succeeded') {
            console.log(`SUCCESS at ${count} elements!`);
            return true;
        } else if (statusData.status === 'failed') {
            console.log(`FAILED at ${count} elements:`, statusData.error_message);
            return false;
        }
        attempts++;
    }
    return false;
}

async function run() {
    for (let c = 1; c <= oldTemplate.elements.length; c++) {
        console.log(`Testing ${c} elements in old template...`);
        const success = await testOldCount(c);
        if (!success) break;
    }
}
run();
