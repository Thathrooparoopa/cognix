const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "mcq",
        "true_false",
        "fill_blank",
        "multi_select",
      ],
      required: true,
    },

    prompt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },

    options: {
      type: [optionSchema],
      default: [],
    },

    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    explanation: {
      type: String,
      default: "",
      maxlength: 1200,
    },

    difficulty: {
      type: Number,
      min: 1,
      max: 5,
      default: 2,
    },

    points: {
      type: Number,
      min: 1,
      max: 100,
      default: 10,
    },
  },
  { _id: false }
);

const learningSectionSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      required: true,
      trim: true,
    },

    body: {
      type: String,
      default: "",
      trim: true,
    },

    bullets: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const topicLearningContentSchema = new mongoose.Schema(
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

    learningSections: {
      type: [learningSectionSchema],
      default: [],
    },

    quickRecap: {
      type: [String],
      default: [],
    },

    novaIntro: {
      type: String,
      default: "",
    },

    novaMission: {
      type: String,
      default: "",
    },

    gameType: {
      type: String,
      enum: [
        "treasure_quest",
        "rapid_fire",
        "bridge_builder",
        "memory_run",
      ],
      default: "treasure_quest",
    },

    questions: {
      type: [questionSchema],
      default: [],
    },

    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

topicLearningContentSchema.index(
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
  "TopicLearningContent",
  topicLearningContentSchema
);
