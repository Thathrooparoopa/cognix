const mongoose = require("mongoose");

const LearningWorld = require("../models/LearningWorld");
const TopicLearningContent = require("../models/TopicLearningContent");
const TopicAttempt = require("../models/TopicAttempt");
const TopicMastery = require("../models/TopicMastery");
const PlayerProgress = require("../models/PlayerProgress");

const {
  generateTopicExperience,
  findTopic,
} = require("../services/learning-world/topicExperienceGenerator");

const getUserId = (req) =>
  req.user?._id ||
  req.user?.id ||
  req.user?.userId;

const safeObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value);

const sanitizeQuestion = (question) => ({
  questionId: question.questionId,
  type: question.type,
  prompt: question.prompt,
  options: question.options || [],
  difficulty: question.difficulty,
  points: question.points,
});

const sanitizeContent = (content) => ({
  _id: content._id,

  topicId: content.topicId,

  topicTitle: content.topicTitle,

  learningSections:
    content.learningSections || [],

  quickRecap:
    content.quickRecap || [],

  novaIntro:
    content.novaIntro,

  novaMission:
    content.novaMission,

  gameType:
    content.gameType,

  questionCount:
    content.questions?.length || 0,

  generatedAt:
    content.generatedAt,
});

const sanitizeAttempt = (attempt) => ({
  _id: attempt._id,

  topicId: attempt.topicId,

  topicTitle:
    attempt.topicTitle,

  gameType:
    attempt.gameType,

  status:
    attempt.status,

  startedAt:
    attempt.startedAt,

  questions:
    (attempt.questionSnapshot || [])
      .map((question) => ({
        questionId:
          question.questionId,

        type:
          question.type,

        prompt:
          question.prompt,

        options:
          question.options || [],

        difficulty:
          question.difficulty,

        points:
          question.points,
      })),
});

const normalizeAnswer = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        String(item)
          .trim()
          .toLowerCase()
      )
      .sort();
  }

  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase();
};

const answerMatches = (
  question,
  answer
) => {
  const submitted =
    normalizeAnswer(answer);

  const expected =
    normalizeAnswer(
      question.correctAnswer
    );

  if (
    question.type ===
    "multi_select"
  ) {
    return (
      JSON.stringify(submitted) ===
      JSON.stringify(expected)
    );
  }

  if (
    question.type ===
    "fill_blank"
  ) {
    if (
      Array.isArray(
        question.correctAnswer
      )
    ) {
      return question.correctAnswer
        .map(normalizeAnswer)
        .includes(submitted);
    }

    return submitted === expected;
  }

  return submitted === expected;
};

const calculateMastery = ({
  previousMastery,
  accuracy,
  averageResponseTime,
  attempts,
}) => {
  const accuracyScore =
    accuracy * 100;

  const speedTarget = 25000;

  const speedBonus = Math.max(
    0,
    Math.min(
      5,
      ((speedTarget -
        averageResponseTime) /
        speedTarget) *
        5
    )
  );

  const rawMastery =
    previousMastery * 0.65 +
    accuracyScore * 0.35 +
    speedBonus;

  const mastery =
    Math.round(
      Math.max(
        0,
        Math.min(100, rawMastery)
      )
    );

  const confidence =
    Math.min(
      1,
      0.15 +
        attempts * 0.1 +
        accuracy * 0.6
    );

  return {
    mastery,
    confidence:
      Math.round(
        confidence * 100
      ) / 100,
  };
};

const getWeekKey = () => {
  const now = new Date();

  const day =
    now.getUTCDay();

  const diff =
    day === 0
      ? -6
      : 1 - day;

  const monday =
    new Date(now);

  monday.setUTCDate(
    now.getUTCDate() + diff
  );

  return monday
    .toISOString()
    .slice(0, 10);
};

const addXp = async (
  userId,
  amount
) => {
  if (!amount) {
    return {
      totalXp: 0,
      weeklyXp: 0,
      level: 1,
    };
  }

  const weekKey =
    getWeekKey();

  let progress =
    await PlayerProgress.findOne({
      userId,
    });

  if (!progress) {
    progress =
      new PlayerProgress({
        userId,
        totalXp: 0,
        weeklyXp: 0,
        level: 1,
        weeklyXpWeek: weekKey,
      });
  }

  if (
    progress.weeklyXpWeek !==
    weekKey
  ) {
    progress.weeklyXp = 0;
    progress.weeklyXpWeek =
      weekKey;
  }

  progress.totalXp += amount;
  progress.weeklyXp += amount;

  progress.level =
    Math.floor(
      progress.totalXp / 500
    ) + 1;

  progress.lastXpDate =
    new Date();

  await progress.save();

  return {
    totalXp:
      progress.totalXp,

    weeklyXp:
      progress.weeklyXp,

    level:
      progress.level,
  };
};

