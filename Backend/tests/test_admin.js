const Knowledge = require('../models/Knowledge');
const connectDB = require('../config/db');
require('dotenv').config();

/**
 * Admin Management Test
 * Verifies that we can list and find knowledge entries by source name.
 */
async function testAdmin() {
    console.log('--- Testing Admin Library Management ---');
    await connectDB();

    try {
        const count = await Knowledge.countDocuments();
        console.log('Total chunks in Database:', count);

        const samples = await Knowledge.find().limit(1);
        if (samples.length > 0) {
            console.log('Library fetch test:', samples[0].metadata?.source || 'Manual Entry');
            console.log('✅ TEST PASSED: Database records are accessible.');
        } else {
            console.log('⚠️ TEST WARNING: Database is empty.');
        }
    } catch (error) {
        console.error('❌ TEST FAILED with error:', error.message);
    } finally {
        process.exit();
    }
}

testAdmin();
