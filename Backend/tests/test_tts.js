const { generateSpeech } = require('../services/ttsService');
const fs = require('fs');
require('dotenv').config();

/**
 * Text-to-Speech (TTS) Test
 * Verifies that ElevenLabs API is working with the Turbo v2.5 model 
 * and the Matilda voice ID.
 */
async function testTTS() {
    console.log('--- Testing ElevenLabs TTS ---');
    try {
        // We use a promise wrapper because generateSpeech returns a stream
        const stream = await generateSpeech("Hello, this is Growlity Ai Chatbot. Voice system is online.");
        
        const writer = fs.createWriteStream('./tests/output_test.mp3');
        stream.pipe(writer);

        writer.on('finish', () => {
            console.log('✅ TEST PASSED: Audio file saved to tests/output_test.mp3');
            process.exit();
        });

        writer.on('error', (err) => {
            console.error('❌ TEST FAILED during stream piping:', err.message);
            process.exit(1);
        });

    } catch (error) {
        console.error('❌ TEST FAILED with error:', error.message);
        process.exit(1);
    }
}

testTTS();
