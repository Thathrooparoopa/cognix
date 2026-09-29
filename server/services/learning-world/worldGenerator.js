const DEFAULT_MODEL =
  process.env.AI_MODEL_PRIMARY ||
  "google/gemini-2.5-flash";

const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL ||
  "https://openrouter.ai/api/v1";

const MAX_OUTPUT_TOKENS = 6000;

const extractJsonObject = (text) => {
  if (!text) {
    throw new Error("AI returned an empty response.");
  }

  let cleaned = String(text).trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {}

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (
    firstBrace === -1 ||
    lastBrace === -1 ||
    lastBrace <= firstBrace
  ) {
    throw new Error("AI response did not contain valid JSON.");
  }

  const possibleJson = cleaned.substring(
    firstBrace,
    lastBrace + 1
  );

  try {
    return JSON.parse(possibleJson);
  } catch (error) {
    throw new Error(
      `AI returned malformed JSON: ${error.message}`
    );
  }
};

const normalizeXp = (value) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 50;
  }

  return Math.min(
    500,
    Math.max(10, Math.round(parsed))
  );
};

const normalizeWorld = (rawWorld) => {
  if (!rawWorld || typeof rawWorld !== "object") {
    throw new Error("AI returned an invalid world structure.");
  }

  if (!Array.isArray(rawWorld.units)) {
    throw new Error(
      "AI response does not contain a valid units array."
    );
  }

  const units = rawWorld.units
    .map((unit, unitIndex) => {
      const unitTitle = String(unit?.title || "").trim();

      if (!unitTitle) {
        return null;
      }

      const topics = Array.isArray(unit.topics)
        ? unit.topics
        : [];

      const normalizedTopics = topics
        .map((topic, topicIndex) => {
          const title = String(topic?.title || "").trim();

          if (!title) {
            return null;
          }

          return {
            title,
            description: String(
              topic?.description || ""
            ).trim(),
            order: topicIndex + 1,
            status: "locked",
            xpReward: normalizeXp(topic?.xpReward),
          };
        })
        .filter(Boolean);

      if (normalizedTopics.length === 0) {
        return null;
      }

      return {
        title: unitTitle,
        description: String(
          unit?.description || ""
        ).trim(),
        order: unitIndex + 1,
        topics: normalizedTopics,
      };
    })
    .filter(Boolean);

  if (units.length === 0) {
    throw new Error(
      "AI did not generate any valid learning units."
    );
  }

  // First topic is the only initially unlocked topic.
  units[0].topics[0].status = "unlocked";

  for (
    let unitIndex = 0;
    unitIndex < units.length;
    unitIndex += 1
  ) {
    for (
      let topicIndex = 0;
      topicIndex < units[unitIndex].topics.length;
      topicIndex += 1
    ) {
      if (unitIndex !== 0 || topicIndex !== 0) {
        units[unitIndex].topics[topicIndex].status =
          "locked";
      }
    }
  }

  return {
    description: String(
      rawWorld.description || ""
    ).trim(),
    units,
  };
};

const buildPrompt = ({
  subject,
  goal,
  syllabusText,
}) => {
  return `
You are the curriculum-structuring engine for Cognix,
an adaptive gamified learning platform.

Your task is to analyze the student's uploaded syllabus
and convert ONLY the syllabus-supported curriculum into
a structured learning world.

SUBJECT:
${subject}

STUDENT GOAL:
${goal || "Not specified"}

IMPORTANT RULES:

1. Use the uploaded syllabus as the primary source.
2. Do NOT invent unrelated subjects, units, or topics.
3. Preserve the syllabus terminology wherever possible.
4. Organize the curriculum into logical units and topics.
5. Do not turn every sentence into a topic.
6. Do not create duplicate topics.
7. Keep the original learning order when it is clear.
8. A topic should represent a meaningful learning concept.
9. Topic descriptions should be short and useful.
10. Do not generate quiz questions yet.
11. Do not generate game mechanics yet.
12. Do not claim that content exists if it is not supported
    by the syllabus.
13. Return ONLY valid JSON.
14. Do not use markdown.
15. Do not wrap the JSON in code fences.
16. Keep the response concise.
17. Generate only meaningful curriculum structure.

OUTPUT FORMAT:

{
  "description": "Short description of this learning world",
  "units": [
    {
      "title": "Unit title",
      "description": "Short unit description",
      "topics": [
        {
          "title": "Topic title",
          "description": "Short topic description",
          "xpReward": 50
        }
      ]
    }
  ]
}

QUALITY REQUIREMENTS:

- Generate all meaningful units supported by the syllabus.
- Include meaningful topics within each unit.
- Avoid duplicate or nearly duplicate topic names.
- Keep topic names concise.
- Keep descriptions concise.
- Do not add topics based on general knowledge.
- Do not generate unnecessary explanations outside the JSON.

UPLOADED SYLLABUS:

${syllabusText}
`;
};

const callOpenRouter = async ({
  subject,
  goal,
  syllabusText,
}) => {
  const apiKey = process.env.OPENROUTER_API_KEY;

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
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer":
          process.env.OPENROUTER_SITE_URL ||
          "http://localhost:5173",
        "X-Title":
          process.env.OPENROUTER_APP_NAME ||
          "Cognix",
      },

      body: JSON.stringify({
        model: DEFAULT_MODEL,

        temperature: 0.2,

        // Important:
        // Prevent OpenRouter from requesting the model's
        // huge maximum output of 65,535 tokens.
        max_tokens: MAX_OUTPUT_TOKENS,

        messages: [
          {
            role: "system",
            content:
              "You are a precise curriculum structuring engine. Return valid JSON only.",
          },
          {
            role: "user",
            content: buildPrompt({
              subject,
              goal,
              syllabusText,
            }),
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `OpenRouter request failed (${response.status}): ${errorText.substring(
        0,
        1000
      )}`
    );
  }

  const data = await response.json();

  const content =
    data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error(
      "OpenRouter returned no model content."
    );
  }

  return content;
};

const generateLearningWorld = async ({
  subject,
  goal,
  syllabusText,
}) => {
  const aiResponse = await callOpenRouter({
    subject,
    goal,
    syllabusText,
  });

  const rawWorld = extractJsonObject(aiResponse);

  return normalizeWorld(rawWorld);
};

module.exports = {
  generateLearningWorld,
};
