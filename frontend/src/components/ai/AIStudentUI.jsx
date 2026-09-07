export function AIPageHeader({ eyebrow, title, description, actions, meta }) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">{eyebrow}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{title}</h1>
        {description && (
          <p className="text-sm sm:text-base text-gray-600 mt-2 max-w-3xl leading-relaxed">{description}</p>
        )}
      </div>
      {(actions || meta) && (
        <div className="flex flex-col gap-3 lg:items-end shrink-0">
          {meta}
          {actions}
        </div>
      )}
    </header>
  );
}

export function AIReadinessBadge({ label, value, icon: Icon }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      {Icon && (
        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      </div>
    </div>
  );
}

export function AIContentCard({ title, icon: Icon, children, className = "" }) {
  return (
    <section className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm ${className}`}>
      <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
        {Icon && <Icon size={18} className="text-indigo-600 shrink-0" />}
        {title}
      </h2>
      {children}
    </section>
  );
}

export function AIActionBar({ children }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {children}
    </div>
  );
}

export const skillChipStyles = {
  strong: "bg-green-50 text-green-700 border border-green-100",
  gap: "bg-red-50 text-red-600 border border-red-100",
  neutral: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  priority: "bg-amber-50 text-amber-800 border border-amber-100",
};

export function SkillChip({ children, variant = "neutral" }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${skillChipStyles[variant] || skillChipStyles.neutral}`}>
      {children}
    </span>
  );
}
