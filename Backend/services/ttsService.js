const axios = require('axios');

/**
 * Service to handle ElevenLabs Text-to-Speech generation
 */
exports.generateSpeech = async (text) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'XrExE9yKIg1WjnnlVkGX'; // Default to Matilda

  if (!apiKey) {
    throw new Error('ElevenLabs API Key is missing');
  }

  try {
    const response = await axios({
      method: 'post',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      data: {
        text: text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      responseType: 'stream'
    });

    return response.data;
  } catch (err) {
    console.error('ElevenLabs API Error:', err.response?.data || err.message);
    throw new Error('Failed to generate speech from ElevenLabs');
  }
};
