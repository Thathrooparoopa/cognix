const express = require("express");

const upload = require("../middleware/upload");
const protect = require("../middleware/authMiddleware");

const {
  createLearningSpace,
  getLearningSpaces,
  getLearningSpaceById,
} = require("../controllers/learningSpaceController");

const router = express.Router();

router.post(
  "/",
  protect,
  upload.fields([
    {
      name: "syllabus",
      maxCount: 1,
    },
    {
      name: "notes",
      maxCount: 1,
    },
  ]),
  createLearningSpace
);

router.get(
  "/",
  protect,
  getLearningSpaces
);

router.get(
  "/:id",
  protect,
  getLearningSpaceById
);

module.exports = router;
