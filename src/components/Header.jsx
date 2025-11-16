import "./css/Header.css";

const Header = ({
  title = "Digital Portfolio System",
  subtitle = null,
  leftActions = null, // optional (e.g., notifications)
  rightActions = null, // optional (e.g., Manage Sections)

  variant = "public", // "public" | "authed"

  user = null, // required for authed
  section = null, // teacher: classroom section, student: user.section
  headerClass, // e.g., "dashboard-header" | "home-header"
  welcomeClass, // e.g., "dashboard-welcome" | "home-welcome"
  sticky = true,
}) => {
  const stickyClass = sticky ? "is-sticky" : "";

  // Public/non-auth header (keeps existing look)
  if (variant === "public" || !user) {
    return (
      <header
        className={`${headerClass || "public-header"} responsive`}
        role="banner"
        aria-label="Site header"
      >
        <div className="header-left">{leftActions}</div>
        <div className="public-brand" aria-live="polite">
          <h1 className="public-title">{title}</h1>
          {subtitle && <div className="public-subtitle">{subtitle}</div>}
        </div>
        <div className="header-right">{rightActions}</div>
      </header>
    );
  }

  // Authed header
  const displayName = (u) => u?.name || u?.username || "(No Name)";
  return (
    <header
      className={`${headerClass || "app-header"} responsive ${stickyClass}`}
    >
      {leftActions}
      <div className={welcomeClass || "app-welcome"}>
        <h1>Welcome, {displayName(user)}</h1>
        <span className={`role-badge ${user.role}`} data-role={user.role}>
          {user.role}
          {section && <span className="role-sub"> • {section}</span>}
        </span>
      </div>
      <div className="header-actions">{rightActions}</div>
    </header>
  );
};

export default Header;
