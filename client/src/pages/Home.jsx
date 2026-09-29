import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Flame,
  Gamepad2,
  Lock,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import Avatar3D from "../components/avatar/Avatar3D";
import { getStoredAvatar } from "../data/avatars";

const stats = [
  {
    label: "XP",
    value: "0",
    description: "Start your adventure",
    icon: Zap,
  },
  {
    label: "STREAK",
    value: "0",
    description: "Build your streak",
    icon: Flame,
  },
  {
    label: "LEVELS",
    value: "0",
    description: "Complete your first quest",
    icon: Gamepad2,
  },
  {
    label: "ACHIEVEMENTS",
    value: "0",
    description: "Earn your first badge",
    icon: Trophy,
  },
];

const roadmap = [
  {
    title: "Create Space",
    description: "Choose your subject",
    unlocked: true,
  },
  {
    title: "Build World",
    description: "Add your syllabus",
    unlocked: false,
  },
  {
    title: "First Quest",
    description: "Begin learning",
    unlocked: false,
  },
  {
    title: "Mastery",
    description: "Level up your skills",
    unlocked: false,
  },
];

export default function Home() {
  const avatar = getStoredAvatar() || "explorer";

  return (
    <main className="dashboard">

      {/* HERO */}
      <motion.section
        className="hero-section"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="hero-copy">

          <div className="hero-badge">
            <Sparkles size={14} />
            Your learning adventure starts here
          </div>

          <h1>
            Learn.
            <br />
            Play.
            <br />
            <span>Level Up.</span>
          </h1>

          <p>
            Cognix turns your learning journey into an interactive adventure
            where every concept becomes a quest.
          </p>

          <div className="hero-actions">
            <Link
              to="/learning-space"
              className="primary-button"
            >
              Create Learning Space
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/avatar"
              className="secondary-button"
            >
              Customize Avatar
            </Link>
          </div>
        </div>

        {/* REAL 3D CHARACTER */}
        <div className="hero-character">
          <div className="character-glow" />

          <div className="hero-avatar">
            <Avatar3D
              type={avatar}
              scale={1}
              state="idle"
            />
          </div>
        </div>
      </motion.section>

      {/* STATS */}
      <section className="stats-row">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <motion.div
              key={stat.label}
              className="stat-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.08 * index,
              }}
            >
              <div className="stat-icon plain">
                <Icon size={19} />
              </div>

              <div className="stat-content">
                <strong>{stat.value}</strong>
                <small>{stat.label}</small>
                <span>{stat.description}</span>
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* MAIN CONTENT */}
      <section className="content-grid">

        {/* LEFT COLUMN */}
        <div>

          {/* WORLDS */}
          <div className="section-heading">
            <div>
              <span>YOUR ADVENTURE</span>
              <h2>Learning Worlds</h2>
            </div>

            <Link to="/worlds">
              View all
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="world-grid">

            <div className="empty-world">
              <div className="empty-world-icon">
                <BookOpen size={28} />
              </div>

              <h2>Your first world awaits</h2>

              <p>
                Create a Learning Space and give Cognix your syllabus.
                Your subject will become an interactive learning world
                with topics, levels, challenges and quests.
              </p>

              <Link
                to="/learning-space"
                className="primary-button"
              >
                Create your first world
                <ArrowRight size={15} />
              </Link>
            </div>

          </div>

          {/* ROADMAP */}
          <div className="roadmap-card">

            <div className="roadmap-header">
              <div>
                <span>YOUR JOURNEY</span>
                <h2>Adventure Roadmap</h2>
              </div>

              <Sparkles size={18} />
            </div>

            <div className="quest-path">
              {roadmap.map((item, index) => (
                <div
                  key={item.title}
                  className="quest-node"
                >
                  <div
                    className={
                      item.unlocked
                        ? "quest-node-circle active"
                        : "quest-node-circle locked"
                    }
                  >
                    {item.unlocked ? (
                      index === 0 ? (
                        <BookOpen size={18} />
                      ) : (
                        <Sparkles size={18} />
                      )
                    ) : (
                      <Lock size={16} />
                    )}
                  </div>

                  <strong>{item.title}</strong>
                  <span>{item.description}</span>

                  {index < roadmap.length - 1 && (
                    <div className="quest-line" />
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN */}
        <aside className="right-column">

          {/* NOVA */}
          <motion.div
            className="nova-card"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="nova-card-header">
              <div className="nova-icon">
                <Sparkles size={18} />
              </div>

              <div>
                <strong>Nova</strong>
                <span>Your learning companion</span>
              </div>
            </div>

            <div className="nova-card-message">
              <span>Nova</span>

              <p>
                Welcome to Cognix! Create your first Learning Space
                and I'll help turn your syllabus into an adventure.
              </p>
            </div>

            <Link
              to="/learning-space"
              className="primary-button"
            >
              Start your adventure
              <ArrowRight size={14} />
            </Link>
          </motion.div>

          {/* QUICK ACTION */}
          <div className="quick-card">
            <div className="stat-icon plain">
              <BookOpen size={18} />
            </div>

            <div>
              <strong>Ready to learn?</strong>
              <span>
                Your personalized journey begins with a subject.
              </span>
            </div>

            <Link to="/learning-space">
              <ArrowRight size={16} />
            </Link>
          </div>

        </aside>
      </section>

      {/* FLOATING NOVA */}
      <Link
        to="/learning-space"
        className="nova-floating"
        aria-label="Start learning"
      >
        <Sparkles size={18} />
        <span>Ask Nova</span>
      </Link>

    </main>
  );
}
