const fs = require('fs');
const path = './netlify/functions/templates/real_estate.js';

const template = require(path);

// The scenes are currently at template.elements[2] to [8]
const scenes = template.elements.splice(2, 7);

const trackWrapper = {
    type: "track",
    elements: scenes
};

template.elements.push(trackWrapper);

const newContent = "module.exports = " + JSON.stringify(template, null, 2) + ";\n";
fs.writeFileSync(path, newContent);
console.log("Successfully un-flattened the track wrapper!");
