const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const ALLOWED_AVATARS = [
  "explorer",
  "inventor",
  "gamer",
  "artist",
  "scientist",
];

const createToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const setAuthCookie = (res, token) => {
  res.cookie("cognix_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite:
      process.env.NODE_ENV === "production"
        ? "none"
        : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  xp: user.xp,
  level: user.level,
  streak: user.streak,
  createdAt: user.createdAt,
});

const register = async (req, res) => {
  try {
    const name =
      typeof req.body.name === "string"
        ? req.body.name.trim()
        : "";

    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body.password === "string"
        ? req.body.password
        : "";

    const avatar =
      typeof req.body.avatar === "string"
        ? req.body.avatar
        : "explorer";

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must contain at least 2 characters.",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters.",
      });
    }

    if (!ALLOWED_AVATARS.includes(avatar)) {
      return res.status(400).json({
        success: false,
        message: "Invalid avatar selection.",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      avatar,
    });

    const token = createToken(user._id.toString());

    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create the account.",
    });
  }
};

const login = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body.password === "string"
        ? req.body.password
        : "";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email }).select(
      "+password"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = createToken(user._id.toString());

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login.",
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your account.",
    });
  }
};

const updateAvatar = async (req, res) => {
  try {
    const avatar =
      typeof req.body.avatar === "string"
        ? req.body.avatar
        : "";

    if (!ALLOWED_AVATARS.includes(avatar)) {
      return res.status(400).json({
        success: false,
        message: "Invalid avatar selection.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        avatar,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Avatar updated successfully.",
      data: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Update avatar error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update avatar.",
    });
  }
};

const logout = async (req, res) => {
  res.clearCookie("cognix_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite:
      process.env.NODE_ENV === "production"
        ? "none"
        : "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};

module.exports = {
  register,
  login,
  getMe,
  updateAvatar,
  logout,
};
