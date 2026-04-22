const fs = require('fs');
const path = './netlify/functions/templates/real_estate.js';
const template = require(path);

const animations = [
    { type: "text-reveal", split: "character" }, // Brand-Name
    { type: "text-slide", split: "word" },       // Feature-1
    { type: "text-scale", split: "word" },       // Feature-2
    { type: "text-appear", split: "character" }, // Feature-3
    { type: "text-reveal", split: "line" },      // Feature-4
    { type: "text-slide", split: "character" },  // Feature-5
    { type: "text-scale", split: "word" },       // Subtext
    { type: "text-slide", split: "character" },  // Phone-Number
    { type: "text-reveal", split: "character" }  // Email
];

let animIndex = 0;

template.elements.forEach(scene => {
    if (scene.elements) {
        scene.elements.forEach(el => {
            if (el.type === "text" && el.enter) {
                // Safely apply the next premium animation natively inside its enter array
                if (animIndex < animations.length) {
                    el.enter[0].type = animations[animIndex].type;
                    el.enter[0].split = animations[animIndex].split;
                    animIndex++;
                }
            }
        });
    }
});

const newContent = "module.exports = " + JSON.stringify(template, null, 2) + ";\n";
fs.writeFileSync(path, newContent);
console.log(`Successfully upgraded ${animIndex} text animations!`);
