const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    let targetUrl = data.url;

    if (!targetUrl) {
      return { statusCode: 400, body: JSON.stringify({ error: "URL is required" }) };
    }

    // Ensure URL has http/https
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    // Fetch the HTML content
    console.log(`Scraping assets from: ${targetUrl}`);
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000 // 10 second timeout
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const assets = {
      logo: null,
      images: []
    };

    const baseUrl = new URL(targetUrl).origin;

    // Helper to resolve relative URLs to absolute
    const makeAbsolute = (urlStr) => {
      if (!urlStr) return null;
      if (urlStr.startsWith('data:')) return urlStr;
      try {
        return new URL(urlStr, baseUrl).href;
      } catch (e) {
        return null;
      }
    };

    // 1. Try to find the OpenGraph Image (often highest quality)
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      const absUrl = makeAbsolute(ogImage);
      if (absUrl) assets.images.push(absUrl);
    }

    // 2. Try to find Twitter Card Image
    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    if (twitterImage) {
        const absUrl = makeAbsolute(twitterImage);
        if (absUrl && !assets.images.includes(absUrl)) assets.images.push(absUrl);
    }

    // 3. Try to find a Favicon/App Icon
    const appleIcon = $('link[rel="apple-touch-icon"]').attr('href');
    if (appleIcon) {
        const absUrl = makeAbsolute(appleIcon);
        if (absUrl) assets.logo = absUrl; // Good fallback for logo
    }

    // 4. Search all images for something that looks like a logo
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      const alt = $(el).attr('alt') || '';
      const className = $(el).attr('class') || '';
      const id = $(el).attr('id') || '';

      if (!src) return;

      const absUrl = makeAbsolute(src);
      if (!absUrl) return;

      // Check if this image is likely the primary logo
      const isLikelyLogo = 
        alt.toLowerCase().includes('logo') || 
        className.toLowerCase().includes('logo') || 
        id.toLowerCase().includes('logo') ||
        src.toLowerCase().includes('logo');

      if (isLikelyLogo && !assets.logo) {
        assets.logo = absUrl;
      } else if (!assets.images.includes(absUrl) && assets.images.length < 5) {
          // Avoid grabbing 1x1 tracking pixels
          const width = $(el).attr('width');
          const height = $(el).attr('height');
          if ((!width || parseInt(width) > 50) && (!height || parseInt(height) > 50)) {
            assets.images.push(absUrl);
          }
      }
    });

    // If no explicit logo found, fallback to og:image or first extracted image
    if (!assets.logo && assets.images.length > 0) {
        assets.logo = assets.images[0];
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(assets)
    };

  } catch (error) {
    console.error("Scraping Error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to extract assets. " + error.message })
    };
  }
};
