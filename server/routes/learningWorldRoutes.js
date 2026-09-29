const express = require("express");

const {
  createLearningWorld,
  getLearningWorlds,
  getLearningWorldById,
  getWorldByLearningSpace,
  deleteLearningWorld,
} = require("../controllers/learningWorldController");

const {
  getTopicLearning,
  startTopicAttempt,
  getTopicAttempt,
  submitTopicAttempt,
  getTopicHistory,
} = require("../controllers/topicExperienceController");

const authMiddleware = require("../middleware/authMiddleware");

const router =
  express.Router();

router.post(
  "/",
  authMiddleware,
  createLearningWorld
);

router.get(
  "/",
  authMiddleware,
  getLearningWorlds
);

router.get(
  "/space/:learningSpaceId",
  authMiddleware,
  getWorldByLearningSpace
);

router.get(
  "/:worldId/topics/:topicId/learning",
  authMiddleware,
  getTopicLearning
);

router.post(
  "/:worldId/topics/:topicId/attempts",
  authMiddleware,
  startTopicAttempt
);

router.get(
  "/:worldId/topics/:topicId/history",
  authMiddleware,
  getTopicHistory
);

router.get(
  "/:worldId/attempts/:attemptId",
  authMiddleware,
  getTopicAttempt
);

router.post(
  "/:worldId/attempts/:attemptId/submit",
  authMiddleware,
  submitTopicAttempt
);

router.get(
  "/:worldId",
  authMiddleware,
  getLearningWorldById
);

router.delete(
  "/:worldId",
  authMiddleware,
  deleteLearningWorld
);

module.exports = router;
