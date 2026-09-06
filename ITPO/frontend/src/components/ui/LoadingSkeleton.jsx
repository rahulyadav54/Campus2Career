import { cls } from "../../lib/utils";

export const LoadingSkeleton = ({ lines = 3, avatar = false, className }) => {
  return (
    <div className={cls("animate-pulse", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 mb-3 last:mb-0">
          {avatar && i === 0 && (
            <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
          )}
          <div className="h-3 bg-gray-200 rounded flex-1"></div>
          {i === lines - 1 && <div className="h-3 bg-gray-200 rounded w-1/3 flex-shrink-0"></div>}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = ({ lines = 4 }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-gray-200 rounded mb-2 last:mb-0"></div>
      ))}
    </div>
  );
};

export const StatCardSkeleton = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
        <div className="w-12 h-5 bg-gray-200 rounded"></div>
      </div>
      <div className="h-7 bg-gray-200 rounded w-16 mb-1"></div>
      <div className="h-4 bg-gray-200 rounded w-20"></div>
    </div>
  );
};

export default LoadingSkeleton;
