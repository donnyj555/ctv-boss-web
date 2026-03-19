const fetch = require('node-fetch');
require('dotenv').config({path: './.env'});

async function testVideo() {
    const payload = {
        businessName: 'Don Real Estate',
        script: 'Welcome to this beautiful new property. Buy it now!',
        cta: 'Visit today',
        images: [
            'https://via.placeholder.com/1920x1080.png?text=Img1',
            'https://via.placeholder.com/1920x1080.png?text=Img2',
            'https://via.placeholder.com/1920x1080.png?text=Img3'
        ],
        template: 'real_estate',
        duration: '30'
    };

    console.log("Sending payload:", JSON.stringify(payload, null, 2));

    try {
        const { handler } = require('./netlify/functions/generate-video.js');
        const res = await handler({
            httpMethod: 'POST',
            body: JSON.stringify(payload)
        });
        
        console.log("Response:", res);
    } catch (e) {
        console.error("Error:", e);
    }
}

testVideo();