const updateWorldAfterSuccess = async ({
  world,
  topicId,
}) => {
  let topicFound = false;
  let unitIndexFound = -1;
  let topicIndexFound = -1;

  world.units.forEach(
    (unit, unitIndex) => {
      unit.topics.forEach(
        (topic, topicIndex) => {
          if (
            String(topic._id) ===
            String(topicId)
          ) {
            topicFound = true;
            unitIndexFound =
              unitIndex;
            topicIndexFound =
              topicIndex;
          }
        }
      );
    }
  );

  if (!topicFound) {
    throw new Error(
      "Topic was not found in world."
    );
  }

  const topic =
    world.units[
      unitIndexFound
    ].topics[
      topicIndexFound
    ];

  const wasAlreadyCompleted =
    topic.status ===
    "completed";

  topic.status =
    "completed";

  let nextTopic = null;

  const sameUnit =
    world.units[
      unitIndexFound
    ];

  if (
    topicIndexFound + 1 <
    sameUnit.topics.length
  ) {
    nextTopic =
      sameUnit.topics[
        topicIndexFound + 1
      ];
  } else if (
    unitIndexFound + 1 <
    world.units.length
  ) {
    const nextUnit =
      world.units[
        unitIndexFound + 1
      ];

    nextTopic =
      nextUnit.topics?.[0] ||
      null;
  }

  if (nextTopic) {
    if (
      nextTopic.status ===
      "locked"
    ) {
      nextTopic.status =
        "unlocked";
    }

    world.currentTopicId =
      nextTopic._id;

    world.currentUnitOrder =
      nextTopic ===
      world.units[
        unitIndexFound
      ].topics?.[
        topicIndexFound + 1
      ]
        ? world.units[
            unitIndexFound
          ].order
        : world.units[
            unitIndexFound + 1
          ].order;
  } else {
    world.currentTopicId =
      topic._id;

    world.currentUnitOrder =
      world.units[
        unitIndexFound
      ].order;
  }

  const totalTopics =
    world.units.reduce(
      (total, unit) =>
        total +
        (unit.topics?.length ||
          0),
      0
    );

  const completedTopics =
    world.units.reduce(
      (total, unit) =>
        total +
        (unit.topics || []).filter(
          (item) =>
            item.status ===
            "completed"
        ).length,
      0
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

  return {
    nextTopic,
    progressPercent:
      world.progressPercent,
    wasAlreadyCompleted,
  };
};

const getWorldForUser = async (
  userId,
  worldId
) => {
  if (
    !safeObjectId(worldId)
  ) {
    return null;
  }

  return LearningWorld.findOne({
    _id: worldId,
    userId,
  });
};

const getTopicLearning = async (
  req,
  res
) => {
  try {
    const userId =
      getUserId(req);

    const {
      worldId,
      topicId,
    } = req.params;

    const world =
      await getWorldForUser(
        userId,
        worldId
      );

    if (!world) {
      return res.status(404).json({
        success: false,
        message:
          "Learning World not found.",
      });
    }

    const topicInfo =
      findTopic(
        world,
        topicId
      );

    if (!topicInfo) {
      return res.status(404).json({
        success: false,
        message:
          "Topic not found.",
      });
    }

    let content =
      await TopicLearningContent.findOne({
        userId,
        worldId,
        topicId,
      });

    if (
      !content ||
      content.questions?.length <
        5
    ) {
      content =
        await generateTopicExperience({
          userId,
          world,
          topicId,
        });
    }

    const mastery =
      await TopicMastery.findOne({
        userId,
        worldId,
        topicId,
      });

    return res.json({
      success: true,

      data: {
        worldId:
          world._id,

        learningSpaceId:
          world.learningSpaceId,

        unit: {
          _id:
            topicInfo.unit._id,
          title:
            topicInfo.unit.title,
          order:
            topicInfo.unit.order,
        },

        topic: {
          _id:
            topicInfo.topic._id,
          title:
            topicInfo.topic.title,
          description:
            topicInfo.topic.description,
          status:
            topicInfo.topic.status,
          xpReward:
            topicInfo.topic.xpReward,
        },

        content:
          sanitizeContent(
            content
          ),

        mastery: mastery
          ? {
              score:
                mastery.masteryScore,
              confidence:
                mastery.confidence,
              attempts:
                mastery.attempts,
            }
          : {
              score: 0,
              confidence: 0,
              attempts: 0,
            },
      },
    });
  } catch (error) {
    console.error(
      "Get topic learning error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to load topic learning.",
    });
  }
};

