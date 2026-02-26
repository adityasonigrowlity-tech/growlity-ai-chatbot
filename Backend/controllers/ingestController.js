const { scrapeGrowlity, chunkText } = require('../services/scraper');
const Knowledge = require('../models/Knowledge');
const { OpenAIEmbeddings } = require('@langchain/openai');

// Initialize embeddings (same as scrape.js)
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
  modelName: "openai/text-embedding-3-small",
});

exports.ingestUrl = async (req, res) => {
  const { url, title } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    console.log(`Ingesting URL via Admin: ${url}${title ? ` (Title: ${title})` : ''}`);
    const text = await scrapeGrowlity(url);
    if (!text) throw new Error('Could not scrape text from URL');

    const chunks = chunkText(text);
    const results = [];

    for (let i = 0; i < chunks.length; i++) {
      const vector = await embeddings.embedQuery(chunks[i]);
      const knowledge = await Knowledge.create({
        content: chunks[i],
        metadata: {
          source: title || url,
          chunkIndex: i,
          type: 'url'
        },
        embedding: vector
      });
      results.push(knowledge._id);
    }

    res.status(200).json({ 
      success: true, 
      message: `Successfully ingested ${chunks.length} chunks from URL`,
      chunks: chunks.length 
    });
  } catch (err) {
    console.error('Ingestion error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.ingestText = async (req, res) => {
  const { text, title } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    console.log(`Ingesting Text via Admin: ${title || 'Untitled'}`);
    const chunks = chunkText(text);
    const results = [];

    for (let i = 0; i < chunks.length; i++) {
      const vector = await embeddings.embedQuery(chunks[i]);
      const knowledge = await Knowledge.create({
        content: chunks[i],
        metadata: {
          source: title || 'manual_entry',
          chunkIndex: i,
          type: 'text'
        },
        embedding: vector
      });
      results.push(knowledge._id);
    }

    res.status(200).json({ 
      success: true, 
      message: `Successfully ingested ${chunks.length} chunks from text`,
      chunks: chunks.length 
    });
  } catch (err) {
    console.error('Ingestion error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.listKnowledge = async (req, res) => {
  try {
    const knowledge = await Knowledge.find({}, { content: 1, metadata: 1, createdAt: 1 }).sort({ createdAt: -1 });
    res.status(200).json(knowledge);
  } catch (err) {
    console.error('List error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteKnowledge = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Knowledge.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Entry not found' });
    res.status(200).json({ success: true, message: 'Knowledge entry deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteBySource = async (req, res) => {
  const { sourceName } = req.params;
  try {
    const decodedSource = decodeURIComponent(sourceName);
    console.log(`Deleting all chunks for source: ${decodedSource}`);
    const result = await Knowledge.deleteMany({ 'metadata.source': decodedSource });
    res.status(200).json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} chunks across all instances.`,
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error('Bulk delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
