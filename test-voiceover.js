const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const realEstateTemplate = require('./netlify/functions/templates/real_estate.js');

async function testVoiceover() {
    const templateCopy = JSON.parse(JSON.stringify(realEstateTemplate));
    // Test just the Voiceover element which is at elements[1]
    templateCopy.elements = [realEstateTemplate.elements[1]];

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
    console.log(data);
}
testVoiceover();
