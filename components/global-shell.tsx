const libraryItems = [
  { name: "Hermeneutics", description: "Learn to read Scripture faithfully", href: "https://hermeneutics.mybibleexplorer.com" },
  { name: "Psalms", description: "Worship, lament, praise, and prayer", href: "https://psalms.mybibleexplorer.com" },
  { name: "Daniel", description: "Prophecy and providence", href: "https://daniel.mybibleexplorer.com" },
  { name: "Revelation", description: "Symbols, judgment, and final hope", href: "https://revelation.mybibleexplorer.com/" },
  { name: "Sanctuary", description: "A blueprint of salvation", href: "https://sanctuary.mybibleexplorer.com/#structure" },
  { name: "Last Day Events", description: "Earth's final chapter", href: "https://lastdayevents.mybibleexplorer.com/index.html" },
  { name: "Romans", description: "Righteousness by faith and life in the Spirit", href: "https://romans.mybibleexplorer.com" },
  { name: "Corinthians", description: "Christ-centered life in the church", href: "/", current: true }
] as const;

export function GlobalShell() {
  return (
    <header className="mbe-global-shell" data-tool="romans" data-embedded="true">
      <div className="mbe-shell-wrap">
        <div className="mbe-ribbon-left">
          <a className="mbe-ribbon-brand" href="https://mybibleexplorer.com" aria-label="My Bible Explorer home">
            <img className="mbe-ribbon-logo" src="/assets/my-bible-explorer-logo.png" alt="My Bible Explorer" />
          </a>
          <a className="mbe-ribbon-back" href="https://mybibleexplorer.com/#journeys">
            Back to Library
          </a>
        </div>
        <nav className="mbe-global-nav" aria-label="My Bible Explorer">
          <details className="mbe-library-menu">
            <summary className="mbe-library-toggle">Library</summary>
            <div className="mbe-library-panel">
              <div className="mbe-library-grid">
                {libraryItems.map((item) => (
                  <a
                    key={item.name}
                    className="mbe-library-item"
                    href={item.href}
                    aria-current={"current" in item && item.current ? "page" : undefined}
                  >
                    <span className="mbe-library-name">{item.name}</span>
                    <span className="mbe-library-desc">{item.description}</span>
                  </a>
                ))}
              </div>
            </div>
          </details>
          <a className="mbe-ribbon-give" href="https://mybibleexplorer.com/#donate">
            Support
          </a>
        </nav>
      </div>
    </header>
  );
}

export function GlobalFooter() {
  return (
    <footer className="mbe-global-footer" data-tool="romans">
      <div className="mbe-shell-wrap mbe-footer-wrap">
        <a className="mbe-footer-brand" href="https://mybibleexplorer.com" aria-label="My Bible Explorer home">
          <img className="mbe-footer-logo" src="/assets/my-bible-explorer-logo.png" alt="My Bible Explorer" />
        </a>
        <span>Know the Word. Live the Word.</span>
        <span>
          To contact, email <a className="mbe-footer-link" href="mailto:admin@mybibleexplorer.com">admin@mybibleexplorer.com</a>
        </span>
        <a className="mbe-footer-link" href="https://mybibleexplorer.com/#donate">Support</a>
        <span>&copy; {new Date().getFullYear()} My Bible Explorer</span>
      </div>
    </footer>
  );
}
