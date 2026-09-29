const fs = require("fs/promises");

const LearningSpace = require("../../models/LearningSpace");
const TopicLearningContent = require("../../models/TopicLearningContent");

const {
  extractSyllabusText,
} = require("./syllabusParser");

const DEFAULT_MODEL =
  process.env.AI_MODEL_FAST ||
  process.env.AI_MODEL_PRIMARY ||
  "google/gemini-2.0-flash-001";

const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL ||
  "https://openrouter.ai/api/v1";

const cleanText = (value) =>
  String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

const parseJson = (content) => {
  let text = cleanText(content);

  text = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(text);
  } catch {}

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");

  if (first === -1 || last === -1) {
    throw new Error(
      "AI did not return valid JSON."
    );
  }

  return JSON.parse(
    text.substring(first, last + 1)
  );
};

const normalizeQuestion = (question, index) => {
  const allowedTypes = [
    "mcq",
    "true_false",
    "fill_blank",
    "multi_select",
  ];

  const type = allowedTypes.includes(question?.type)
    ? question.type
    : "mcq";

  let options = Array.isArray(question?.options)
    ? question.options
        .map((option, optionIndex) => ({
          id:
            String(option?.id || "")
              .trim() ||
            String.fromCharCode(65 + optionIndex),
          text: cleanText(option?.text),
        }))
        .filter((option) => option.text)
    : [];

  if (type === "true_false" && options.length === 0) {
    options = [
      {
        id: "true",
        text: "True",
      },
      {
        id: "false",
        text: "False",
      },
    ];
  }

  let correctAnswer = question?.correctAnswer;

  if (
    type === "multi_select" &&
    !Array.isArray(correctAnswer)
  ) {
    correctAnswer = [];
  }

  if (
    type !== "multi_select" &&
    typeof correctAnswer === "object"
  ) {
    correctAnswer = String(
      correctAnswer?.id ||
        correctAnswer?.value ||
        ""
    );
  }

  return {
    questionId:
      String(question?.questionId || "").trim() ||
      `question-${index + 1}`,

    type,

    prompt:
      cleanText(question?.prompt) ||
      `Question ${index + 1}`,

    options,

    correctAnswer,

    explanation: cleanText(
      question?.explanation
    ),

    difficulty: Math.min(
      5,
      Math.max(
        1,
        Number(question?.difficulty) || 2
      )
    ),

    points: Math.min(
      25,
      Math.max(
        5,
        Number(question?.points) || 10
      )
    ),
  };
};

const normalizeContent = (raw) => {
  if (!raw || typeof raw !== "object") {
    throw new Error(
      "AI returned an invalid topic experience."
    );
  }

  const learningSections = Array.isArray(
    raw.learningSections
  )
    ? raw.learningSections
        .map((section) => ({
          heading:
            cleanText(section?.heading) ||
            "Concept",

          body: cleanText(section?.body),

          bullets: Array.isArray(
            section?.bullets
          )
            ? section.bullets
                .map(cleanText)
                .filter(Boolean)
                .slice(0, 6)
            : [],
        }))
        .filter(
          (section) =>
            section.heading ||
            section.body ||
            section.bullets.length
        )
        .slice(0, 6)
    : [];

  const quickRecap = Array.isArray(
    raw.quickRecap
  )
    ? raw.quickRecap
        .map(cleanText)
        .filter(Boolean)
        .slice(0, 6)
    : [];

  const allowedGames = [
    "treasure_quest",
    "rapid_fire",
    "bridge_builder",
    "memory_run",
  ];

  const gameType = allowedGames.includes(
    raw.gameType
  )
    ? raw.gameType
    : "treasure_quest";

  const questions = Array.isArray(raw.questions)
    ? raw.questions
        .map(normalizeQuestion)
        .slice(0, 8)
    : [];

  if (learningSections.length === 0) {
    throw new Error(
      "AI did not generate learning content."
    );
  }

  if (questions.length < 5) {
    throw new Error(
      "AI generated too few questions. At least 5 are required."
    );
  }

  return {
    learningSections,

    quickRecap,

    novaIntro:
      cleanText(raw.novaIntro) ||
      "Hey Explorer! Let's turn this topic into an adventure.",

    novaMission:
      cleanText(raw.novaMission) ||
      "Learn the concept, complete the challenge, and prove your mastery.",

    gameType,

    questions,
  };
};

