const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', settingsController.getSettings);
router.post('/', settingsController.createSetting);
router.delete('/:id', settingsController.deleteSetting);

module.exports = router;
