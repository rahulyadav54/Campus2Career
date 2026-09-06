import { cls } from "../../lib/utils";

export const StatCard = ({
  icon: Icon,
  iconColor = "indigo",
  value,
  label,
  sublabel,
  trend,
  trendDirection,
  className,
  loading = false,
  onClick,
}) => {
  const iconColorClasses = {
    indigo: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
    teal: "bg-teal-50 text-teal-600",
    amber: "bg-amber-50 text-amber-600",
    fuchsia: "bg-fuchsia-50 text-fuchsia-600",
  };

  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-gray-500",
  };

  return (
    <div
      className={cls(
        "bg-white rounded-xl border border-gray-200 p-5 shadow-sm transition-shadow hover:shadow-md",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconColorClasses[iconColor] || iconColorClasses.indigo}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {trend !== undefined && trend !== null && (
          <span className={`text-xs font-medium flex items-center gap-1 ${trendColors[trendDirection] || trendColors.neutral}`}>
            {trendDirection === "up" && "▲"}
            {trendDirection === "down" && "▼"}
            {trend}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-7 w-16 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          {sublabel && <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mt-1"></div>}
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm font-medium text-gray-700 mt-1">{label}</div>
          {sublabel && <div className="text-xs text-gray-500 mt-0.5">{sublabel}</div>}
        </>
      )}
    </div>
  );
};

export default StatCard;
