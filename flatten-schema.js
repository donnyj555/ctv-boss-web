const fs = require('fs');
const path = './netlify/functions/templates/real_estate.js';

const template = require(path);

// The track wrapper is currently at index 1 of the root elements
const trackWrapper = template.elements[1];
if (trackWrapper && trackWrapper.type === "track") {
    // Extract the individual scenes out of the wrapper
    const scenes = trackWrapper.elements;
    
    // Remove the wrapper and splice the scenes directly into elements at index 1
    template.elements.splice(1, 1, ...scenes);
    
    // Write back as a module format
    const newContent = "module.exports = " + JSON.stringify(template, null, 2) + ";\n";
    fs.writeFileSync(path, newContent);
    console.log("Successfully permanently flattened the track wrapper!");
} else {
    console.log("No track wrapper found, presumably already flattened.");
}
