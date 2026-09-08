/**
 * ResumePreview — routes to Campus2Career ATS template (default).
 */

import Campus2CareerTemplate from "./Campus2CareerTemplate";
import { DEFAULT_TEMPLATE_ID } from "./constants";

export default function ResumePreview({
  content,
  templateId = DEFAULT_TEMPLATE_ID,
  zoom = 100,
  onChange,
  editMode = true,
}) {
  return (
    <Campus2CareerTemplate
      content={content}
      zoom={zoom}
      onChange={onChange}
      editMode={editMode}
    />
  );
}
