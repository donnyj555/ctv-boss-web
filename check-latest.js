require('dotenv').config();
const fetch = require('node-fetch');

async function checkRenders() {
  const res = await fetch('https://api.creatomate.com/v1/renders?limit=3', {
    headers: { 'Authorization': `Bearer ${process.env.CREATOMATE_API_KEY}` }
  });
  const renders = await res.json();
  
  renders.forEach((r, i) => {
    console.log(`\n--- Render ${i+1} ---`);
    console.log(`ID: ${r.id}`);
    console.log(`Status: ${r.status}`);
    console.log(`Duration: ${r.duration}`);
    console.log(`Template ID: ${r.template_id}`);
    console.log(`Modifications:`, JSON.stringify(r.modifications, null, 2));
    console.log(`Error Message:`, r.error_message || "None");
    if(r.source) console.log(`Source:`, JSON.stringify(r.source, null, 2));
  });
}

checkRenders().catch(console.error);
