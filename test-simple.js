const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const simplePayload = {
  output_format: "mp4",
  modifications: {},
  source: {
    "name": "Test",
    "format": "16:9",
    "frame_rate": 30,
    "duration": 5,
    "elements": [
      {
        "type": "text",
        "text": "Hello World",
        "duration": 5
      }
    ]
  }
};

async function run() {
    const response = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CREATOMATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(simplePayload)
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
            console.log(`SUCCESS! URL:`, statusData.url);
            return true;
        } else if (statusData.status === 'failed') {
            console.log(`FAILED:`, statusData.error_message);
            return false;
        }
        attempts++;
    }
}
run();
