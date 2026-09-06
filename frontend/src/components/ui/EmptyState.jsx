import { cls } from "../../lib/utils";

export const EmptyState = ({
  icon: Icon,
  title = "No data yet",
  description = "There's nothing to show right now.",
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div className={cls("flex flex-col items-center text-center py-12 px-4", className)}>
      {Icon && (
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors text-sm font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export const ErrorState = ({
  title = "Something went wrong",
  description = "Unable to load this data. Please try again.",
  onRetry,
  className,
}) => {
  return (
    <div className={cls("flex flex-col items-center text-center py-12 px-4", className)}>
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl">⚠️</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default EmptyState;
