const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  registerCandidate,
  listCandidates,
  searchCandidates,
} = require('../controllers/candidateController');
const { checkRegistrationOpen } = require('../middleware/timeGuard');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

router.post(
  '/register',
  checkRegistrationOpen,
  upload.fields([
    { name: 'photoURL', maxCount: 1 },
    { name: 'symbolURL', maxCount: 1 },
  ]),
  registerCandidate
);
router.get('/list', listCandidates);
router.get('/search', searchCandidates);

module.exports = router;
