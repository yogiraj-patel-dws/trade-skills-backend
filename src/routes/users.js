const express = require('express');
const router = express.Router();

// User routes placeholder
router.get('/me', (req, res) => {
  res.status(501).json({ message: 'Get user profile - to be implemented' });
});

module.exports = router;