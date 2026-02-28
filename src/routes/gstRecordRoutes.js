const express = require('express');
const router = express.Router();
const gstRecordController = require('../controllers/gstRecordController');
const { protect } = require('../middleware/authMiddleware');

// Protect all GST record routes
router.use(protect);

router.post('/', gstRecordController.createGstRecord);
router.get('/', gstRecordController.getGstRecords);
router.put('/:id', gstRecordController.updateGstRecord);

module.exports = router;
