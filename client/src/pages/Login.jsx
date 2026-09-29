import { useEffect, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import Avatar3D from "../components/avatar/Avatar3D";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [mouse, setMouse] = useState({
    x: 0,
    y: 0,
  });

  const [lightning, setLightning] = useState(false);

  useEffect(() => {
    const handleMouseMove = (event) => {
      const x =
        (event.clientX / window.innerWidth - 0.5) * 2;

      const y =
        (event.clientY / window.innerHeight - 0.5) * 2;

      setMouse({ x, y });
    };

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    return () => {
      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );
    };
  }, []);

  useEffect(() => {
    const createLightning = () => {
      setLightning(true);

      window.setTimeout(() => {
        setLightning(false);
      }, 180);
    };

    const scheduleLightning = () => {
      const delay =
        4200 + Math.random() * 5200;

      return window.setTimeout(() => {
        createLightning();
        timer = scheduleLightning();
      }, delay);
    };

    let timer = scheduleLightning();

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage(
        "Please enter your email."
      );
      return;
    }

    if (!password) {
      setErrorMessage(
        "Please enter your password."
      );
      return;
    }

    try {
      setLoggingIn(true);

      await login({
        email: email.trim(),
        password,
      });

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Unable to login to Cognix."
      );
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <main
      className={`storm-login ${
        lightning ? "storm-lightning" : ""
      }`}
    >
      <div
        className="storm-layer storm-sky"
        style={{
          transform: `translate3d(
            ${mouse.x * -10}px,
            ${mouse.y * -6}px,
            0
          )`,
        }}
      />

      <div
        className="storm-layer storm-clouds storm-clouds-back"
        style={{
          transform: `translate3d(
            ${mouse.x * -22}px,
            ${mouse.y * -10}px,
            0
          )`,
        }}
      />

      <div
        className="storm-layer storm-clouds storm-clouds-front"
        style={{
          transform: `translate3d(
            ${mouse.x * -38}px,
            ${mouse.y * -18}px,
            0
          )`,
        }}
      />

      <div className="storm-rain rain-one" />
      <div className="storm-rain rain-two" />
      <div className="storm-rain rain-three" />

      <div
        className="storm-lightning-bolt"
        aria-hidden="true"
      >
        <span />
        <span />
        <span />
      </div>

      <div
        className="storm-glow"
        style={{
          transform: `translate3d(
            ${mouse.x * 18}px,
            ${mouse.y * 10}px,
            0
          )`,
        }}
      />

      <section className="storm-login-content">
        <div
          className="storm-intro"
          style={{
            transform: `translate3d(
              ${mouse.x * 7}px,
              ${mouse.y * 5}px,
              0
            )`,
          }}
        >
          <div className="storm-badge">
            <Zap size={14} />
            WELCOME BACK, EXPLORER
          </div>

          <h1>
            Your adventure
            <span>continues.</span>
          </h1>

          <p>
            The storm is only the beginning.
            Step back into your learning worlds,
            continue your quests and keep leveling up.
          </p>

          <div className="storm-avatar">
            <div className="storm-avatar-ring ring-one" />
            <div className="storm-avatar-ring ring-two" />

            <div className="storm-avatar-glow" />

            <Avatar3D
              type="explorer"
              scale={1}
              state="idle"
            />
          </div>

          <div className="storm-hint">
            <Sparkles size={14} />
            <span>
              Move your cursor around the storm
            </span>
          </div>
        </div>

        <section
          className="storm-login-card"
          style={{
            transform: `translate3d(
              ${mouse.x * -4}px,
              ${mouse.y * -3}px,
              0
            )`,
          }}
        >
          <div className="storm-card-shine" />

          <div className="storm-card-header">
            <span className="section-kicker">
              COGNIX LOGIN
            </span>

            <h2>Welcome back</h2>

            <p>
              Sign in and continue your learning
              adventure.
            </p>
          </div>

          <form
            className="storm-login-form"
            onSubmit={handleSubmit}
          >
            <label>
              <span>Email address</span>

              <div className="storm-input">
                <Mail size={17} />

                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loggingIn}
                />
              </div>
            </label>

            <label>
              <span>Password</span>

              <div className="storm-input">
                <LockKeyhole size={17} />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loggingIn}
                />

                <button
                  type="button"
                  className="storm-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </label>

            {errorMessage && (
              <div className="storm-error">
                <Zap size={15} />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="storm-submit"
              disabled={loggingIn}
            >
              <span>
                {loggingIn
                  ? "Entering Cognix..."
                  : "Continue to Cognix"}
              </span>

              {!loggingIn && (
                <ArrowRight size={18} />
              )}
            </button>
          </form>

          <div className="storm-divider">
            <span />
            <small>OR</small>
            <span />
          </div>

          <div className="storm-footer">
            <span>New to Cognix?</span>

            <Link to="/register">
              Create your account
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
