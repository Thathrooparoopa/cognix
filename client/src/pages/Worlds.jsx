import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  LoaderCircle,
  Plus,
  RefreshCw,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

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

const formatDate = (
  value
) => {
  if (!value) {
    return "Recently";
  }

  return new Date(
    value
  ).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
};

export default function Worlds() {
  const navigate = useNavigate();

  const [
    learningSpaces,
    setLearningSpaces,
  ] = useState([]);

  const [worlds, setWorlds] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    generatingId,
    setGeneratingId,
  ] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        spacesResult,
        worldsResult,
      ] = await Promise.all([
        apiRequest(
          "/learning-spaces"
        ),
        apiRequest(
          "/learning-worlds"
        ),
      ]);

      setLearningSpaces(
        spacesResult.learningSpaces ||
          spacesResult.spaces ||
          spacesResult.data ||
          []
      );

      setWorlds(
        worldsResult.worlds || []
      );
    } catch (loadError) {
      console.error(
        "Load Worlds error:",
        loadError
      );

      setError(
        loadError.message ||
          "Unable to load your Learning Worlds."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const worldBySpace =
    useMemo(() => {
      const map = new Map();

      worlds.forEach(
        (world) => {
          const spaceId =
            world.learningSpaceId?._id ||
            world.learningSpaceId;

          if (spaceId) {
            map.set(
              String(spaceId),
              world
            );
          }
        }
      );

      return map;
    }, [worlds]);

  const adventureCards =
    useMemo(() => {
      return learningSpaces.map(
        (space) => ({
          space,
          world:
            worldBySpace.get(
              String(
                space._id ||
                  space.id
              )
            ) || null,
        })
      );
    }, [
      learningSpaces,
      worldBySpace,
    ]);

  const buildWorld = async (
    learningSpaceId
  ) => {
    try {
      setGeneratingId(
        String(learningSpaceId)
      );

      setError("");

      const result =
        await apiRequest(
          "/learning-worlds",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              learningSpaceId,
            }),
          }
        );

      if (result.world?._id) {
        navigate(
          `/worlds/${result.world._id}`
        );
        return;
      }

      await loadData();
    } catch (buildError) {
      console.error(
        "Build World error:",
        buildError
      );

      setError(
        buildError.message ||
          "Unable to build this Learning World."
      );
    } finally {
      setGeneratingId(null);
    }
  };

  const openWorld = (
    world
  ) => {
    if (!world?._id) {
      return;
    }

    navigate(
      `/worlds/${world._id}`
    );
  };

  return (
    <main className="page-container worlds-page">
      <div className="worlds-hero">
        <div>
          <span className="eyebrow">
            <Sparkles size={13} />
            YOUR ADVENTURE
          </span>

          <h1>
            My Learning Worlds
          </h1>

          <p>
            Your Learning Spaces become
            personalized worlds built from
            your own syllabus.
          </p>
        </div>

        <Link
          to="/learning-space"
          className="primary-button"
        >
          <Plus size={17} />
          New Learning Space
        </Link>
      </div>

      {error && (
        <div className="worlds-error">
          <div>
            <strong>
              Something went wrong
            </strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={loadData}
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="worlds-loading">
          <LoaderCircle
            size={25}
            className="world-spin"
          />

          <span>
            Loading your adventures...
          </span>
        </div>
      ) : adventureCards.length ===
        0 ? (
        <section className="worlds-empty">
          <div className="worlds-empty-icon">
            <BookOpen size={34} />
          </div>

          <h2>
            Your adventure is waiting.
          </h2>

          <p>
            Create a Learning Space with
            your syllabus and Cognix will
            turn it into your first
            interactive world.
          </p>

          <Link
            to="/learning-space"
            className="primary-button"
          >
            Create My First World
            <ArrowRight size={17} />
          </Link>
        </section>
      ) : (
        <section className="world-adventure-grid">
          {adventureCards.map(
            ({
              space,
              world,
            }) => {
              const spaceId =
                space._id ||
                space.id;

              const isGenerating =
                generatingId ===
                String(spaceId);

              const isReady =
                world?.status ===
                "ready";

              const isFailed =
                world?.status ===
                "failed";

              const progress =
                world?.progressPercent ||
                0;

              const totalTopics =
                world?.units?.reduce(
                  (
                    total,
                    unit
                  ) =>
                    total +
                    (unit.topics
                      ?.length ||
                      0),
                  0
                ) || 0;

              const completedTopics =
                world?.units?.reduce(
                  (
                    total,
                    unit
                  ) =>
                    total +
                    (unit.topics ||
                      []).filter(
                        (topic) =>
                          topic.status ===
                          "completed"
                      ).length,
                  0
                ) || 0;

              return (
                <motion.article
                  key={spaceId}
                  className={`adventure-card ${
                    isReady
                      ? "world-ready"
                      : ""
                  }`}
                  whileHover={{
                    y: -6,
                  }}
                >
                  <div className="adventure-card-top">
                    <div className="adventure-icon">
                      <BookOpen size={23} />
                    </div>

                    <span
                      className={`adventure-status ${
                        isReady
                          ? "ready"
                          : isFailed
                            ? "failed"
                            : isGenerating
                              ? "building"
                              : "created"
                      }`}
                    >
                      {isReady
                        ? "READY"
                        : isGenerating
                          ? "BUILDING"
                          : isFailed
                            ? "FAILED"
                            : "CREATED"}
                    </span>
                  </div>

                  <div className="adventure-content">
                    <h2>
                      {space.subject}
                    </h2>

                    <p>
                      {space.goal ||
                        "A personalized learning adventure created from your syllabus."}
                    </p>

                    <div className="adventure-file">
                      <BookOpen size={15} />

                      <span>
                        {space.syllabus
                          ?.originalName ||
                          "Uploaded syllabus"}
                      </span>
                    </div>
                  </div>

                  {isReady && (
                    <div className="adventure-progress">
                      <div className="adventure-progress-top">
                        <span>
                          Adventure progress
                        </span>

                        <strong>
                          {progress}%
                        </strong>
                      </div>

                      <div className="adventure-progress-track">
                        <motion.div
                          className="adventure-progress-fill"
                          initial={{
                            width: 0,
                          }}
                          animate={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>

                      <div className="adventure-stats">
                        <span>
                          <CheckCircle2
                            size={14}
                          />
                          {
                            completedTopics
                          }{" "}
                          completed
                        </span>

                        <span>
                          <Zap
                            size={14}
                          />
                          {
                            totalTopics
                          }{" "}
                          quests
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="adventure-footer">
                    <small>
                      Created{" "}
                      {formatDate(
                        space.createdAt
                      )}
                    </small>

                    {!world ? (
                      <button
                        type="button"
                        className="world-action-button"
                        disabled={
                          isGenerating
                        }
                        onClick={() =>
                          buildWorld(
                            spaceId
                          )
                        }
                      >
                        {isGenerating ? (
                          <>
                            <LoaderCircle
                              size={16}
                              className="world-spin"
                            />
                            Building...
                          </>
                        ) : (
                          <>
                            <Sparkles
                              size={16}
                            />
                            Build World
                            <ArrowRight
                              size={16}
                            />
                          </>
                        )}
                      </button>
                    ) : isReady ? (
                      <button
                        type="button"
                        className="world-action-button"
                        onClick={() =>
                          openWorld(
                            world
                          )
                        }
                      >
                        Open World
                        <ArrowRight
                          size={16}
                        />
                      </button>
                    ) : isGenerating ? (
                      <button
                        type="button"
                        className="world-action-button"
                        disabled
                      >
                        <LoaderCircle
                          size={16}
                          className="world-spin"
                        />
                        Building...
                      </button>
                    ) : isFailed ? (
                      <button
                        type="button"
                        className="world-action-button"
                        onClick={() =>
                          buildWorld(
                            spaceId
                          )
                        }
                      >
                        Rebuild World
                        <ArrowRight
                          size={16}
                        />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="world-action-button"
                        onClick={() =>
                          openWorld(
                            world
                          )
                        }
                      >
                        Open World
                        <ArrowRight
                          size={16}
                        />
                      </button>
                    )}
                  </div>
                </motion.article>
              );
            }
          )}
        </section>
      )}

      {worlds.length > 0 && (
        <div className="worlds-summary">
          <div>
            <Trophy size={19} />
            <span>
              {worlds.filter(
                (world) =>
                  world.status ===
                  "ready"
              ).length}{" "}
              worlds ready for adventure
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
