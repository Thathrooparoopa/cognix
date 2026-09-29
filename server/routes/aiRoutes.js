const express = require("express");
const { getAIServiceHealth } = require("../services/aiService");

const router = express.Router();

router.get("/health", async (req, res) => {
  try {
    const data = await getAIServiceHealth();

    res.status(200).json({
      success: true,
      gateway: "healthy",
      aiService: data,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      gateway: "healthy",
      aiService: "unavailable",
      message: error.message,
    });
  }
});

module.exports = router;
