const Knowledge = require('../models/Knowledge');
const connectDB = require('../config/db');
require('dotenv').config();

async function dumpKnowledge() {
    await connectDB();
    try {
        console.log('--- Searching for process-related knowledge ---');
        const results = await Knowledge.find({ 
            content: { $regex: /process/i } 
        }).limit(10).select('content');
        
        results.forEach((r, i) => {
            console.log(`\n[Result ${i+1}]:`);
            console.log(r.content.substring(0, 200) + '...');
        });

        console.log('\n--- Searching for BRSR-related knowledge ---');
        const brsrResults = await Knowledge.find({ 
            content: { $regex: /BRSR/i } 
        }).limit(5).select('content');
        
        brsrResults.forEach((r, i) => {
            console.log(`\n[BRSR Result ${i+1}]:`);
            console.log(r.content.substring(0, 200) + '...');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

dumpKnowledge();