const startTopicAttempt =
  async (req, res) => {
    try {
      const userId =
        getUserId(req);

      const {
        worldId,
        topicId,
      } = req.params;

      const world =
        await getWorldForUser(
          userId,
          worldId
        );

      if (!world) {
        return res.status(404).json({
          success: false,
          message:
            "Learning World not found.",
        });
      }

      const topicInfo =
        findTopic(
          world,
          topicId
        );

      if (!topicInfo) {
        return res.status(404).json({
          success: false,
          message:
            "Topic not found.",
        });
      }

      if (
        topicInfo.topic.status ===
        "locked"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Complete the previous topic first.",
        });
      }

      let content =
        await TopicLearningContent.findOne({
          userId,
          worldId,
          topicId,
        });

      if (
        !content ||
        content.questions?.length <
          5
      ) {
        content =
          await generateTopicExperience({
            userId,
            world,
            topicId,
          });
      }

      const mastery =
        await TopicMastery.findOne({
          userId,
          worldId,
          topicId,
        });

      const attempt =
        await TopicAttempt.create({
          userId,

          learningSpaceId:
            world.learningSpaceId,

          worldId,

          topicId,

          topicTitle:
            topicInfo.topic.title,

          gameType:
            content.gameType,

          questionSnapshot:
            content.questions.map(
              (question) =>
                question.toObject
                  ? question.toObject()
                  : question
            ),

          answers: [],

          totalQuestions:
            content.questions.length,

          masteryBefore:
            mastery?.masteryScore ||
            0,

          status: "started",

          startedAt:
            new Date(),
        });

      return res.status(201).json({
        success: true,

        data:
          sanitizeAttempt(
            attempt
          ),
      });
    } catch (error) {
      console.error(
        "Start topic attempt error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to start topic challenge.",
      });
    }
  };

const getTopicAttempt =
  async (req, res) => {
    try {
      const userId =
        getUserId(req);

      const attempt =
        await TopicAttempt.findOne({
          _id:
            req.params.attemptId,
          userId,
        });

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message:
            "Attempt not found.",
        });
      }

      return res.json({
        success: true,

        data:
          sanitizeAttempt(
            attempt
          ),
      });
    } catch (error) {
      console.error(
        "Get topic attempt error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to load attempt.",
      });
    }
  };

