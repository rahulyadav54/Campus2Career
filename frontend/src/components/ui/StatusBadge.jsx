import { cls } from "../../lib/utils";

export const StatusBadge = ({ status, children, variant, className }) => {
  const variants = {
    active: "bg-green-100 text-green-700",
    accepted: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    "pending review": "bg-yellow-100 text-yellow-700",
    rejected: "bg-red-100 text-red-700",
    rejectedByMentor: "bg-red-100 text-red-700",
    inactive: "bg-red-100 text-red-700",
    inactive_job: "bg-red-100 text-red-700",
    closed: "bg-gray-100 text-gray-700",
    completed: "bg-blue-100 text-blue-700",
    ongoing: "bg-indigo-100 text-indigo-700",
    approved: "bg-green-100 text-green-700",
    draft: "bg-gray-100 text-gray-700",
    expired: "bg-gray-100 text-gray-700",
    default: "bg-gray-100 text-gray-700",
    error: "bg-red-100 text-red-700",
    warning: "bg-amber-100 text-amber-700",
    success: "bg-green-100 text-green-700",
    info: "bg-blue-100 text-blue-700",
  };

  const normalizedStatus = typeof status === "string" ? status.toLowerCase() : "default";
  const classes = variants[variant || normalizedStatus] || variants.default;

  return (
    <span className={cls("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", classes, className)}>
      {children || status || "Unknown"}
    </span>
  );
};

export default StatusBadge;
