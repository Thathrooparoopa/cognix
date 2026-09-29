import { useState } from "react";

import {
  Bell,
  BookOpen,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import HomePage from "./pages/Home";
import Worlds from "./pages/Worlds";
import LearningWorld from "./pages/LearningWorld";
import LearningSpace from "./pages/LearningSpace";
import Leaderboard from "./pages/Leaderboard";
import Friends from "./pages/Friends";
import Profile from "./pages/Profile";
import AvatarSelection from "./pages/AvatarSelection";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Avatar3D from "./components/avatar/Avatar3D";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

const navItems = [
  {
    label: "Home",
    path: "/",
    icon: Home,
  },
  {
    label: "My Worlds",
    path: "/worlds",
    icon: BookOpen,
  },
  {
    label: "Learning Space",
    path: "/learning-space",
    icon: GraduationCap,
  },
  {
    label: "Leaderboard",
    path: "/leaderboard",
    icon: Trophy,
  },
  {
    label: "Friends",
    path: "/friends",
    icon: Users,
  },
];

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/register"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <Register />
          )
        }
      />

      <Route
        path="/*"
        element={
          user ? (
            <AppShell />
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      />
    </Routes>
  );
}

function LoadingScreen() {
  return (
    <div className="cognix-app">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <div className="background-orb orb-three" />

      <main className="page-container">
        <div
          style={{
            minHeight: "70vh",
            display: "grid",
            placeItems: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div className="brand-mark">
              <Sparkles
                size={24}
                strokeWidth={2.8}
              />
            </div>

            <p style={{ marginTop: "16px" }}>
              Loading your Cognix adventure...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function AppShell() {
  const {
    user,
    changeAvatar,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const avatar =
    user?.avatar || "explorer";

  const handleAvatarChange =
    async (nextAvatar) => {
      await changeAvatar(nextAvatar);
    };

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      await logout();

      setMobileOpen(false);

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );

      setLoggingOut(false);
    }
  };

  return (
    <div className="cognix-app">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <div className="background-orb orb-three" />

      <header className="topbar">
        <NavLink
          to="/"
          className="brand"
          onClick={() =>
            setMobileOpen(false)
          }
        >
          <div className="brand-mark">
            <Sparkles
              size={21}
              strokeWidth={2.8}
            />
          </div>

          <span>Cognix</span>
        </NavLink>

        <nav className="desktop-nav">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="top-actions">
          <button
            className="icon-button"
            aria-label="Notifications"
          >
            <Bell size={19} />
          </button>

          <NavLink
            to="/profile"
            className="profile-mini"
          >
            <div className="mini-avatar avatar-real">
              <Avatar3D
                type={avatar}
                scale={0.25}
              />
            </div>

            <div className="profile-mini-copy">
              <strong>
                {user?.name || "Explorer"}
              </strong>

              <small>
                Level {user?.level || 1}
              </small>
            </div>
          </NavLink>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Logout"
          >
            <LogOut size={18} />

            <span>
              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </span>
          </button>

          <button
            className="mobile-menu-button"
            onClick={() =>
              setMobileOpen(
                (value) => !value
              )
            }
            aria-label="Toggle navigation"
          >
            {mobileOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-menu"
            initial={{
              opacity: 0,
              y: -12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -12,
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="mobile-nav-item"
                  onClick={() =>
                    setMobileOpen(false)
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}

            <NavLink
              to="/profile"
              className="mobile-nav-item"
              onClick={() =>
                setMobileOpen(false)
              }
            >
              <UserRound size={18} />
              Profile
            </NavLink>

            <NavLink
              to="/avatar"
              className="mobile-nav-item"
              onClick={() =>
                setMobileOpen(false)
              }
            >
              <Sparkles size={18} />
              Customize Avatar
            </NavLink>

            <button
              type="button"
              className="mobile-nav-item"
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                border: "none",
                background: "transparent",
                width: "100%",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <LogOut size={18} />

              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Routes>
        <Route
          path="/"
          element={
            <HomePage avatar={avatar} />
          }
        />

        <Route
          path="/worlds"
          element={<Worlds />}
        />

        {/* PHASE 5 — INDIVIDUAL WORLD */}
        <Route
          path="/worlds/:worldId"
          element={<LearningWorld />}
        />

        <Route
          path="/learning-space"
          element={
            <LearningSpace />
          }
        />

        <Route
          path="/leaderboard"
          element={
            <Leaderboard />
          }
        />

        <Route
          path="/friends"
          element={<Friends />}
        />

        <Route
          path="/profile"
          element={
            <Profile
              avatar={avatar}
              onAvatarChange={
                handleAvatarChange
              }
            />
          }
        />

        <Route
          path="/avatar"
          element={
            <AvatarSelection
              avatar={avatar}
              onAvatarChange={
                handleAvatarChange
              }
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </div>
  );
}

export default App;