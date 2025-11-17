import useTheme from "../hooks/useTheme";
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
  const { theme, toggleTheme } = useTheme();

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
        <div className="header-right">
          {rightActions}
          <ThemeSwitch theme={theme} toggleTheme={toggleTheme} />
        </div>
      </header>
    );
  }

  // Authed header
  const displayName = (u) => u?.name || u?.username || "(No Name)";
  const roleClass = user?.role === "teacher" ? "teacher" : "student";

  return (
    <header
      className={`${
        headerClass || "app-header"
      } responsive ${stickyClass} ${roleClass}`}
    >
      <div className="header-left">{leftActions}</div>

      <div className={welcomeClass || "app-welcome"}>
        <h1>Welcome, {displayName(user)}</h1>
        <span className={`role-badge ${roleClass}`} data-role={user.role}>
          {user.role}
          {section && <span className="role-sub"> • {section}</span>}
        </span>
      </div>

      <div className="header-actions">
        {rightActions}
        <ThemeSwitch theme={theme} toggleTheme={toggleTheme} />
      </div>
    </header>
  );
};

const ThemeSwitch = ({ theme, toggleTheme }) => {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-switch ${isDark ? "is-dark" : "is-light"}`}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="theme-switch-track">
        <span className="theme-switch-thumb"></span>
        <span className="theme-swtich-icon sun"></span>
        <span className="theme-swtich-icon moon"></span>
      </span>
    </button>
  );
};

export default Header;
