const fs = require("fs/promises");
const path = require("path");

const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

/*
|--------------------------------------------------------------------------
| Supported syllabus formats
|--------------------------------------------------------------------------
*/

const SUPPORTED_EXTENSIONS = [
  ".pdf",
  ".docx",
];

/*
|--------------------------------------------------------------------------
| Resolve stored upload path
|--------------------------------------------------------------------------
|
| LearningSpace stores the uploaded file path.
|
| Depending on how the upload middleware was configured,
| the path may be:
|
|   server/uploads/...
|   uploads/...
|   C:\...\server\uploads\...
|
| This helper tries the common possibilities.
|--------------------------------------------------------------------------
*/

const resolveFilePath = (storedPath) => {
  if (!storedPath) {
    throw new Error("Syllabus file path is missing.");
  }

  const normalizedPath = String(
    storedPath
  ).replace(/\\/g, "/");

  const candidates = [];

  /*
   * Absolute path.
   */
  if (path.isAbsolute(storedPath)) {
    candidates.push(
      storedPath
    );
  }

  /*
   * Path exactly as stored,
   * relative to the server directory.
   */
  candidates.push(
    path.resolve(
      __dirname,
      "../../",
      storedPath
    )
  );

  /*
   * Relative to project/server.
   */
  candidates.push(
    path.resolve(
      process.cwd(),
      storedPath
    )
  );

  /*
   * If the stored path contains
   * "server/uploads/...", remove
   * the "server/" prefix.
   */
  if (
    normalizedPath.startsWith(
      "server/"
    )
  ) {
    candidates.push(
      path.resolve(
        process.cwd(),
        normalizedPath.substring(
          "server/".length
        )
      )
    );
  }

  /*
   * If only an uploads path was stored.
   */
  if (
    normalizedPath.startsWith(
      "uploads/"
    )
  ) {
    candidates.push(
      path.resolve(
        process.cwd(),
        normalizedPath
      )
    );

    candidates.push(
      path.resolve(
        process.cwd(),
        "server",
        normalizedPath
      )
    );
  }

  for (const candidate of candidates) {
    try {
      /*
       * This is intentionally synchronous.
       * We only use it to locate the file.
       */
      require("fs").accessSync(candidate);

      return candidate;
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error(
    `Syllabus file could not be found. Stored path: ${storedPath}`
  );
};

/*
|--------------------------------------------------------------------------
| Clean extracted text
|--------------------------------------------------------------------------
*/

const cleanText = (text) => {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

/*
|--------------------------------------------------------------------------
| Extract PDF text
|--------------------------------------------------------------------------
*/

const extractPdfText = async (filePath) => {
  const buffer = await fs.readFile(
    filePath
  );

  const result = await pdfParse(
    buffer
  );

  return cleanText(
    result.text
  );
};

/*
|--------------------------------------------------------------------------
| Extract DOCX text
|--------------------------------------------------------------------------
*/

const extractDocxText = async (
  filePath
) => {
  const result =
    await mammoth.extractRawText({
      path: filePath,
    });

  return cleanText(
    result.value
  );
};

/*
|--------------------------------------------------------------------------
| Main syllabus parser
|--------------------------------------------------------------------------
*/

const extractSyllabusText = async (
  storedPath
) => {
  const filePath =
    resolveFilePath(
      storedPath
    );

  const extension =
    path
      .extname(filePath)
      .toLowerCase();

  if (
    !SUPPORTED_EXTENSIONS.includes(
      extension
    )
  ) {
    throw new Error(
      `Unsupported syllabus format: ${extension}. Supported formats are PDF and DOCX.`
    );
  }

  let text = "";

  if (extension === ".pdf") {
    text =
      await extractPdfText(
        filePath
      );
  }

  if (extension === ".docx") {
    text =
      await extractDocxText(
        filePath
      );
  }

  if (!text || text.length < 30) {
    throw new Error(
      "The syllabus text could not be extracted or is too short to analyze."
    );
  }

  /*
   * Prevent extremely large prompts.
   *
   * We preserve a generous amount of syllabus
   * content while protecting the AI request.
   */
  const MAX_SYLLABUS_CHARACTERS =
    60000;

  if (
    text.length >
    MAX_SYLLABUS_CHARACTERS
  ) {
    text =
      text.substring(
        0,
        MAX_SYLLABUS_CHARACTERS
      );
  }

  return {
    filePath,
    extension,
    text,
    characterCount:
      text.length,
  };
};

module.exports = {
  extractSyllabusText,
};