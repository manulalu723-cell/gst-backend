const express = require('express');
const router = express.Router();
const healthRoutes = require('./health');
const authRoutes = require('./authRoutes');
const clientRoutes = require('./clientRoutes');
const periodRoutes = require('./periodRoutes');
const gstRecordRoutes = require('./gstRecordRoutes');
const staffRoutes = require('./staffRoutes');

// Register sub-routes
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/periods', periodRoutes);
router.use('/gst-records', gstRecordRoutes);
router.use('/staff', staffRoutes);

module.exports = router;
