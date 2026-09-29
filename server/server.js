require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const connectDatabase = require("./config/db");

const healthRoutes = require("./routes/healthRoutes");
const aiRoutes = require("./routes/aiRoutes");
const learningSpaceRoutes = require("./routes/learningSpaceRoutes");
const learningWorldRoutes = require("./routes/learningWorldRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

const CLIENT_URL =
  process.env.CLIENT_URL ||
  "http://localhost:5173";

/*
|--------------------------------------------------------------------------
| Global Middleware
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(
  helmet()
);

app.use(
  morgan("dev")
);

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

app.use(
  cookieParser()
);

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

app.use(
  "/health",
  healthRoutes
);

app.use(
  "/api/ai",
  aiRoutes
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/learning-spaces",
  learningSpaceRoutes
);

app.use(
  "/api/learning-worlds",
  learningWorldRoutes
);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
    path: req.originalUrl,
  });
});

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);

  res.status(
    error.status || 500
  ).json({
    success: false,
    message:
      error.message ||
      "Internal server error.",
  });
});

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(
      PORT,
      () => {
        console.log(
          `🚀 Cognix Gateway API running on http://localhost:${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "❌ Failed to start Cognix Gateway API:",
      error
    );

    process.exit(1);
  }
};

startServer();