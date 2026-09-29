const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    service: "Cognix Gateway API",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
