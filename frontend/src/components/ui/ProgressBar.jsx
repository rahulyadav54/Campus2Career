import { cls } from "../../lib/utils";

export const ProgressBar = ({ value = 0, max = 100, size = "md", showLabel = false, className, barClassName }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  let barColor = "bg-gray-300";
  if (percentage >= 80) barColor = "bg-green-500";
  else if (percentage >= 50) barColor = "bg-indigo-500";
  else if (percentage >= 30) barColor = "bg-amber-500";
  else barColor = "bg-red-500";

  return (
    <div className={cls("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{value !== undefined ? value : 0}</span>
          <span>{max}</span>
        </div>
      )}
      <div className={cls("w-full bg-gray-200 rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className={cls("h-full rounded-full transition-all duration-300", barColor, barClassName)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export const RatingBar = ({ value = 0, max = 5, className }) => {
  return (
    <div className={cls("flex items-center gap-1", className)}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={i < value ? "text-amber-400" : "text-gray-300"}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default ProgressBar;
