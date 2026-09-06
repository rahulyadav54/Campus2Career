import { cls } from "../../lib/utils";

export const Card = ({
  children,
  title,
  description,
  headerAction,
  footer,
  className,
  noPadding = false,
  border = true,
}) => {
  return (
    <div className={cls("bg-white rounded-xl shadow-sm", border ? "border border-gray-200" : "", className)}>
      {(title || headerAction) && (
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
          </div>
          {headerAction}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
      {footer && <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">{footer}</div>}
    </div>
  );
};

export default Card;
