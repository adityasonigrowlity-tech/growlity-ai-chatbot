const axios = require('axios');
require('dotenv').config();

/**
 * Ingestion API Test
 * Verifies that the backend can receive and process knowledge ingestion requests.
 * Note: Requires the server to be running on localhost:5000.
 */
async function testIngestion() {
    console.log('--- Testing Knowledge Ingestion API ---');
    const API_URL = 'http://localhost:5000/api/ingest';

    try {
        const response = await axios.post(`${API_URL}/text`, {
            title: "Test Entry",
            text: "This is a test chunk of knowledge for Growlity Ai Chatbot."
        });

        console.log('Ingestion Response:', response.data);
        if (response.status === 201 || response.status === 200) {
            console.log('✅ TEST PASSED: Text ingestion successful.');
        }
    } catch (error) {
        console.error('❌ TEST FAILED: Server must be running on port 5000.');
        console.error('Error:', error.message);
    }
}

testIngestion();
