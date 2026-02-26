const axios = require('axios');
const cheerio = require('cheerio');

const scrapeGrowlity = async (targetUrl) => {
  try {
    const apiKey = process.env.SCRAPE_DO_API_KEY;
    const url = apiKey 
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
    $('header, footer, nav, script, style, .social-links, .navigation').remove();

    const sections = [];
    $('h1, h2, h3, p, li').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) {
        sections.push(text);
      }
    });

    const fullText = sections.join('\n\n');
    return fullText;
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
