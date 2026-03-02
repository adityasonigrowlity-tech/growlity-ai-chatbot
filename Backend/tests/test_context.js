const { generateResponse } = require('../services/aiService');
const connectDB = require('../config/db');
require('dotenv').config();

async function testContext() {
    console.log('--- Testing AI Context Memory ---');
    await connectDB();
    
    try {
        console.log('\nTurn 1: What is BRSR reporting?');
        const response1 = await generateResponse('What is BRSR reporting?', []);
        console.log('AI Response 1 (Summary):', response1.substring(0, 100) + '...');

        console.log('\nTurn 2: process ? (Contextual)');
        const history2 = [
            { role: 'user', content: 'What is BRSR reporting?' },
            { role: 'ai', content: response1 }
        ];
        
        const response2 = await generateResponse('process ?', history2);
        console.log('AI Response 2:', response2);

        const lowerResponse2 = response2.toLowerCase();
        if (lowerResponse2.includes('brsr') || lowerResponse2.includes('business responsibility') || (lowerResponse2.includes('reporting') && !lowerResponse2.includes('ecovadis'))) {
            console.log('\n✅ TEST PASSED: AI identified context (BRSR) in follow-up question.');
        } else {
            console.log('\n❌ TEST FAILED: AI did not clearly relate the "process" to "BRSR". It might still be returning EcoVadis or something else.');
        }

    } catch (error) {
        console.error('❌ TEST FAILED with error:', error.message);
    } finally {
        process.exit();
    }
}

testContext();
