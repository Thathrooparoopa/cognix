const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
    },

    answer: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    correct: {
      type: Boolean,
      default: false,
    },

    responseTimeMs: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const topicAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    learningSpaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LearningSpace",
      required: true,
      index: true,
    },

    worldId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LearningWorld",
      required: true,
      index: true,
    },

    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    topicTitle: {
      type: String,
      required: true,
    },

    gameType: {
      type: String,
      required: true,
    },

    questionSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    answers: {
      type: [answerSchema],
      default: [],
    },

    score: {
      type: Number,
      default: 0,
    },

    accuracy: {
      type: Number,
      default: 0,
    },

    correctCount: {
      type: Number,
      default: 0,
    },

    totalQuestions: {
      type: Number,
      default: 0,
    },

    masteryBefore: {
      type: Number,
      default: 0,
    },

    masteryAfter: {
      type: Number,
      default: 0,
    },

    xpAwarded: {
      type: Number,
      default: 0,
    },

    passed: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["started", "completed"],
      default: "started",
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

topicAttemptSchema.index({
  userId: 1,
  worldId: 1,
  topicId: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "TopicAttempt",
  topicAttemptSchema
);
