const express = require("express");
const router = express.Router();
const {
  castVote,
  verifyVoterForAuth,
  verifyVoterIdForAuth,
  castVoteByVoterId,
  getResultConstituencies,
  getConstituencyResult,
} = require("../controllers/voteController");
const { checkVotingOpen } = require("../middleware/timeGuard");

router.post("/verify", verifyVoterForAuth);
router.get("/verify-voter-id/:voterId", verifyVoterIdForAuth);
router.post("/cast", checkVotingOpen, castVote);
router.post("/cast-by-voter-id", checkVotingOpen, castVoteByVoterId);
router.get("/result/constituencies", getResultConstituencies);
router.get("/result", getConstituencyResult);

module.exports = router;
