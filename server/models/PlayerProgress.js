const mongoose = require("mongoose");

const playerProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    totalXp: {
      type: Number,
      default: 0,
      min: 0,
    },

    weeklyXp: {
      type: Number,
      default: 0,
      min: 0,
    },

    level: {
      type: Number,
      default: 1,
      min: 1,
    },

    lastXpDate: {
      type: Date,
      default: null,
    },

    weeklyXpWeek: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "PlayerProgress",
  playerProgressSchema
);
