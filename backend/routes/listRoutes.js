const express = require('express');
const router = express.Router();
const { getLists, createList, updateList, deleteList } = require('../controllers/listController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Secure all list routes with JWT

router.get('/', getLists);
router.post('/', createList);
router.put('/:id', updateList);
router.delete('/:id', deleteList);

module.exports = router;
