const fs = require('fs');
const path = './netlify/functions/templates/real_estate.js';

const template = require(path);

// The audio element is at index 0. If it's an audio element without a source, delete it!
if (template.elements[0] && template.elements[0].type === "audio") {
    template.elements.splice(0, 1);
    const newContent = "module.exports = " + JSON.stringify(template, null, 2) + ";\n";
    fs.writeFileSync(path, newContent);
    console.log("Successfully removed blank audio element!");
}
