const express = require('express');
const router = express.Router();
const {
	castVote,
	verifyVoterForAuth,
	getResultConstituencies,
	getConstituencyResult,
} = require('../controllers/voteController');
const { checkVotingOpen } = require('../middleware/timeGuard');

router.post('/verify', verifyVoterForAuth);
router.post('/cast', checkVotingOpen, castVote);
router.get('/result/constituencies', getResultConstituencies);
router.get('/result', getConstituencyResult);

module.exports = router;
