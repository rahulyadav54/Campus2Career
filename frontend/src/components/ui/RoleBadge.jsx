import { cls } from "../../lib/utils";

export const RoleBadge = ({ role }) => {
  const roleConfig = {
    student: { label: "Student", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    admin: { label: "Admin", className: "bg-purple-100 text-purple-700 border-purple-200" },
    recruiter: { label: "Recruiter", className: "bg-blue-100 text-blue-700 border-blue-200" },
    mentor: { label: "Mentor", className: "bg-green-100 text-green-700 border-green-200" },
    academician: { label: "Academician", className: "bg-orange-100 text-orange-700 border-orange-200" },
    institution: { label: "Institution", className: "bg-teal-100 text-teal-700 border-teal-200" },
    staff: { label: "Staff", className: "bg-gray-100 text-gray-700 border-gray-200" },
  };

  const config = roleConfig[role] || { label: role, className: "bg-gray-100 text-gray-700 border-gray-200" };

  return (
    <span className={cls("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", config.className)}>
      {config.label}
    </span>
  );
};

export default RoleBadge;
