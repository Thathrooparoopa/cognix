const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: [
        "locked",
        "unlocked",
        "completed",
      ],
      default: "locked",
    },

    xpReward: {
      type: Number,
      default: 50,
      min: 0,
    },
  },
  {
    _id: true,
  }
);

const unitSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },

    topics: {
      type: [topicSchema],
      default: [],
    },
  },
  {
    _id: true,
  }
);

const learningWorldSchema = new mongoose.Schema(
  {
    /*
     * The Cognix user who owns this world.
     */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
     * The Learning Space from which
     * this world was generated.
     */
    learningSpaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LearningSpace",
      required: true,
      index: true,
    },

    /*
     * Display name of the world.
     * This will normally come from
     * the Learning Space subject.
     */
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    /*
     * Short description shown on
     * the world landing page.
     */
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },

    /*
     * Current generation state.
     */
    status: {
      type: String,
      enum: [
        "generating",
        "ready",
        "failed",
      ],
      default: "generating",
      index: true,
    },

    /*
     * Structured syllabus content.
     *
     * Unit -> Topic -> Level
     *
     * We will expand the level structure
     * later in Phase 5.
     */
    units: {
      type: [unitSchema],
      default: [],
    },

    /*
     * Stores a safe error message when
     * world generation fails.
     */
    generationError: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    /*
     * Tracks the student's current
     * progression through the world.
     */
    currentUnitOrder: {
      type: Number,
      default: 1,
      min: 1,
    },

    currentTopicId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    /*
     * Overall completion percentage.
     */
    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * A Learning Space can have only one
 * generated Learning World for its owner.
 */
learningWorldSchema.index(
  {
    userId: 1,
    learningSpaceId: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "LearningWorld",
  learningWorldSchema
);