import { UserPlus, Users } from "lucide-react";

export default function Friends() {
  return (
    <main className="page-container">
      <div className="page-heading">
        <div>
          <span className="section-kicker">LEARN TOGETHER</span>
          <h1>Friends</h1>
          <p>Connect with other Cognix learners.</p>
        </div>

        <button className="primary-button">
          <UserPlus size={17} />
          Find Friends
        </button>
      </div>

      <section className="empty-state">
        <div className="empty-state-icon friends">
          <Users size={34} />
        </div>

        <h2>Your community starts here.</h2>

        <p>
          You haven't added any friends yet. Social learning features will
          appear here as your Cognix journey grows.
        </p>
      </section>
    </main>
  );
}
