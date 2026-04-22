const path = require('path');
const realEstateTemplate = require('./netlify/functions/templates/real_estate.js');
console.log(JSON.stringify(realEstateTemplate.elements, null, 2));
