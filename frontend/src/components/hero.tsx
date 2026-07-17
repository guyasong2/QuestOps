import NavBar from "./navBar";

const capabilities = ["Cybersecurity", "Software engineering", "Cloud infrastructure"];

function CapabilityIcon({ label }: { label: string }) {
  if (label === "Cybersecurity") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="10" width="12" height="10" rx="1" /><path d="M9 10V7a3 3 0 0 1 6 0v3" /><circle cx="12" cy="15" r="1" /></svg>;
  }

  if (label === "Software engineering") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" /></svg>;
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18h10a4 4 0 1 0-.8-7.9A5.5 5.5 0 0 0 6 12.5 2.8 2.8 0 0 0 7 18Z" /></svg>;
}

export default function Hero() {
  return (
    <main className="landing-page">
      <NavBar />

      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-content">
          <h1 className="hero-title" id="hero-title">
            Real breaches,<br />
            <span className="accent">real bugs,</span> real<br />
            skills
          </h1>

          <p className="hero-description">
            An AI-powered escape room where challenges are real incidents:<br />
            cybersecurity, software engineering, cloud.
          </p>

          <button className="session-button focusable" type="button">
            Initialize session
          </button>
        </div>

        <div className="capabilities" aria-label="QuestOps challenge areas">
          {capabilities.map((label) => (
            <div className="capability" key={label}>
              <span className="capability-icon"><CapabilityIcon label={label} /></span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
