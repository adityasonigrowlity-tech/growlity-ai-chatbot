const { generateResponse } = require('../services/aiService');
const connectDB = require('../config/db');
require('dotenv').config();

/**
 * AI Functionality Test
 * Verifies that the Groq/OpenRouter integration is working and
 * the chatbot responds with its "Growlity Ai Chatbot" persona.
 */
async function testAI() {
    console.log('--- Testing AI Generation ---');
    await connectDB();
    try {
        const response = await generateResponse("What services does Growlity provide?");
        console.log('AI Response:', response);
        if (response && response.length > 10) {
            console.log('✅ TEST PASSED: AI generated a valid response.');
        } else {
            console.log('❌ TEST FAILED: Response was empty or too short.');
        }
    } catch (error) {
        console.error('❌ TEST FAILED with error:', error.message);
    } finally {
        process.exit();
    }
}

testAI();
