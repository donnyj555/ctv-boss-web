const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const realEstateTemplate = require('./netlify/functions/templates/real_estate.js');

async function testRootDrop(indexToDrop) {
    const templateCopy = JSON.parse(JSON.stringify(realEstateTemplate));
    const droppedName = templateCopy.elements[indexToDrop].name || templateCopy.elements[indexToDrop].type;
    
    // Drop the node
    templateCopy.elements.splice(indexToDrop, 1);

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
       console.log(`Failed dropping ${droppedName}:`, data);
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
            console.log(`SUCCESS dropping ${droppedName}!`);
            return true;
        } else if (statusData.status === 'failed') {
            console.log(`FAILED dropping ${droppedName}:`, statusData.error_message);
            return false;
        }
        attempts++;
    }
    return false;
}

async function run() {
    for (let i = 0; i < realEstateTemplate.elements.length; i++) {
        console.log(`Testing template without root element at index ${i}...`);
        await testRootDrop(i);
    }
}
run();
