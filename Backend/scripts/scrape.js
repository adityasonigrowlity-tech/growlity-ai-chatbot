const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Knowledge = require('../models/Knowledge');
const { scrapeGrowlity, chunkText } = require('../services/scraper');
const { OpenAIEmbeddings } = require('@langchain/openai');

dotenv.config();

const loadKnowledge = async () => {
  await connectDB();

  // Switch to OpenRouter for embeddings if Gemini fails
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENROUTER_API_KEY,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    },
    modelName: "openai/text-embedding-3-small", 
  });

  // 1. Scrape Website
  console.log('Scraping growlity.com...');
  const webText = await scrapeGrowlity('https://growlity.com'); 
  const webChunks = webText ? chunkText(webText) : [];

  // 2. Load Manual Knowledge
  console.log('Loading manual knowledge...');
  const manualPath = path.join(__dirname, '../manualKnowledge.txt');
  const manualText = fs.readFileSync(manualPath, 'utf8');
  const manualChunks = chunkText(manualText);

  const allChunks = [
    ...webChunks.map((c, i) => ({ content: c, source: 'website', index: i })),
    ...manualChunks.map((c, i) => ({ content: c, source: 'manual', index: i }))
  ];

  console.log(`Processing ${allChunks.length} chunks...`);

  for (const chunk of allChunks) {
    try {
      console.log(`Embedding chunk ${chunk.index} from ${chunk.source}...`);
      const vector = await embeddings.embedQuery(chunk.content);
      
      console.log(`Saving chunk ${chunk.index} to MongoDB...`);
      await Knowledge.create({
        content: chunk.content,
        metadata: {
          source: chunk.source,
          chunkIndex: chunk.index,
        },
        embedding: vector
      });
      console.log(`✅ Saved chunk ${chunk.index} from ${chunk.source}`);
    } catch (err) {
      console.error(`❌ Error processing chunk ${chunk.index} from ${chunk.source}:`, err.message);
    }
  }

  console.log('Knowledge loading complete!');
  process.exit();
};

loadKnowledge();
