const axios = require('axios');
const cheerio = require('cheerio');

const scrapeGrowlity = async (targetUrl) => {
  let url = targetUrl;
  try {
    const apiKey = process.env.SCRAPE_DO_API_KEY;
    url = apiKey 
      ? `https://api.scrape.do/?token=${apiKey}&url=${encodeURIComponent(targetUrl)}`
      : targetUrl;
      
    console.log(`Scraping URL: ${targetUrl} (via scrape.do: ${!!apiKey})`);
    
    const { data } = await axios.get(url, {
      headers: !apiKey ? {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      } : {}
    });
    const $ = cheerio.load(data);

    // Remove unwanted elements
    $('header, footer, nav, script, style, noscript, iframe, .social-links, .navigation, svg').remove();

    const sections = [];
    const seen = new Set();

    // Use broader selectors for page-builder sites (WordPress Bricks, Elementor, etc.)
    $('h1, h2, h3, h4, p, li, article, blockquote, td, th, figcaption').each((i, el) => {
      // Get only direct text, strip any nested HTML tags
      let text = $(el).text().trim().replace(/<[^>]*>/g, '');
      if (text.length > 20 && !seen.has(text)) {
        seen.add(text);
        sections.push(text);
      }
    });

    // Fallback: if no structured content found, extract full body text
    if (sections.length === 0) {
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
      if (bodyText.length > 50) {
        return bodyText;
      }
    }

    const fullText = sections.join('\n\n');
    return fullText || null;
  } catch (error) {
    console.error(`Scraping error for ${url}:`, error.message);
    return null;
  }
};

const chunkText = (text, size = 800, overlap = 150) => {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));
    start += size - overlap;
  }
  return chunks;
};

module.exports = { scrapeGrowlity, chunkText };
