const libraryItems = [
  { name: "Hermeneutics", description: "Learn to read Scripture faithfully", href: "https://hermeneutics.mybibleexplorer.com" },
  { name: "Psalms", description: "Worship, lament, praise, and prayer", href: "https://psalms.mybibleexplorer.com" },
  { name: "Sanctuary", description: "A blueprint of salvation", href: "https://sanctuary.mybibleexplorer.com/#structure" },
  { name: "Last Day Events", description: "Earth's final chapter", href: "https://lastdayevents.mybibleexplorer.com/index.html" },
  { name: "Parables", description: "Stories of the kingdom", href: "https://parables.mybibleexplorer.com" },
  { name: "Romans", description: "Righteousness by faith and life in the Spirit", href: "https://romans.mybibleexplorer.com" },
  { name: "Corinthians", description: "Unity, worship, holy living, and resurrection", href: "/", current: true },
  { name: "Galatians", description: "Freedom in Christ and life by the Spirit", href: "https://galatians.mybibleexplorer.com/" },
  { name: "Ephesians", description: "Grace, unity, new life, and spiritual warfare", href: "https://ephesians.mybibleexplorer.com/" },
  { name: "Philippians", description: "Joy, humility, perseverance, and contentment", href: "https://philippians.mybibleexplorer.com/" },
  { name: "Colossians", description: "The supremacy of Christ and life in Him", href: "https://colossians.mybibleexplorer.com/" },
  { name: "Hebrews", description: "Christ, covenant, sanctuary, and persevering faith", href: "https://hebrews.mybibleexplorer.com/" },
  { name: "James", description: "Living faith, wisdom, speech, patience, and prayer", href: "https://james.mybibleexplorer.com/" },
  { name: "Isaiah", description: "Judgment, comfort, and gospel hope", href: "https://isaiah.mybibleexplorer.com/" },
  { name: "Daniel", description: "Prophecy and providence", href: "https://daniel.mybibleexplorer.com" },
  { name: "Revelation", description: "Symbols, judgment, and final hope", href: "https://revelation.mybibleexplorer.com/" },
  { name: "Life of Christ", description: "The life and ministry of Jesus", href: "https://christ.mybibleexplorer.com/" },
] as const;

export function GlobalShell() {
  return (
    <header className="mbe-global-shell" data-tool="corinthians" data-embedded="true">
      <div className="mbe-shell-wrap">
        <div className="mbe-ribbon-left">
          <a className="mbe-ribbon-brand" href="https://mybibleexplorer.com" aria-label="My Bible Explorer home">
            <img className="mbe-ribbon-logo" src="https://mybibleexplorer.com/assets/my-bible-explorer-logo.png?v=mbe-20260715-1" alt="My Bible Explorer" width={107} height={34}/>
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
    <footer className="mbe-global-footer" data-tool="corinthians">
      <div className="mbe-shell-wrap mbe-footer-wrap">
        <a className="mbe-footer-brand" href="https://mybibleexplorer.com" aria-label="My Bible Explorer home">
          <img className="mbe-footer-logo" src="https://mybibleexplorer.com/assets/my-bible-explorer-logo.png?v=mbe-20260715-1" alt="My Bible Explorer" width={107} height={34}/>
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
