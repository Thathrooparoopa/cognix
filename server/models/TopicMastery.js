const mongoose = require("mongoose");

const topicMasterySchema = new mongoose.Schema(
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

    masteryScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    correctAttempts: {
      type: Number,
      default: 0,
    },

    averageResponseTime: {
      type: Number,
      default: 0,
    },

    difficultyLevel: {
      type: Number,
      min: 1,
      max: 5,
      default: 2,
    },

    lastAttempt: {
      type: Date,
      default: null,
    },

    lastRevision: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

topicMasterySchema.index(
  {
    userId: 1,
    worldId: 1,
    topicId: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "TopicMastery",
  topicMasterySchema
);
