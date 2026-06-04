
const router = require('express').Router();
const healthController = require('../controllers/healthController');

router.get('/', healthController.getHealth);
router.get('/detailed', healthController.getDetailedHealth);

module.exports = router;
