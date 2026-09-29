import { useState } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Avatar3D from "../components/avatar/Avatar3D";
import { avatars, saveAvatar } from "../data/avatars";

export default function AvatarSelection({ avatar, onAvatarChange }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(avatar || null);

  const continueWithAvatar = () => {
    if (!selected) return;

    saveAvatar(selected);
    onAvatarChange(selected);
    navigate("/");
  };

  return (
    <main className="avatar-selection-page">
      <section className="avatar-selection-header">
        <div className="selection-badge">
          <Sparkles size={15} />
          YOUR COGNIX IDENTITY
        </div>

        <h1>Choose your companion.</h1>

        <p>
          Pick the character that will travel with you through your learning
          adventure.
        </p>
      </section>

      <section className="avatar-grid">
        {avatars.map((item) => {
          const active = selected === item.id;

          return (
            <button
              key={item.id}
              className={`avatar-choice ${active ? "selected" : ""}`}
              onClick={() => setSelected(item.id)}
            >
              <div className="avatar-choice-canvas">
                <Avatar3D type={item.id} scale={0.78} />
              </div>

              <div className="avatar-choice-info">
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.description}</span>
                </div>

                {active && (
                  <div className="selected-check">
                    <Check size={15} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </section>

      <button
        className="primary-button selection-continue"
        disabled={!selected}
        onClick={continueWithAvatar}
      >
        Continue with this avatar
        <ArrowRight size={18} />
      </button>
    </main>
  );
}
