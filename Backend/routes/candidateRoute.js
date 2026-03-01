const express = require('express');
const router = express.Router();
const {
  registerCandidate,
  listCandidates,
  searchCandidates,
} = require('../controllers/candidateController');
const { checkRegistrationOpen } = require('../middleware/timeGuard');

router.post('/register', checkRegistrationOpen, registerCandidate);
router.get('/list', listCandidates);
router.get('/search', searchCandidates);

module.exports = router;