const buildPrompt = ({
  subject,
  goal,
  unitTitle,
  topicTitle,
  topicDescription,
  syllabusText,
}) => `
You are NOVA's educational content engine inside Cognix.

Create ONE complete learning experience for the specified syllabus topic.

SUBJECT:
${subject}

STUDENT GOAL:
${goal || "Not specified"}

UNIT:
${unitTitle}

TOPIC:
${topicTitle}

TOPIC DESCRIPTION:
${topicDescription || "Not specified"}

SOURCE SYLLABUS:
${syllabusText}

STRICT CONTENT RULES:

1. The uploaded syllabus is the primary source.
2. Use ONLY information supported by the syllabus and the specified topic.
3. Do not invent unrelated curriculum content.
4. Do not introduce another subject.
5. Preserve syllabus terminology where appropriate.
6. Learning explanations must be concise and student-friendly.
7. Questions must test the specified topic.
8. Questions must not be generic filler.
9. Questions must not be repeated inside this generated set.
10. Every question must have a clearly determinable answer.
11. Do not reveal the answer in the prompt.
12. Mix question types.
13. Use mcq, true_false, fill_blank and multi_select when appropriate.
14. At least three different question types should be used when the topic permits.
15. Generate 8 questions.
16. Difficulty must range from 1 to 5.
17. Keep explanations short.
18. gameType must be one of:
    treasure_quest
    rapid_fire
    bridge_builder
    memory_run
19. Nova must be friendly, encouraging and concise.
20. Return ONLY JSON.
21. No markdown.
22. No code fences.

OUTPUT:

{
  "learningSections": [
    {
      "heading": "Concept heading",
      "body": "Short explanation",
      "bullets": ["Key point", "Key point"]
    }
  ],
  "quickRecap": [
    "Important point",
    "Important point"
  ],
  "novaIntro": "Short Nova introduction",
  "novaMission": "Short mission statement",
  "gameType": "treasure_quest",
  "questions": [
    {
      "questionId": "q1",
      "type": "mcq",
      "prompt": "Question",
      "options": [
        {"id": "A", "text": "Option"},
        {"id": "B", "text": "Option"},
        {"id": "C", "text": "Option"},
        {"id": "D", "text": "Option"}
      ],
      "correctAnswer": "A",
      "explanation": "Why this is correct",
      "difficulty": 2,
      "points": 10
    }
  ]
}
`;

const callOpenRouter = async ({
  subject,
  goal,
  unitTitle,
  topicTitle,
  topicDescription,
  syllabusText,
}) => {
  const apiKey =
    process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured."
    );
  }

  const response = await fetch(
    `${OPENROUTER_BASE_URL}/chat/completions`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization:
          `Bearer ${apiKey}`,

        "HTTP-Referer":
          process.env.OPENROUTER_SITE_URL ||
          "http://localhost:5173",

        "X-Title":
          process.env.OPENROUTER_APP_NAME ||
          "Cognix",
      },

      body: JSON.stringify({
        model: DEFAULT_MODEL,

        temperature: 0.25,

        max_tokens: 6000,

        messages: [
          {
            role: "system",
            content:
              "You are a precise educational content engine. Return JSON only.",
          },

          {
            role: "user",

            content: buildPrompt({
              subject,
              goal,
              unitTitle,
              topicTitle,
              topicDescription,
              syllabusText,
            }),
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `OpenRouter request failed (${response.status}): ${errorText.substring(
        0,
        700
      )}`
    );
  }

  const data =
    await response.json();

  const messageContent =
    data?.choices?.[0]?.message?.content;

  const content =
    Array.isArray(messageContent)
      ? messageContent
          .map((item) =>
            typeof item === "string"
              ? item
              : item?.text || ""
          )
          .join("")
      : messageContent;

  if (!content) {
    throw new Error(
      "OpenRouter returned no topic content."
    );
  }

  return content;
};

const findTopic = (
  world,
  topicId
) => {
  for (const unit of world.units || []) {
    const topic = (unit.topics || []).find(
      (item) =>
        String(item._id) ===
        String(topicId)
    );

    if (topic) {
      return {
        unit,
        topic,
      };
    }
  }

  return null;
};

const generateTopicExperience = async ({
  userId,
  world,
  topicId,
}) => {
  const topicInfo =
    findTopic(world, topicId);

  if (!topicInfo) {
    throw new Error(
      "Topic does not belong to this Learning World."
    );
  }

  const {
    unit,
    topic,
  } = topicInfo;

  const existing =
    await TopicLearningContent.findOne({
      userId,
      worldId: world._id,
      topicId: topic._id,
    });

  if (
    existing &&
    existing.questions?.length >= 5
  ) {
    return existing;
  }

  const learningSpace =
    await LearningSpace.findOne({
      _id: world.learningSpaceId,
      userId,
    });

  if (!learningSpace) {
    throw new Error(
      "Learning Space not found."
    );
  }

  const parsed =
    await extractSyllabusText(
      learningSpace.syllabus.path
    );

  const aiResponse =
    await callOpenRouter({
      subject: learningSpace.subject,
      goal: learningSpace.goal,
      unitTitle: unit.title,
      topicTitle: topic.title,
      topicDescription:
        topic.description,
      syllabusText: parsed.text,
    });

  const raw =
    parseJson(aiResponse);

  const normalized =
    normalizeContent(raw);

  const content =
    await TopicLearningContent.findOneAndUpdate(
      {
        userId,
        worldId: world._id,
        topicId: topic._id,
      },
      {
        $set: {
          learningSpaceId:
            learningSpace._id,

          topicTitle:
            topic.title,

          ...normalized,

          generatedAt:
            new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

  return content;
};

module.exports = {
  generateTopicExperience,
  findTopic,
};
