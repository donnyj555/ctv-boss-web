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
    
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
    };

    let html = '';
    
    try {
        // Try direct fetch first
        const response = await axios.get(targetUrl, {
            headers,
            timeout: 10000 // 10 second timeout
        });
        html = response.data;
    } catch (directError) {
        console.log(`Direct fetch failed (${directError.message}), trying proxy fallback...`);
        // If direct fetch fails (likely 403 Forbidden / bot block), try via corsproxy
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        const proxyResponse = await axios.get(proxyUrl, {
            headers,
            timeout: 15000 // slightly longer timeout for proxy
        });
        html = proxyResponse.data;
    }
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
          // Avoid grabbing 1x1 tracking pixels, UI icons, or social logos.
          // Only grab images explicitly defined as large, or without dimensions (gamble, but usually hero images lack inline w/h)
          const widthStr = $(el).attr('width');
          const heightStr = $(el).attr('height');
          
          let isValid = false;
          if (widthStr && heightStr) {
              const w = parseInt(widthStr.replace(/[^0-9]/g, ''));
              const h = parseInt(heightStr.replace(/[^0-9]/g, ''));
              if (w >= 300 && h >= 200) {
                  isValid = true;
              }
          } else {
              // If no width/height attributes are provided, it might be a responsive hero image.
              // We'll allow it, but we skip common icon keywords in the URL or class
              const isIcon = src.includes('icon') || className.includes('icon') || src.includes('avatar');
              if (!isIcon) isValid = true;
          }
          
          if (isValid) {
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
