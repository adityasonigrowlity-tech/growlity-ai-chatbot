const { generateResponse } = require('../services/aiService');
const Knowledge = require('../models/Knowledge');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');

exports.handleChat = async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await generateResponse(message, history);
    
    // Optional: Save new AI-generated answer into DB if context was missing (simple implementation)
    // In a prod environment, this would be more sophisticated to avoid duplicates
    
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
