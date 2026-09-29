import { useState } from "react";
import { ArrowRight, Pencil, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Avatar3D from "../components/avatar/Avatar3D";
import { avatars, saveAvatar } from "../data/avatars";

export default function Profile({ avatar, onAvatarChange }) {
  const [selected, setSelected] = useState(avatar || "explorer");

  const current =
    avatars.find((item) => item.id === selected) || avatars[0];

  const handleSave = () => {
    saveAvatar(selected);
    onAvatarChange(selected);
  };

  return (
    <main className="page-container">
      <div className="page-heading">
        <div>
          <span className="section-kicker">YOUR IDENTITY</span>
          <h1>My Profile</h1>
          <p>Your Cognix avatar and learning identity.</p>
        </div>

        <Link to="/avatar" className="secondary-button">
          <Pencil size={16} />
          Customize Avatar
        </Link>
      </div>

      <section className="profile-card">
        <div className="profile-avatar-stage">
          <Avatar3D
            type={selected}
            scale={1.15}
            interactive
          />
        </div>

        <div className="profile-info">
          <span className="section-kicker">YOUR AVATAR</span>

          <h2>{current.name}</h2>

          <p>{current.description}</p>

          <div className="profile-stats">
            <div>
              <span>LEVEL</span>
              <strong>1</strong>
            </div>

            <div>
              <span>XP</span>
              <strong>0</strong>
            </div>

            <div>
              <span>WORLDS</span>
              <strong>0</strong>
            </div>
          </div>

          <button onClick={handleSave} className="primary-button">
            Save Avatar
            <Sparkles size={16} />
          </button>
        </div>
      </section>

      <section className="profile-tip">
        <span>?</span>
        Your avatar will react to learning events as Cognix grows.
        Later we'll add happy, thinking, confused, success and level-up states.
      </section>
    </main>
  );
}
