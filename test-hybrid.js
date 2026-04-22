const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const oldTemplate = require('/Users/donjordan/.gemini/antigravity/brain/ff0b44bf-cf52-4879-9906-ad293eab5fe3/real_estate_template.json');
const newTemplate = require('./netlify/functions/templates/real_estate.js');

async function testHybrid() {
    const templateCopy = JSON.parse(JSON.stringify(oldTemplate));
    // The old template has scenes at indexes 2, 3, 4, 5
    // The new template has scenes in elements[1].elements
    
    // Let's grab Scene-1 from the new template
    const newScene1 = newTemplate.elements[1].elements[0];
    
    // Replace old Scene-1 with new Scene-1
    templateCopy.elements[2] = newScene1;

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
       console.log(`Failed immediately:`, data);
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
            console.log(`SUCCESS!`);
            return true;
        } else if (statusData.status === 'failed') {
            console.log(`FAILED:`, statusData.error_message);
            return false;
        }
        attempts++;
    }
    return false;
}
testHybrid();
