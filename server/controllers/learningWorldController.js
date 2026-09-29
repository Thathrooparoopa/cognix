const mongoose = require("mongoose");

const LearningWorld = require("../models/LearningWorld");
const LearningSpace = require("../models/LearningSpace");

const {
  extractSyllabusText,
} = require("../services/learning-world/syllabusParser");

const {
  generateLearningWorld,
} = require("../services/learning-world/worldGenerator");

const getAuthenticatedUserId = (req) => {
  return (
    req.user?._id ||
    req.user?.id ||
    req.user?.userId
  );
};

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

/*
|--------------------------------------------------------------------------
| CREATE LEARNING WORLD
|--------------------------------------------------------------------------
*/

const createLearningWorld = async (req, res) => {
  let world = null;

  try {
    const userId = getAuthenticatedUserId(req);
    const { learningSpaceId } = req.body;

    if (!userId) {
      return sendError(
        res,
        401,
        "Authentication required."
      );
    }

    if (!learningSpaceId) {
      return sendError(
        res,
        400,
        "learningSpaceId is required."
      );
    }

    if (!isValidObjectId(learningSpaceId)) {
      return sendError(
        res,
        400,
        "Invalid learningSpaceId."
      );
    }

    const learningSpace =
      await LearningSpace.findOne({
        _id: learningSpaceId,
        userId,
      }).lean();

    if (!learningSpace) {
      return sendError(
        res,
        404,
        "Learning Space not found."
      );
    }

    const existingWorld =
      await LearningWorld.findOne({
        userId,
        learningSpaceId,
      });

    if (existingWorld) {
      if (existingWorld.status === "failed") {
        await LearningWorld.deleteOne({
          _id: existingWorld._id,
        });
      } else {
        return res.status(200).json({
          success: true,
          message:
            "Learning World already exists.",
          world: existingWorld,
        });
      }
    }

    world = await LearningWorld.create({
      userId,
      learningSpaceId,

      title: learningSpace.subject,

      description:
        learningSpace.goal ||
        `Your personalized ${learningSpace.subject} learning world.`,

      status: "generating",

      units: [],

      generationError: "",

      currentUnitOrder: 1,

      currentTopicId: null,

      progressPercent: 0,
    });

    const syllabus =
      await extractSyllabusText(
        learningSpace.syllabus.path
      );

    const generated =
      await generateLearningWorld({
        subject: learningSpace.subject,
        goal: learningSpace.goal,
        syllabusText: syllabus.text,
      });

    const totalTopics =
      generated.units.reduce(
        (total, unit) =>
          total + unit.topics.length,
        0
      );

    if (
      generated.units.length === 0 ||
      totalTopics === 0
    ) {
      throw new Error(
        "The syllabus did not produce any usable units or topics."
      );
    }

    world.title =
      learningSpace.subject;

    world.description =
      generated.description ||
      learningSpace.goal ||
      `Your personalized ${learningSpace.subject} learning world.`;

    world.units = generated.units;

    world.status = "ready";

    world.generationError = "";

    world.currentUnitOrder = 1;

    world.progressPercent = 0;

    await world.save();

    /*
     * Mongoose creates the topic IDs
     * after the units are assigned/saved.
     */

    world.currentTopicId =
      world.units?.[0]?.topics?.[0]?._id ||
      null;

    await world.save();

    const savedWorld =
      await LearningWorld.findOne({
        _id: world._id,
        userId,
      }).populate({
        path: "learningSpaceId",
        select:
          "subject goal status createdAt",
      });

    return res.status(201).json({
      success: true,
      message:
        "Learning World generated successfully.",
      world: savedWorld,
    });
  } catch (error) {
    console.error(
      "createLearningWorld error:",
      error
    );

    if (world?._id) {
      try {
        await LearningWorld.findByIdAndUpdate(
          world._id,
          {
            status: "failed",
            generationError: String(
              error.message ||
                "Learning World generation failed."
            ).substring(0, 2000),
          }
        );
      } catch (updateError) {
        console.error(
          "Failed to update world generation status:",
          updateError
        );
      }
    }

    return sendError(
      res,
      500,
      error.message ||
        "Failed to generate Learning World."
    );
  }
};

