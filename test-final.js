const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const realEstateTemplate = require('./netlify/functions/templates/real_estate.js');

async function run() {
    const creatomatePayload = {
      output_format: "mp4",
      source: realEstateTemplate
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
    console.log("Initial response:", data);
    
    if (data[0]?.id) {
       let isDone = false;
       while (!isDone) {
           await new Promise(r => setTimeout(r, 2000));
           const statusRes = await fetch(`https://api.creatomate.com/v1/renders/${data[0].id}`, {
               headers: { 'Authorization': `Bearer ${process.env.CREATOMATE_API_KEY}` }
           });
           const statusData = await statusRes.json();
           if (statusData.status === 'succeeded') {
               console.log(`SUCCESS! URL:`, statusData.url);
               isDone = true;
           } else if (statusData.status === 'failed') {
               console.log(`FAILED:`, statusData.error_message);
               isDone = true;
           }
       }
    }
}
run();
