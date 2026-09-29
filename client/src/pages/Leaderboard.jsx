import { Trophy } from "lucide-react";

export default function Leaderboard() {
  return (
    <main className="page-container">
      <div className="page-heading">
        <div>
          <span className="section-kicker">COMPETE & GROW</span>
          <h1>Leaderboard</h1>
          <p>Complete challenges to earn your place here.</p>
        </div>
      </div>

      <section className="empty-state">
        <div className="empty-state-icon trophy">
          <Trophy size={34} />
        </div>

        <h2>No rankings yet.</h2>

        <p>
          Complete your first learning challenge and your progress can
          become part of the Cognix leaderboard.
        </p>
      </section>
    </main>
  );
}
