import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, cycleTheme, getStoredTheme, resolveTheme } from "../utils/theme";

export default function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState(() => resolveTheme(getStoredTheme()));

  useEffect(() => {
    const sync = () => setTheme(resolveTheme(getStoredTheme()));
    applyTheme();
    window.addEventListener("c2c-theme-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("c2c-theme-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => setTheme(resolveTheme(cycleTheme()))}
      className={`p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors ${className}`}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle color theme"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
