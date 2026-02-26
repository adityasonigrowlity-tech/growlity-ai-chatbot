const { getRelevantContext } = require('../services/aiService');
const connectDB = require('../config/db');
require('dotenv').config();

/**
 * RAG (Retrieval Augmented Generation) Test
 * Verifies that the MongoDB Vector Search is finding relevant 
 * knowledge chunks from the database.
 */
async function testRAG() {
    console.log('--- Testing RAG Retrieval ---');
    await connectDB();
    
    try {
        const context = await getRelevantContext("EcoVadis");
        console.log('Retrieved Context (First 200 chars):', context.substring(0, 200) + '...');
        
        if (context && context.includes('EcoVadis')) {
            console.log('✅ TEST PASSED: Relevant data fetched from Vector Search.');
        } else {
            console.log('⚠️ TEST WARNING: No relevant context found. Verify MongoDB Index (AiChatbot) is built.');
        }
    } catch (error) {
        console.error('❌ TEST FAILED with error:', error.message);
    } finally {
        process.exit();
    }
}

testRAG();
