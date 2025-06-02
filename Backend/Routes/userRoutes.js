const express = require('express');
const router = express.Router();
const userController = require('../Controllers/userController');

// Public user routes (no admin check)
router.get('/',    userController.listUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
