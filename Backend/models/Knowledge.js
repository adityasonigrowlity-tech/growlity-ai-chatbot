const mongoose = require('mongoose');

const knowledgeSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  metadata: {
    source: String,
    title: String,
    chunkIndex: Number,
  },
  embedding: {
    type: [Number],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for vector search (Manual index creation in MongoDB Atlas is required for Vector Search)
// name: vector_index, fields: [{type: 'vector', path: 'embedding', numDimensions: 1536/768, similarity: 'cosine'}]

module.exports = mongoose.model('Knowledge', knowledgeSchema);