const submitTopicAttempt =
  async (req, res) => {
    try {
      const userId =
        getUserId(req);

      const attempt =
        await TopicAttempt.findOne({
          _id:
            req.params.attemptId,
          userId,
        });

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message:
            "Attempt not found.",
        });
      }

      if (
        attempt.status ===
        "completed"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This attempt has already been submitted.",
        });
      }

      const submittedAnswers =
        Array.isArray(
          req.body?.answers
        )
          ? req.body.answers
          : [];

      const answerMap =
        new Map();

      submittedAnswers.forEach(
        (item) => {
          if (
            item?.questionId
          ) {
            answerMap.set(
              String(
                item.questionId
              ),
              item.answer
            );
          }
        }
      );

      const elapsedMs =
        Math.max(
          1000,
          Date.now() -
            new Date(
              attempt.startedAt
            ).getTime()
        );

      const questions =
        attempt.questionSnapshot ||
        [];

      let correctCount = 0;
      let totalPoints = 0;
      let earnedPoints = 0;

      const evaluatedAnswers =
        questions.map(
          (question) => {
            const answer =
              answerMap.get(
                String(
                  question.questionId
                )
              );

            const correct =
              answerMatches(
                question,
                answer
              );

            const points =
              Number(
                question.points
              ) || 10;

            totalPoints +=
              points;

            if (correct) {
              correctCount += 1;
              earnedPoints +=
                points;
            }

            return {
              questionId:
                question.questionId,

              answer:
                answer ?? null,

              correct,

              responseTimeMs:
                Math.round(
                  elapsedMs /
                    Math.max(
                      1,
                      questions.length
                    )
                ),
            };
          }
        );

      const totalQuestions =
        questions.length;

      const accuracy =
        totalQuestions > 0
          ? correctCount /
            totalQuestions
          : 0;

      const score =
        totalPoints > 0
          ? Math.round(
              (earnedPoints /
                totalPoints) *
                100
            )
          : 0;

      const averageResponseTime =
        Math.round(
          elapsedMs /
            Math.max(
              1,
              totalQuestions
            )
        );

      const previousMastery =
        attempt.masteryBefore ||
        0;

      const previousAttempts =
        await TopicAttempt.countDocuments(
          {
            userId,
            worldId:
              attempt.worldId,
            topicId:
              attempt.topicId,
            status: "completed",
          }
        );

      const {
        mastery,
        confidence,
      } = calculateMastery({
        previousMastery,
        accuracy,
        averageResponseTime,
        attempts:
          previousAttempts,
      });

      const passed =
        accuracy >= 0.7;

      const world =
        await LearningWorld.findOne({
          _id:
            attempt.worldId,
          userId,
        });

      if (!world) {
        return res.status(404).json({
          success: false,
          message:
            "Learning World not found.",
        });
      }

      const topicInfo =
        findTopic(
          world,
          attempt.topicId
        );

      if (!topicInfo) {
        return res.status(404).json({
          success: false,
          message:
            "Topic not found in world.",
        });
      }

      let xpAwarded = 0;
      let unlockResult = {
        nextTopic: null,
        progressPercent:
          world.progressPercent || 0,
        wasAlreadyCompleted:
          topicInfo.topic
            .status ===
          "completed",
      };

      if (passed) {
        const alreadyCompleted =
          topicInfo.topic.status ===
          "completed";

        if (!alreadyCompleted) {
          const baseXp =
            Number(
              topicInfo.topic
                .xpReward
            ) || 50;

          const performanceBonus =
            Math.min(
              30,
              Math.max(
                0,
                Math.round(
                  (accuracy -
                    0.7) *
                    100
                )
              )
            );

          xpAwarded =
            baseXp +
            performanceBonus;

          unlockResult =
            await updateWorldAfterSuccess({
              world,
              topicId:
                attempt.topicId,
            });
        }
      }

      attempt.answers =
        evaluatedAnswers;

      attempt.score =
        score;

      attempt.accuracy =
        Math.round(
          accuracy * 100
        );

      attempt.correctCount =
        correctCount;

      attempt.totalQuestions =
        totalQuestions;

      attempt.masteryAfter =
        mastery;

      attempt.xpAwarded =
        xpAwarded;

      attempt.passed =
        passed;

      attempt.status =
        "completed";

      attempt.completedAt =
        new Date();

      await attempt.save();

      const masteryRecord =
        await TopicMastery.findOneAndUpdate(
          {
            userId,

            worldId:
              attempt.worldId,

            topicId:
              attempt.topicId,
          },
          {
            $set: {
              learningSpaceId:
                attempt.learningSpaceId,

              topicTitle:
                attempt.topicTitle,

              masteryScore:
                mastery,

              confidence,

              attempts:
                previousAttempts +
                1,

              correctAttempts:
                correctCount,

              averageResponseTime,

              difficultyLevel:
                Math.round(
                  questions.reduce(
                    (
                      total,
                      question
                    ) =>
                      total +
                      (Number(
                        question.difficulty
                      ) || 2),
                    0
                  ) /
                    Math.max(
                      1,
                      questions.length
                    )
                ),

              lastAttempt:
                new Date(),

              lastRevision:
                passed
                  ? new Date()
                  : undefined,
            },
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert:
              true,
          }
        );

      const progress =
        await addXp(
          userId,
          xpAwarded
        );

      const responseQuestions =
        questions.map(
          (question) => {
            const evaluated =
              evaluatedAnswers.find(
                (item) =>
                  item.questionId ===
                  question.questionId
              );

            return {
              questionId:
                question.questionId,

              prompt:
                question.prompt,

              correct:
                evaluated?.correct ||
                false,

              selectedAnswer:
                evaluated?.answer ??
                null,

              explanation:
                question.explanation,

              correctAnswer:
                question.correctAnswer,
            };
          }
        );

      return res.json({
        success: true,

        data: {
          passed,

          score,

          accuracy:
            Math.round(
              accuracy * 100
            ),

          correctCount,

          totalQuestions,

          masteryBefore:
            previousMastery,

          masteryAfter:
            mastery,

          confidence,

          xpAwarded,

          alreadyCompleted:
            unlockResult
              .wasAlreadyCompleted,

          progressPercent:
            unlockResult
              .progressPercent,

          nextTopic:
            unlockResult.nextTopic
              ? {
                  _id:
                    unlockResult
                      .nextTopic
                      ._id,

                  title:
                    unlockResult
                      .nextTopic
                      .title,
                }
              : null,

          playerProgress:
            progress,

          questions:
            responseQuestions,

          novaMessage: passed
            ? "Amazing work, Explorer! Your mastery is growing."
            : "Almost there! Let's strengthen this concept and try again.",
        },
      });
    } catch (error) {
      console.error(
        "Submit topic attempt error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to evaluate the challenge.",
      });
    }
  };

const getTopicHistory =
  async (req, res) => {
    try {
      const userId =
        getUserId(req);

      const attempts =
        await TopicAttempt.find({
          userId,
          worldId:
            req.params.worldId,
          topicId:
            req.params.topicId,
        })
          .sort({
            createdAt: -1,
          })
          .limit(20)
          .select(
            "-questionSnapshot"
          );

      return res.json({
        success: true,
        data: attempts,
      });
    } catch (error) {
      console.error(
        "Get topic history error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load topic history.",
      });
    }
  };

module.exports = {
  getTopicLearning,
  startTopicAttempt,
  getTopicAttempt,
  submitTopicAttempt,
  getTopicHistory,
};
