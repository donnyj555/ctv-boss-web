const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const realEstateTemplate = require('./netlify/functions/templates/real_estate.js');

async function testSceneCount(count) {
    const templateCopy = JSON.parse(JSON.stringify(realEstateTemplate));
    // The track wrapper
    const track = templateCopy.elements[2];
    track.elements = track.elements.slice(0, count);

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
       console.log(`Failed immediately at ${count} scenes:`, data);
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
            console.log(`SUCCESS at ${count} scenes!`);
            return true;
        } else if (statusData.status === 'failed') {
            console.log(`FAILED at ${count} scenes:`, statusData.error_message);
            return false;
        }
        attempts++;
    }
    return false;
}

async function run() {
    for (let c = 1; c <= 7; c++) {
        console.log(`Testing ${c} scenes inside track...`);
        const success = await testSceneCount(c);
        if (!success) break;
    }
}
run();
