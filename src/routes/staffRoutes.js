const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');

/**
 * Role guard middleware to restrict access to Admins
 */
const isAdmin = (req, res, next) => {
    // Note: The 'protect' middleware must be called before this to populate req.user
    // We'll need to fetch the full user from DB or ensure the token has role info
    // For now, let's assume the token has role or we fetch it in protect
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Requires Admin role' });
    }
};

// All staff routes require authentication
router.use(protect);

router.get('/', staffController.getStaff);

// Only Admins can modify users
router.post('/', isAdmin, staffController.createStaff);
router.put('/:id', isAdmin, staffController.updateStaff);
router.delete('/:id', isAdmin, staffController.deleteStaff);

module.exports = router;