/*
|--------------------------------------------------------------------------
| GET ALL WORLDS
|--------------------------------------------------------------------------
*/

const getLearningWorlds = async (req, res) => {
  try {
    const userId =
      getAuthenticatedUserId(req);

    if (!userId) {
      return sendError(
        res,
        401,
        "Authentication required."
      );
    }

    const worlds =
      await LearningWorld.find({
        userId,
      })
        .sort({
          createdAt: -1,
        })
        .populate({
          path: "learningSpaceId",
          select:
            "subject goal status createdAt",
        });

    return res.status(200).json({
      success: true,
      count: worlds.length,
      worlds,
    });
  } catch (error) {
    console.error(
      "getLearningWorlds error:",
      error
    );

    return sendError(
      res,
      500,
      "Failed to fetch Learning Worlds."
    );
  }
};

/*
|--------------------------------------------------------------------------
| GET WORLD BY ID
|--------------------------------------------------------------------------
*/

const getLearningWorldById = async (req, res) => {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const { worldId } = req.params;

    if (!userId) {
      return sendError(
        res,
        401,
        "Authentication required."
      );
    }

    if (!isValidObjectId(worldId)) {
      return sendError(
        res,
        400,
        "Invalid worldId."
      );
    }

    const world =
      await LearningWorld.findOne({
        _id: worldId,
        userId,
      }).populate({
        path: "learningSpaceId",
        select:
          "subject goal status createdAt",
      });

    if (!world) {
      return sendError(
        res,
        404,
        "Learning World not found."
      );
    }

    return res.status(200).json({
      success: true,
      world,
    });
  } catch (error) {
    console.error(
      "getLearningWorldById error:",
      error
    );

    return sendError(
      res,
      500,
      "Failed to fetch Learning World."
    );
  }
};

/*
|--------------------------------------------------------------------------
| GET WORLD BY LEARNING SPACE
|--------------------------------------------------------------------------
*/

const getWorldByLearningSpace = async (
  req,
  res
) => {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const { learningSpaceId } =
      req.params;

    if (!userId) {
      return sendError(
        res,
        401,
        "Authentication required."
      );
    }

    if (
      !isValidObjectId(
        learningSpaceId
      )
    ) {
      return sendError(
        res,
        400,
        "Invalid learningSpaceId."
      );
    }

    const world =
      await LearningWorld.findOne({
        userId,
        learningSpaceId,
      }).populate({
        path: "learningSpaceId",
        select:
          "subject goal status createdAt",
      });

    if (!world) {
      return sendError(
        res,
        404,
        "Learning World not found for this Learning Space."
      );
    }

    return res.status(200).json({
      success: true,
      world,
    });
  } catch (error) {
    console.error(
      "getWorldByLearningSpace error:",
      error
    );

    return sendError(
      res,
      500,
      "Failed to fetch Learning World."
    );
  }
};

/*
|--------------------------------------------------------------------------
| COMPLETE TOPIC
|--------------------------------------------------------------------------
*/

