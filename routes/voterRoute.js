const express = require('express');
const router = express.Router();
const {
  registerVoter,
  getConstituencies,
  getWards,
  computeBiometricHash,
  verifyVoter,
} = require('../controllers/voterController');
const { checkRegistrationOpen } = require('../middleware/timeGuard');

router.get('/constituencies', getConstituencies);
router.get('/wards/:constituency', getWards);
router.post('/register', checkRegistrationOpen, registerVoter);
router.post('/compute-hash', computeBiometricHash);
router.get('/verify/:voterId', verifyVoter);

module.exports = router;
