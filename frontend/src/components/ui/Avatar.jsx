import { cls } from "../../lib/utils";

export const Avatar = ({ src, name, size = "md", className, fallbackClassName }) => {
  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const fallbackText = name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        className={cls("rounded-full object-cover", sizeClasses[size], className)}
      />
    );
  }

  const bgColors = ["bg-indigo-500", "bg-purple-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
  const bgClass = bgColors[Math.abs(fallbackText.charCodeAt(0) - 65) % bgColors.length];

  return (
    <div
      className={cls(
        "rounded-full flex items-center justify-center font-bold text-white",
        sizeClasses[size],
        bgClass,
        className
      )}
    >
      {fallbackText}
    </div>
  );
};

export default Avatar;
