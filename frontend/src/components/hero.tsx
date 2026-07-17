import { useNavigate } from 'react-router-dom';
import NavBar from "../components/navBar";

const capabilities = ["Cybersecurity", "Software engineering", "Cloud infrastructure"];
const workflowSteps = [
  ["01", "Select your scenario", "Choose from a library of historical breaches and software disasters recreated in isolated environments."],
  ["02", "Access virtual terminal", "Spin up a non-privileged infrastructure with the exact same tools and constraints as a real responder."],
  ["03", "Identify and remediate", "Hunt for the bug, patch the vulnerability, and restore system health before the AI clock runs out."],
  ["04", "Post-mortem & rank", "Receive a detailed analysis of your solution path and compare your speed, efficiency against global experts."],
];

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
  const navigate = useNavigate();

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

          <button
            className="session-button focusable"
            type="button"
            onClick={() => navigate('/onboarding')}
          >
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

      <section className="how-it-works" aria-labelledby="how-it-works-title">
        <div className="workflow-intro">
          <h2 id="how-it-works-title">How it works</h2>
          <p>Systemic progression through virtualized failure states. No simulations. Just real containers, real bugs, and real terminal access.</p>
          <div className="terminal-snippet" aria-label="Terminal status preview">
            <span>&gt; Loading manifest...</span>
            <span>&gt; Ready for injection.</span>
            <span>&gt; Ready for dispatch.</span>
          </div>
        </div>

        <ol className="workflow-steps">
          {workflowSteps.map(([number, title, description]) => (
            <li key={number}>
              <span className="step-number">{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="proficiency-banner" aria-label="Terminal proficiency">
        <div className="terminal-lines" aria-hidden="true">
          <span>SYSTEM STATUS</span><span>ALL SYSTEMS OPERATIONAL</span><span>MEMORY LATENCY: 12ms</span><span>SECURITY PROTOCOL: ACTIVE</span>
        </div>
        <h2>Terminal<br />proficiency is<br />mandatory</h2>
        <div className="terminal-lines terminal-lines-right" aria-hidden="true">
          <span>ATTEMPT DETECTED: UNAUTHORIZED ACCESS</span><span>TRACER LOGIC: TRACKING...</span><span>ACCESS LEVEL: ROOT</span><span>DEPLOYMENT PIPELINE</span>
        </div>
      </section>

      <footer className="site-footer">
        <div>
          <strong>QuestOps</strong>
          <p>© 2026 QuestOps Inc. Terminal access only.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="/documentation">Documentation</a>
          <a href="/status">System status: <span>online</span></a>
          <a href="/security">Security policy</a>
          <a href="/contact">Contact command</a>
        </nav>
        <div className="footer-meta"><span>Uptime: 11.999%</span><span>Latency: 1.02ms</span><span>Version: 12.6.47-stable</span></div>
      </footer>
    </main>
  );
}
