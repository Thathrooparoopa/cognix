const fs = require("fs");
const LearningSpace = require("../models/LearningSpace");

const deleteFileIfExists = (file) => {
  if (!file?.path) {
    return;
  }

  fs.unlink(file.path, () => {});
};

const deleteFiles = (files) => {
  if (!files) {
    return;
  }

  const syllabusFile = files.syllabus?.[0];
  const notesFile = files.notes?.[0];

  deleteFileIfExists(syllabusFile);
  deleteFileIfExists(notesFile);
};

const createLearningSpace = async (req, res) => {
  const syllabusFile = req.files?.syllabus?.[0];
  const notesFile = req.files?.notes?.[0];

  try {
    if (!req.user?.id) {
      deleteFiles(req.files);

      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const subject =
      typeof req.body.subject === "string"
        ? req.body.subject.trim()
        : "";

    const goal =
      typeof req.body.goal === "string"
        ? req.body.goal.trim()
        : "";

    if (!subject) {
      deleteFiles(req.files);

      return res.status(400).json({
        success: false,
        message: "Subject is required.",
      });
    }

    if (!syllabusFile) {
      deleteFileIfExists(notesFile);

      return res.status(400).json({
        success: false,
        message: "Syllabus file is required.",
      });
    }

    const learningSpace = await LearningSpace.create({
      userId: req.user.id,

      subject,

      goal,

      syllabus: {
        originalName: syllabusFile.originalname,
        storedName: syllabusFile.filename,
        path: syllabusFile.path,
        mimeType: syllabusFile.mimetype,
        size: syllabusFile.size,
      },

      notes: notesFile
        ? {
            originalName: notesFile.originalname,
            storedName: notesFile.filename,
            path: notesFile.path,
            mimeType: notesFile.mimetype,
            size: notesFile.size,
          }
        : null,

      status: "created",
    });

    return res.status(201).json({
      success: true,
      message: "Learning Space created successfully.",

      data: {
        id: learningSpace._id,
        subject: learningSpace.subject,
        goal: learningSpace.goal,
        status: learningSpace.status,

        syllabus: {
          originalName:
            learningSpace.syllabus.originalName,
          size: learningSpace.syllabus.size,
        },

        notes: learningSpace.notes?.originalName
          ? {
              originalName:
                learningSpace.notes.originalName,
              size: learningSpace.notes.size,
            }
          : null,

        createdAt: learningSpace.createdAt,
      },
    });
  } catch (error) {
    deleteFiles(req.files);

    console.error(
      "Create Learning Space error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create the Learning Space.",
    });
  }
};

const getLearningSpaces = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const learningSpaces =
      await LearningSpace.find({
        userId: req.user.id,
      })
        .sort({ createdAt: -1 })
        .select(
          "subject goal status syllabus.originalName syllabus.size notes.originalName notes.size createdAt updatedAt"
        );

    return res.status(200).json({
      success: true,
      count: learningSpaces.length,
      data: learningSpaces,
    });
  } catch (error) {
    console.error(
      "Get Learning Spaces error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve Learning Spaces.",
    });
  }
};

const getLearningSpaceById = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const learningSpace =
      await LearningSpace.findOne({
        _id: req.params.id,
        userId: req.user.id,
      }).select("-__v");

    if (!learningSpace) {
      return res.status(404).json({
        success: false,
        message: "Learning Space not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: learningSpace,
    });
  } catch (error) {
    console.error(
      "Get Learning Space error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve the Learning Space.",
    });
  }
};

module.exports = {
  createLearningSpace,
  getLearningSpaces,
  getLearningSpaceById,
};
