const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
    },

    storedName: {
      type: String,
      required: true,
    },

    path: {
      type: String,
      required: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const optionalFileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      default: null,
    },

    storedName: {
      type: String,
      default: null,
    },

    path: {
      type: String,
      default: null,
    },

    mimeType: {
      type: String,
      default: null,
    },

    size: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

const learningSpaceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    goal: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    syllabus: {
      type: fileSchema,
      required: true,
    },

    notes: {
      type: optionalFileSchema,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "created",
        "processing",
        "ready",
        "failed",
      ],
      default: "created",
    },
  },
  {
    timestamps: true,
  }
);

learningSpaceSchema.index({
  userId: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "LearningSpace",
  learningSpaceSchema
);