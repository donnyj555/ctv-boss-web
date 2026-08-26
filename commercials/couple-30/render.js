// Renders the "Couple" :30 spot through Creatomate.
//
//   node commercials/couple-30/render.js
//   node commercials/couple-30/render.js commercials/couple-30/modifications.example.json
//
// With no modifications file the template renders against the Creatomate demo
// clips, which is the fast way to check timing, VO pacing and the endcard
// before any real footage exists.

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const template = require('./couple_30_template.json');

const apiKey = process.env.CREATOMATE_API_KEY;
if (!apiKey) {
  console.error('Missing CREATOMATE_API_KEY in .env');
  process.exit(1);
}

const modificationsPath = process.argv[2];
const modifications = modificationsPath
  ? JSON.parse(fs.readFileSync(modificationsPath, 'utf8'))
  : {};

async function render() {
  const response = await fetch('https://api.creatomate.com/v1/renders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      output_format: 'mp4',
      modifications,
      source: template,
    }),
  });

  const data = await response.json();
  const id = data[0]?.id;
  if (!id) {
    console.error('Render was rejected:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log(`Rendering ${id}...`);

  for (let attempt = 0; attempt < 60; attempt++) {
    await new Promise((r) => setTimeout(r, 3000));

    const statusRes = await fetch(`https://api.creatomate.com/v1/renders/${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const status = await statusRes.json();

    if (status.status === 'succeeded') {
      console.log('Done:', status.url);
      return;
    }
    if (status.status === 'failed') {
      console.error('Render failed:', status.error_message);
      process.exit(1);
    }
  }

  console.error('Timed out waiting on the render. Check the Creatomate dashboard.');
  process.exit(1);
}

render().catch((err) => {
  console.error(err);
  process.exit(1);
});
