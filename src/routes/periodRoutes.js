const express = require('express');
const router = express.Router();
const periodController = require('../controllers/periodController');
const { protect } = require('../middleware/authMiddleware');

// Protect all period routes
router.use(protect);

router.post('/', periodController.createPeriod);
router.get('/', periodController.getPeriods);
router.put('/:id', periodController.updatePeriod);
router.delete('/:id', periodController.deletePeriod);

module.exports = router;
