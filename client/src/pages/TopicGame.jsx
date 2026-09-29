import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleHelp,
  LoaderCircle,
  Lock,
  Sparkles,
  Star,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("cognix_token") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("cognix_token") ||
  "";

const apiRequest = async (
  url,
  options = {}
) => {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (options.body) {
    headers["Content-Type"] =
      "application/json";
  }

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_URL}${url}`,
    {
      ...options,
      headers,
      credentials: "include",
    }
  );

  const result =
    await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
        "Something went wrong."
    );
  }

  return result;
};

const gameTitles = {
  treasure_quest: {
    label: "Treasure Quest",
    emoji: "🗺️",
  },

  rapid_fire: {
    label: "Rapid Fire",
    emoji: "⚡",
  },

  bridge_builder: {
    label: "Bridge Builder",
    emoji: "🌉",
  },

  memory_run: {
    label: "Memory Run",
    emoji: "🧠",
  },
};

const answerKey = (
  questionId,
  answer
) => ({
  questionId,
  answer,
});

export default function TopicGame({
  world,
  worldId,
  topicId,
  attemptId,
}) {
  const navigate =
    useNavigate();

  const [
    attempt,
    setAttempt,
  ] = useState(null);

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  const [
    answers,
    setAnswers,
  ] = useState({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    result,
    setResult,
  ] = useState(null);

  const loadAttempt =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await apiRequest(
            `/api/learning-worlds/${worldId}/attempts/${attemptId}`
          );

        setAttempt(
          response.data
        );
      } catch (requestError) {
        console.error(
          "Load attempt error:",
          requestError
        );

        setError(
          requestError.message
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadAttempt();
  }, [attemptId]);

  const questions =
    attempt?.questions ||
    [];

  const currentQuestion =
    questions[currentIndex];

  const game =
    gameTitles[
      attempt?.gameType
    ] ||
    gameTitles.treasure_quest;

  const answeredCount =
    Object.keys(
      answers
    ).length;

  const progress =
    questions.length > 0
      ? Math.round(
          (answeredCount /
            questions.length) *
            100
        )
      : 0;

  const setAnswer = (
    questionId,
    answer
  ) => {
    setAnswers(
      (previous) => ({
        ...previous,
        [questionId]:
          answer,
      })
    );
  };

  const toggleMultiAnswer = (
    questionId,
    optionId
  ) => {
    setAnswers(
      (previous) => {
        const existing =
          Array.isArray(
            previous[
              questionId
            ]
          )
            ? previous[
                questionId
              ]
            : [];

        const next =
          existing.includes(
            optionId
          )
            ? existing.filter(
                (item) =>
                  item !==
                  optionId
              )
            : [
                ...existing,
                optionId,
              ];

        return {
          ...previous,
          [questionId]:
            next,
        };
      }
    );
  };

  const canContinue =
    currentQuestion &&
    answers[
      currentQuestion
        .questionId
    ] !== undefined &&
    answers[
      currentQuestion
        .questionId
    ] !== null &&
    (!Array.isArray(
      answers[
        currentQuestion
          .questionId
      ]
    ) ||
      answers[
        currentQuestion
          .questionId
      ].length > 0);

  const goNext =
    () => {
      if (!canContinue) {
        return;
      }

      if (
        currentIndex <
        questions.length - 1
      ) {
        setCurrentIndex(
          (value) =>
            value + 1
        );
      }
    };

  const goPrevious =
    () => {
      if (
        currentIndex > 0
      ) {
        setCurrentIndex(
          (value) =>
            value - 1
        );
      }
    };

  const submit =
    async () => {
      if (
        submitting ||
        !questions.length
      ) {
        return;
      }

      const incomplete =
        questions.some(
          (question) =>
            answers[
              question.questionId
            ] === undefined ||
            answers[
              question.questionId
            ] === null ||
            (Array.isArray(
              answers[
                question
                  .questionId
              ]
            ) &&
              answers[
                question
                  .questionId
              ].length === 0)
        );

      if (incomplete) {
        setError(
          "Complete every challenge before finishing your quest."
        );

        return;
      }

      try {
        setSubmitting(true);
        setError("");

        const payload = {
          answers:
            questions.map(
              (question) =>
                answerKey(
                  question.questionId,
                  answers[
                    question
                      .questionId
                  ]
                )
            ),
        };

        const response =
          await apiRequest(
            `/api/learning-worlds/${worldId}/attempts/${attemptId}/submit`,
            {
              method: "POST",
              body: JSON.stringify(
                payload
              ),
            }
          );

        setResult(
          response.data
        );

        window.dispatchEvent(
          new CustomEvent(
            "cognix-topic-complete",
            {
              detail: {
                result:
                  response.data,
              },
            }
          )
        );
      } catch (requestError) {
        console.error(
          "Submit attempt error:",
          requestError
        );

        setError(
          requestError.message
        );
      } finally {
        setSubmitting(false);
      }
    };

  if (loading) {
    return (
      <main className="topic-game-page">
        <div className="topic-loading">
          <LoaderCircle
            size={35}
            className="topic-spin"
          />

          <h2>
            Nova is preparing
            your challenge...
          </h2>

          <p>
            Your questions are
            generated from this
            learning topic.
          </p>
        </div>
      </main>
    );
  }

  if (error && !attempt) {
    return (
      <main className="topic-game-page">
        <div className="topic-error">
          <CircleHelp size={30} />

          <h2>
            Challenge unavailable
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="topic-primary-button"
            onClick={loadAttempt}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (result) {
    return (
      <ResultScreen
        result={result}
        game={game}
        worldId={worldId}
        topicId={topicId}
        navigate={navigate}
      />
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <main className="topic-game-page">
      <div className="game-shell">
        <header className="game-header">
          <button
            type="button"
            className="game-back"
            onClick={() =>
              navigate(
                `/worlds/${worldId}?topic=${topicId}`
              )
            }
          >
            <ArrowLeft size={17} />
            Lesson
          </button>

          <div className="game-title">
            <span>
              {game.emoji}
              {" "}
              {game.label}
            </span>

            <strong>
              {currentIndex + 1}
              {" / "}
              {questions.length}
            </strong>
          </div>

          <div className="game-xp">
            <Zap size={16} />
            +XP after mastery
          </div>
        </header>

        <div className="game-progress">
          <motion.div
            animate={{
              width: `${Math.max(
                4,
                ((currentIndex + 1) /
                  questions.length) *
                  100
              )}%`,
            }}
          />
        </div>

        <section className="game-world">
          <div className="game-world-decoration game-tree">
            🌳
          </div>

          <div className="game-world-decoration game-star">
            ⭐
          </div>

          <motion.div
            className="game-nova"
            animate={{
              y: [
                0,
                -7,
                0,
              ],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
            }}
          >
            <div>
              <Sparkles
                size={24}
              />
            </div>

            <span>
              NOVA
            </span>
          </motion.div>

          <div className="game-question-card">
            <div className="game-question-badge">
              {currentQuestion.type ===
              "mcq"
                ? "MULTIPLE CHOICE"
                : currentQuestion.type ===
                  "true_false"
                ? "TRUE OR FALSE"
                : currentQuestion.type ===
                  "fill_blank"
                ? "FILL THE GAP"
                : "SELECT ALL"}
            </div>

            <h1>
              {currentQuestion.prompt}
            </h1>

            <QuestionRenderer
              question={
                currentQuestion
              }
              answer={
                answers[
                  currentQuestion
                    .questionId
                ]
              }
              setAnswer={
                (value) =>
                  setAnswer(
                    currentQuestion
                      .questionId,
                    value
                  )
              }
              toggleMultiAnswer={
                (value) =>
                  toggleMultiAnswer(
                    currentQuestion
                      .questionId,
                    value
                  )
              }
            />
          </div>
        </section>

        {error && (
          <div className="game-error">
            <X size={17} />
            {error}
          </div>
        )}

        <footer className="game-footer">
          <button
            type="button"
            className="game-secondary-button"
            onClick={
              goPrevious
            }
            disabled={
              currentIndex ===
              0
            }
          >
            <ArrowLeft
              size={17}
            />
            Previous
          </button>

          <span>
            {
              Object.keys(
                answers
              ).length
            }{" "}
            /{" "}
            {
              questions.length
            }{" "}
            answered
          </span>

          {currentIndex <
          questions.length - 1 ? (
            <button
              type="button"
              className="game-primary-button"
              onClick={goNext}
              disabled={
                !canContinue
              }
            >
              Continue
              <ArrowRight
                size={17}
              />
            </button>
          ) : (
            <button
              type="button"
              className="game-primary-button"
              onClick={
                submit
              }
              disabled={
                !canContinue ||
                submitting
              }
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="topic-spin"
                  />
                  Evaluating...
                </>
              ) : (
                <>
                  Finish Quest
                  <Trophy
                    size={17}
                  />
                </>
              )}
            </button>
          )}
        </footer>
      </div>
    </main>
  );
}

function QuestionRenderer({
  question,
  answer,
  setAnswer,
  toggleMultiAnswer,
}) {
  if (
    question.type ===
    "fill_blank"
  ) {
    return (
      <div className="fill-blank-answer">
        <input
          type="text"
          value={
            answer || ""
          }
          onChange={(event) =>
            setAnswer(
              event.target.value
            )
          }
          placeholder="Type your answer..."
          autoComplete="off"
        />
      </div>
    );
  }

  if (
    question.type ===
    "true_false"
  ) {
    return (
      <div className="answer-grid true-false-grid">
        {[
          {
            id: "true",
            text: "True",
          },
          {
            id: "false",
            text: "False",
          },
        ].map(
          (option) => (
            <AnswerButton
              key={option.id}
              option={option}
              selected={
                answer ===
                option.id
              }
              onClick={() =>
                setAnswer(
                  option.id
                )
              }
            />
          )
        )}
      </div>
    );
  }

  if (
    question.type ===
    "multi_select"
  ) {
    const selected =
      Array.isArray(
        answer
      )
        ? answer
        : [];

    return (
      <div className="answer-grid">
        {question.options.map(
          (option) => (
            <AnswerButton
              key={option.id}
              option={option}
              selected={selected.includes(
                option.id
              )}
              multi
              onClick={() =>
                toggleMultiAnswer(
                  option.id
                )
              }
            />
          )
        )}
      </div>
    );
  }

  return (
    <div className="answer-grid">
      {question.options.map(
        (option) => (
          <AnswerButton
            key={option.id}
            option={option}
            selected={
              answer ===
              option.id
            }
            onClick={() =>
              setAnswer(
                option.id
              )
            }
          />
        )
      )}
    </div>
  );
}

function AnswerButton({
  option,
  selected,
  onClick,
  multi = false,
}) {
  return (
    <motion.button
      type="button"
      className={`answer-button ${
        selected
          ? "selected"
          : ""
      }`}
      whileTap={{
        scale: 0.98,
      }}
      onClick={
        onClick
      }
    >
      <span className="answer-letter">
        {multi ? (
          selected ? (
            <Check
              size={17}
            />
          ) : (
            ""
          )
        ) : (
          option.id
        )}
      </span>

      <span>
        {option.text}
      </span>

      {selected && (
        <Check
          size={18}
          className="answer-check"
        />
      )}
    </motion.button>
  );
}

function ResultScreen({
  result,
  game,
  worldId,
  topicId,
  navigate,
}) {
  const passed =
    result.passed;

  return (
    <main className="result-page">
      <motion.div
        className={`result-card ${
          passed
            ? "result-success"
            : "result-retry"
        }`}
        initial={{
          opacity: 0,
          scale: 0.85,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
      >
        <div className="result-nova">
          <motion.div
            animate={{
              y: [
                0,
                -12,
                0,
              ],
              rotate: [
                -5,
                5,
                -5,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <Sparkles
              size={46}
            />
          </motion.div>

          <span>
            NOVA
          </span>
        </div>

        <div className="result-badge">
          {passed ? (
            <CheckCircle2
              size={28}
            />
          ) : (
            <CircleHelp
              size={28}
            />
          )}
        </div>

        <span className="result-eyebrow">
          {passed
            ? "QUEST COMPLETE"
            : "PRACTICE ROUND"}
        </span>

        <h1>
          {passed
            ? "You did it, Explorer!"
            : "Almost there!"}
        </h1>

        <p className="result-nova-message">
          {result.novaMessage}
        </p>

        <div className="result-stats">
          <div>
            <span>
              SCORE
            </span>

            <strong>
              {result.score}%
            </strong>
          </div>

          <div>
            <span>
              MASTERY
            </span>

            <strong>
              {result.masteryAfter}%
            </strong>
          </div>

          <div>
            <span>
              ACCURACY
            </span>

            <strong>
              {result.accuracy}%
            </strong>
          </div>
        </div>

        {passed && (
          <div className="result-xp">
            <Zap size={23} />
            <strong>
              +{result.xpAwarded} XP
            </strong>

            {result.playerProgress && (
              <span>
                Total XP:{" "}
                {
                  result
                    .playerProgress
                    .totalXp
                }
              </span>
            )}
          </div>
        )}

        <div className="result-feedback">
          <div className="result-feedback-icon">
            <Trophy size={19} />
          </div>

          <div>
            <strong>
              Nova's feedback
            </strong>

            <p>
              {passed
                ? `Your mastery moved from ${result.masteryBefore}% to ${result.masteryAfter}%.`
                : `Your current mastery is ${result.masteryAfter}%. Review the lesson and try the quest again.`}
            </p>
          </div>
        </div>

        {passed &&
        result.nextTopic ? (
          <button
            type="button"
            className="result-primary-button"
            onClick={() =>
              navigate(
                `/worlds/${worldId}?topic=${result.nextTopic._id}`
              )
            }
          >
            Continue to{" "}
            {
              result
                .nextTopic
                .title
            }
            <ArrowRight
              size={18}
            />
          </button>
        ) : passed ? (
          <button
            type="button"
            className="result-primary-button"
            onClick={() =>
              navigate(
                `/worlds/${worldId}`
              )
            }
          >
            Return to Adventure Map
            <ArrowRight
              size={18}
            />
          </button>
        ) : (
          <div className="result-actions">
            <button
              type="button"
              className="result-secondary-button"
              onClick={() =>
                navigate(
                  `/worlds/${worldId}?topic=${topicId}`
                )
              }
            >
              Review Lesson
            </button>

            <button
              type="button"
              className="result-primary-button"
              onClick={() =>
                window.location.reload()
              }
            >
              Try Quest Again
              <ArrowRight
                size={18}
              />
            </button>
          </div>
        )}
      </motion.div>
    </main>
  );
}
