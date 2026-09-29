import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Lock,
  Map,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("cognix_token") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("cognix_token") ||
    ""
  );
};

const apiRequest = async (
  endpoint,
  options = {}
) => {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/api${endpoint}`,
    {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
        ...(options.headers || {}),
      },
    }
  );

  let result = {};

  try {
    result = await response.json();
  } catch {
    throw new Error(
      "The server returned an invalid response."
    );
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
        "Something went wrong."
    );
  }

  return result;
};

const getTopicState = (
  topic
) => {
  if (topic.status === "completed") {
    return "completed";
  }

  if (topic.status === "unlocked") {
    return "unlocked";
  }

  return "locked";
};

export default function LearningWorld() {
  const { worldId } = useParams();
  const navigate = useNavigate();

  const [world, setWorld] = useState(null);
  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedTopic, setSelectedTopic] =
    useState(null);

  const [completing, setCompleting] =
    useState(false);

  const [reward, setReward] =
    useState(null);

  const [celebrating, setCelebrating] =
    useState(false);

  const loadWorld = async () => {
    try {
      setLoading(true);
      setError("");

      const result =
        await apiRequest(
          `/learning-worlds/${worldId}`
        );

      setWorld(result.world);
    } catch (loadError) {
      console.error(
        "Learning World load error:",
        loadError
      );

      setError(
        loadError.message ||
          "Unable to load this Learning World."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (worldId) {
      loadWorld();
    }
  }, [worldId]);

  const allTopics = useMemo(() => {
    if (!world?.units) {
      return [];
    }

    return world.units.flatMap(
      (unit) =>
        unit.topics.map(
          (topic) => ({
            ...topic,
            unitTitle: unit.title,
            unitOrder: unit.order,
          })
        )
    );
  }, [world]);

  const completedCount =
    allTopics.filter(
      (topic) =>
        topic.status ===
        "completed"
    ).length;

  const totalCount =
    allTopics.length;

  const progress =
    totalCount > 0
      ? Math.round(
          (completedCount /
            totalCount) *
            100
        )
      : 0;

  const currentTopic =
    allTopics.find(
      (topic) =>
        String(topic._id) ===
        String(
          world?.currentTopicId
        )
    ) ||
    allTopics.find(
      (topic) =>
        topic.status ===
        "unlocked"
    );

  const completeTopic = async (
    topic
  ) => {
    if (
      !topic ||
      topic.status !== "unlocked" ||
      completing
    ) {
      return;
    }

    try {
      setCompleting(true);
      setError("");

      const result =
        await apiRequest(
          `/learning-worlds/${worldId}/topics/${topic._id}/complete`,
          {
            method: "POST",
          }
        );

      setWorld(result.world);

      setReward(
        result.xpAwarded || 0
      );

      setSelectedTopic(null);

      setCelebrating(true);

      window.setTimeout(() => {
        setCelebrating(false);
      }, 1800);
    } catch (completeError) {
      console.error(
        "Complete topic error:",
        completeError
      );

      setError(
        completeError.message ||
          "Unable to complete this topic."
      );
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <main className="world-page world-loading-page">
        <motion.div
          className="world-loader"
          initial={{
            opacity: 0,
            scale: 0.9,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
        >
          <div className="world-loader-icon">
            <Sparkles size={30} />
          </div>

          <h2>
            Entering your world...
          </h2>

          <p>
            Nova is preparing your
            adventure.
          </p>

          <div className="world-loading-bar">
            <span />
          </div>
        </motion.div>
      </main>
    );
  }

  if (error && !world) {
    return (
      <main className="world-page">
        <div className="world-error">
          <div className="world-error-icon">
            !
          </div>

          <h2>
            We couldn't open this world.
          </h2>

          <p>{error}</p>

          <div className="world-error-actions">
            <button
              type="button"
              className="world-button"
              onClick={loadWorld}
            >
              Try Again
            </button>

            <Link
              to="/worlds"
              className="world-button secondary"
            >
              <ArrowLeft size={17} />
              Back to Worlds
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="world-page">
      <div className="world-sky-decoration world-cloud-one" />
      <div className="world-sky-decoration world-cloud-two" />

      <div className="world-floating-star star-one">
        ✦
      </div>

      <div className="world-floating-star star-two">
        ✦
      </div>

      <div className="world-container">
        <header className="world-header">
          <Link
            to="/worlds"
            className="world-back-button"
          >
            <ArrowLeft size={17} />
            My Worlds
          </Link>

          <div className="world-title-area">
            <span className="world-kicker">
              <Map size={14} />
              YOUR LEARNING ADVENTURE
            </span>

            <h1>
              {world?.title ||
                "Learning World"}
            </h1>

            <p>
              {world?.description ||
                "Follow the path, master each concept and unlock the next part of your adventure."}
            </p>
          </div>

          <div className="world-progress-card">
            <div className="world-progress-top">
              <span>
                WORLD PROGRESS
              </span>

              <strong>
                {progress}%
              </strong>
            </div>

            <div className="world-progress-track">
              <motion.div
                className="world-progress-fill"
                initial={{
                  width: 0,
                }}
                animate={{
                  width: `${progress}%`,
                }}
                transition={{
                  duration: 0.8,
                }}
              />
            </div>

            <small>
              {completedCount} of{" "}
              {totalCount} topics
              mastered
            </small>
          </div>
        </header>

        {error && (
          <div className="world-inline-error">
            {error}
          </div>
        )}

        <section className="nova-world-banner">
          <div className="nova-world-orb">
            <Sparkles size={23} />
          </div>

          <div>
            <strong>
              Nova's mission briefing
            </strong>

            <p>
              {currentTopic
                ? `Your next quest is ${currentTopic.title}. Complete it to unlock the next path.`
                : "Amazing work! Your adventure is complete."}
            </p>
          </div>

          <div className="nova-world-xp">
            <Zap size={16} />
            Earn XP
          </div>
        </section>

        <section className="roadmap-section">
          <div className="roadmap-heading">
            <div>
              <span className="world-kicker">
                THE ADVENTURE MAP
              </span>

              <h2>
                Follow the path
              </h2>

              <p>
                Each concept unlocks only
                after the previous one is
                completed.
              </p>
            </div>

            <div className="roadmap-legend">
              <span>
                <i className="legend-dot completed" />
                Completed
              </span>

              <span>
                <i className="legend-dot unlocked" />
                Current
              </span>

              <span>
                <i className="legend-dot locked" />
                Locked
              </span>
            </div>
          </div>

          <div className="roadmap-world">
            <div className="roadmap-road road-left" />
            <div className="roadmap-road road-right" />

            <div className="roadmap-decor decor-tree-one">
              🌳
            </div>

            <div className="roadmap-decor decor-tree-two">
              🌲
            </div>

            <div className="roadmap-decor decor-rock-one">
              🪨
            </div>

            <div className="roadmap-decor decor-flower-one">
              🌼
            </div>

            <div className="roadmap-decor decor-flower-two">
              🌸
            </div>

            {world?.units?.map(
              (unit, unitIndex) => (
                <div
                  className="world-unit"
                  key={
                    unit._id ||
                    unitIndex
                  }
                >
                  <div className="world-unit-header">
                    <div className="unit-badge">
                      {unit.order}
                    </div>

                    <div>
                      <span>
                        UNIT{" "}
                        {unit.order}
                      </span>

                      <h3>
                        {unit.title}
                      </h3>

                      {unit.description && (
                        <p>
                          {
                            unit.description
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="topic-path">
                    {unit.topics.map(
                      (
                        topic,
                        topicIndex
                      ) => {
                        const state =
                          getTopicState(
                            topic
                          );

                        const isCurrent =
                          String(
                            world.currentTopicId
                          ) ===
                          String(
                            topic._id
                          );

                        const side =
                          topicIndex %
                            2 ===
                          0
                            ? "left"
                            : "right";

                        return (
                          <motion.button
                            key={
                              topic._id
                            }
                            type="button"
                            className={`topic-node ${state} ${side} ${
                              isCurrent
                                ? "current"
                                : ""
                            }`}
                            disabled={
                              state ===
                              "locked"
                            }
                            onClick={() =>
                              setSelectedTopic(
                                topic
                              )
                            }
                            initial={{
                              opacity: 0,
                              y: 25,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            transition={{
                              delay:
                                topicIndex *
                                0.08,
                            }}
                            whileHover={
                              state !==
                              "locked"
                                ? {
                                    y: -6,
                                    scale: 1.03,
                                  }
                                : {}
                            }
                            whileTap={
                              state !==
                              "locked"
                                ? {
                                    scale: 0.97,
                                  }
                                : {}
                            }
                          >
                            <div className="topic-node-glow" />

                            <div className="topic-node-icon">
                              {state ===
                              "completed" ? (
                                <Check size={23} />
                              ) : state ===
                                "locked" ? (
                                <Lock size={20} />
                              ) : (
                                <Star
                                  size={23}
                                />
                              )}
                            </div>

                            <div className="topic-node-content">
                              <small>
                                QUEST{" "}
                                {unit.order}.
                                {topicIndex +
                                  1}
                              </small>

                              <strong>
                                {
                                  topic.title
                                }
                              </strong>

                              {topic.description && (
                                <span>
                                  {
                                    topic.description
                                  }
                                </span>
                              )}

                              <em>
                                +{" "}
                                {topic.xpReward ||
                                  50}{" "}
                                XP
                              </em>
                            </div>

                            {state ===
                              "completed" && (
                              <div className="topic-complete-badge">
                                <CheckCircle2
                                  size={16}
                                />
                              </div>
                            )}
                          </motion.button>
                        );
                      }
                    )}
                  </div>
                </div>
              )
            )}

            {totalCount > 0 &&
              completedCount ===
                totalCount && (
                <motion.div
                  className="world-finish-card"
                  initial={{
                    opacity: 0,
                    scale: 0.85,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                >
                  <div className="finish-trophy">
                    <Trophy size={38} />
                  </div>

                  <span>
                    ADVENTURE COMPLETE
                  </span>

                  <h2>
                    You mastered this
                    world!
                  </h2>

                  <p>
                    Every topic has been
                    completed. Nova is proud
                    of your progress.
                  </p>

                  <Link
                    to="/worlds"
                    className="world-button"
                  >
                    <ArrowLeft size={17} />
                    Back to My Worlds
                  </Link>
                </motion.div>
              )}
          </div>
        </section>
      </div>

      {celebrating && (
        <motion.div
          className="world-celebration"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
        >
          <motion.div
            className="celebration-card"
            initial={{
              scale: 0.7,
              y: 40,
            }}
            animate={{
              scale: 1,
              y: 0,
            }}
          >
            <div className="celebration-stars">
              ✦ ✦ ✦
            </div>

            <Trophy size={40} />

            <h2>
              Quest Complete!
            </h2>

            <strong>
              +{reward} XP
            </strong>

            <p>
              The next part of your
              adventure is unlocked.
            </p>
          </motion.div>
        </motion.div>
      )}

      {selectedTopic && (
        <div
          className="topic-modal-backdrop"
          onClick={() =>
            setSelectedTopic(null)
          }
        >
          <motion.div
            className="topic-modal"
            initial={{
              opacity: 0,
              scale: 0.9,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="topic-modal-icon">
              <Sparkles size={25} />
            </div>

            <span className="world-kicker">
              YOUR NEXT QUEST
            </span>

            <h2>
              {selectedTopic.title}
            </h2>

            <p>
              {selectedTopic.description ||
                "Strengthen this concept and move forward on your learning adventure."}
            </p>

            <div className="topic-reward">
              <Zap size={18} />
              <strong>
                +{selectedTopic.xpReward ||
                  50} XP
              </strong>
              <span>
                quest reward
              </span>
            </div>

            <div className="topic-modal-actions">
              <button
                type="button"
                className="world-button secondary"
                onClick={() =>
                  setSelectedTopic(null)
                }
              >
                Later
              </button>

              <button
                type="button"
                className="world-button"
                disabled={completing}
                onClick={() =>
                  completeTopic(
                    selectedTopic
                  )
                }
              >
                {completing
                  ? "Completing..."
                  : "Complete Quest"}

                <ArrowRight
                  size={17}
                />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
