import { useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import Avatar3D from "../components/avatar/Avatar3D";
import { avatars } from "../data/avatars";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("explorer");

  const [showPassword, setShowPassword] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setErrorMessage("Please enter your name.");
      return;
    }

    if (trimmedName.length < 2) {
      setErrorMessage("Your name must contain at least 2 characters.");
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please create a password.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must contain at least 8 characters.");
      return;
    }

    if (!selectedAvatar) {
      setErrorMessage("Please choose an avatar.");
      return;
    }

    try {
      setRegistering(true);

      await register({
        name: trimmedName,
        email: trimmedEmail,
        password,
        avatar: selectedAvatar,
      });

      navigate("/");
    } catch (error) {
      setErrorMessage(
        error?.message ||
          "Registration failed. Please check your details and try again."
      );
    } finally {
      setRegistering(false);
    }
  };

  return (
    <main className="auth-page register-page">
      <div className="auth-background auth-background-one" />
      <div className="auth-background auth-background-two" />

      <section className="register-layout">
        <div className="register-intro">
          <div className="auth-badge">
            <Sparkles size={15} />
            START YOUR COGNIX ADVENTURE
          </div>

          <h1>
            Create your
            <span> learning identity.</span>
          </h1>

          <p>
            Choose your companion, create your account and start building your
            own learning adventure.
          </p>

          <div className="register-preview">
            <div className="register-preview-avatar">
              <Avatar3D
                type={selectedAvatar}
                scale={0.95}
                state="idle"
              />
            </div>

            <div>
              <span className="preview-label">YOUR COMPANION</span>
              <strong>
                {
                  avatars.find(
                    (avatar) => avatar.id === selectedAvatar
                  )?.name
                }
              </strong>
              <small>
                Your avatar will travel through your Cognix worlds.
              </small>
            </div>
          </div>
        </div>

        <div className="auth-card register-card">
          <div className="auth-card-header">
            <div className="auth-card-icon">
              <UserRound size={21} />
            </div>

            <div>
              <span className="section-kicker">NEW EXPLORER</span>
              <h2>Create account</h2>
            </div>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <label className="auth-field">
              <span>Your name</span>

              <div className="auth-input-wrap">
                <UserRound size={18} />

                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  disabled={registering}
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Email address</span>

              <div className="auth-input-wrap">
                <Mail size={18} />

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  disabled={registering}
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Password</span>

              <div className="auth-input-wrap">
                <LockKeyhole size={18} />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  disabled={registering}
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
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

            <div className="avatar-picker">
              <div className="avatar-picker-heading">
                <div>
                  <span>Choose your avatar</span>
                  <small>
                    You can change this later.
                  </small>
                </div>
              </div>

              <div className="avatar-picker-grid">
                {avatars.map((avatar) => {
                  const active =
                    selectedAvatar === avatar.id;

                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      className={`register-avatar-choice ${
                        active ? "selected" : ""
                      }`}
                      onClick={() =>
                        setSelectedAvatar(avatar.id)
                      }
                      disabled={registering}
                    >
                      <div className="register-avatar-model">
                        <Avatar3D
                          type={avatar.id}
                          scale={0.48}
                          state={active ? "happy" : "idle"}
                        />
                      </div>

                      <span>{avatar.name}</span>

                      {active && (
                        <div className="register-avatar-check">
                          <Check size={12} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMessage && (
              <div className="auth-error" role="alert">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={registering}
            >
              {registering ? (
                <>
                  <span className="auth-spinner" />
                  Creating your account...
                </>
              ) : (
                <>
                  Create my Cognix account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>ALREADY HAVE AN ACCOUNT?</span>
          </div>

          <Link
            to="/login"
            className="auth-secondary-button"
          >
            Sign in to Cognix
          </Link>
        </div>
      </section>
    </main>
  );
}
