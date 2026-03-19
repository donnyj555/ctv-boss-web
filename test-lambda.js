require('dotenv').config();
const handler = require('./netlify/functions/generate-video').handler;

async function test() {
  const event = {
    httpMethod: 'POST',
    body: JSON.stringify({
      businessName: "Test",
      script: "Testing",
      template: "real_estate",
      duration: "30"
    })
  };
  
  const ctx = {};
  
  console.log("Invoking handler...");
  const result = await handler(event, ctx);
  console.log("Result:", result);
}

test().catch(console.error);
