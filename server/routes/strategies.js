const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const StrategyController = require('../controllers/StrategyController');

router.use(requireAuth);

router.get('/', StrategyController.getAll);
router.post('/', StrategyController.create);
router.get('/:id', StrategyController.getById);
router.put('/:id', StrategyController.update);
router.delete('/:id', StrategyController.delete);

module.exports = router;
