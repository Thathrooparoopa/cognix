const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDirectory = path.join(
  __dirname,
  "..",
  "uploads",
  "learning-spaces"
);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();

    const uniqueName =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}-${baseName}${extension}`;

    cb(null, uniqueName);
  },
});

const allowedExtensions = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
];

const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const fileFilter = (req, file, cb) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const extensionAllowed =
    allowedExtensions.includes(extension);

  const mimeAllowed =
    allowedMimeTypes.includes(file.mimetype);

  if (extensionAllowed && mimeAllowed) {
    cb(null, true);
    return;
  }

  cb(
    new Error(
      "Only PDF, DOC, DOCX and TXT files are allowed."
    )
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 2,
  },
});

module.exports = upload;
