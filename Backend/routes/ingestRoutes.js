const express = require('express');
const router = express.Router();
const ingestController = require('../controllers/ingestController');

router.post('/url', ingestController.ingestUrl);
router.post('/text', ingestController.ingestText);
router.get('/list', ingestController.listKnowledge);
router.delete('/:id', ingestController.deleteKnowledge);
router.delete('/source/:sourceName', ingestController.deleteBySource);

module.exports = router;