const completeTopic = async (req, res) => {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const {
      worldId,
      topicId,
    } = req.params;

    if (!userId) {
      return sendError(
        res,
        401,
        "Authentication required."
      );
    }

    if (
      !isValidObjectId(worldId) ||
      !isValidObjectId(topicId)
    ) {
      return sendError(
        res,
        400,
        "Invalid worldId or topicId."
      );
    }

    const world =
      await LearningWorld.findOne({
        _id: worldId,
        userId,
      });

    if (!world) {
      return sendError(
        res,
        404,
        "Learning World not found."
      );
    }

    let targetUnit = null;
    let targetTopic = null;
    let targetUnitIndex = -1;
    let targetTopicIndex = -1;

    world.units.forEach(
      (unit, unitIndex) => {
        unit.topics.forEach(
          (topic, topicIndex) => {
            if (
              String(topic._id) ===
              String(topicId)
            ) {
              targetUnit = unit;
              targetTopic = topic;
              targetUnitIndex =
                unitIndex;
              targetTopicIndex =
                topicIndex;
            }
          }
        );
      }
    );

    if (!targetTopic) {
      return sendError(
        res,
        404,
        "Topic not found in this world."
      );
    }

    if (
      targetTopic.status ===
      "completed"
    ) {
      return res.status(200).json({
        success: true,
        message:
          "Topic was already completed.",
        xpAwarded: 0,
        world,
      });
    }

    if (
      targetTopic.status !==
      "unlocked"
    ) {
      return sendError(
        res,
        400,
        "This topic is still locked."
      );
    }

    targetTopic.status =
      "completed";

    const xpAwarded =
      Number(
        targetTopic.xpReward
      ) || 50;

    let nextTopic = null;
    let nextUnitOrder = null;

    if (
      targetTopicIndex + 1 <
      targetUnit.topics.length
    ) {
      nextTopic =
        targetUnit.topics[
          targetTopicIndex + 1
        ];

      nextUnitOrder =
        targetUnit.order;
    } else if (
      targetUnitIndex + 1 <
      world.units.length
    ) {
      const nextUnit =
        world.units[
          targetUnitIndex + 1
        ];

      if (
        nextUnit.topics.length > 0
      ) {
        nextTopic =
          nextUnit.topics[0];

        nextUnitOrder =
          nextUnit.order;
      }
    }

    if (nextTopic) {
      nextTopic.status =
        "unlocked";

      world.currentTopicId =
        nextTopic._id;

      world.currentUnitOrder =
        nextUnitOrder;
    } else {
      world.currentTopicId = null;

      world.currentUnitOrder =
        targetUnit.order;
    }

    let totalTopics = 0;
    let completedTopics = 0;

    world.units.forEach(
      (unit) => {
        unit.topics.forEach(
          (topic) => {
            totalTopics += 1;

            if (
              topic.status ===
              "completed"
            ) {
              completedTopics += 1;
            }
          }
        );
      }
    );

    world.progressPercent =
      totalTopics > 0
        ? Math.round(
            (completedTopics /
              totalTopics) *
              100
          )
        : 0;

    await world.save();

    return res.status(200).json({
      success: true,

      message: nextTopic
        ? "Topic completed. Next topic unlocked!"
        : "Congratulations! You completed the Learning World!",

      xpAwarded,

      progressPercent:
        world.progressPercent,

      nextTopicId:
        nextTopic?._id || null,

      world,
    });
  } catch (error) {
    console.error(
      "completeTopic error:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to complete the topic."
    );
  }
};

/*
|--------------------------------------------------------------------------
| DELETE WORLD
|--------------------------------------------------------------------------
*/

const deleteLearningWorld = async (
  req,
  res
) => {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const { worldId } = req.params;

    if (!userId) {
      return sendError(
        res,
        401,
        "Authentication required."
      );
    }

    if (!isValidObjectId(worldId)) {
      return sendError(
        res,
        400,
        "Invalid worldId."
      );
    }

    const world =
      await LearningWorld.findOneAndDelete({
        _id: worldId,
        userId,
      });

    if (!world) {
      return sendError(
        res,
        404,
        "Learning World not found."
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Learning World deleted successfully.",
    });
  } catch (error) {
    console.error(
      "deleteLearningWorld error:",
      error
    );

    return sendError(
      res,
      500,
      "Failed to delete Learning World."
    );
  }
};

module.exports = {
  createLearningWorld,
  getLearningWorlds,
  getLearningWorldById,
  getWorldByLearningSpace,
  completeTopic,
  deleteLearningWorld,
};
