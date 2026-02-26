const express = require('express');
const router = express.Router();
const ttsService = require('../services/ttsService');

router.get('/speak', async (req, res) => {
  const { text } = req.query;
  
  if (!text) {
    return res.status(400).json({ error: 'Text query parameter is required' });
  }

  try {
    const audioStream = await ttsService.generateSpeech(text);
    
    // Set headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    // Pipe the ElevenLabs stream directly to the response
    audioStream.pipe(res);
  } catch (err) {
    console.error('TTS Route Error:', err.message);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

module.exports = router;
