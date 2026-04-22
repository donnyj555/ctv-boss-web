const fs = require('fs');
const path = './netlify/functions/templates/real_estate.js';

let content = fs.readFileSync(path, 'utf8');

// Fix border radius
content = content.replace(/"5vmax"/g, '"100%"');

// Remove broken audio track (403 forbidden)
content = content.replace(/"source": "https:\/\/creatomate-static.s3.amazonaws.com\/demo\/music1.wav",/, '');

fs.writeFileSync(path, content);
console.log("Fixed invalid schema values!");
