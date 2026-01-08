/**
 * Report Routes
 */

const router = require('express').Router();
const reportController = require('../controllers/reportController');
const { validateObjectId } = require('../middleware/validator');

// GET /api/reports - Get all reports
router.get('/', reportController.getAll);

// GET /api/reports/:id - Get report by ID
router.get('/:id', validateObjectId('id'), reportController.getById);

// POST /api/reports/generate - Generate report
router.post('/generate', reportController.generate);

// GET /api/reports/:id/download - Download report
router.get('/:id/download', validateObjectId('id'), reportController.download);

module.exports = router;
