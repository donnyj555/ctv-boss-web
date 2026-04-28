require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Import our Netlify functions so we can run them directly in Express
const extractAssetsFunction = require('./netlify/functions/extract-assets');
const generateScriptFunction = require('./netlify/functions/generate-script');
const generateVideoFunction = require('./netlify/functions/generate-video');
const launchCampaignFunction = require('./netlify/functions/launch-campaign');
const chatAssistantFunction = require('./netlify/functions/chat-assistant');

// Create Express wrappers for the Netlify handler format
const runNetlifyFunction = (handler) => async (req, res) => {
    const event = {
        httpMethod: req.method,
        body: JSON.stringify(req.body),
        headers: req.headers
    };
    
    try {
        const response = await handler(event, {});
        res.status(response.statusCode).set(response.headers || {}).send(response.body);
    } catch (e) {
        res.status(500).send(e.toString());
    }
};

app.post('/api/extract-assets', runNetlifyFunction(extractAssetsFunction.handler));
app.post('/api/generate-script', runNetlifyFunction(generateScriptFunction.handler));
app.post('/api/generate-video', runNetlifyFunction(generateVideoFunction.handler));
app.post('/api/launch-campaign', runNetlifyFunction(launchCampaignFunction.handler));
app.post('/api/chat-assistant', runNetlifyFunction(chatAssistantFunction.handler));

app.listen(port, '0.0.0.0', () => {
  console.log(`CTV Homes Backend API is running on port ${port}`);
});
