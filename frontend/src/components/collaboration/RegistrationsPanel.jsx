import { useState, useEffect } from "react";
import { API_URL } from "../../config/api";
import { toast } from "react-hot-toast";
import { X, Download, FileSpreadsheet, Users } from "lucide-react";

const TYPE_ENDPOINT = {
  workshop: "workshops",
  "guest-lecture": "guest-lectures",
  challenge: "challenges",
  project: "projects",
};

export default function RegistrationsPanel({ open, onClose, item, type }) {
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(false);

  const endpoint = TYPE_ENDPOINT[type];

  useEffect(() => {
    if (open && item?._id && endpoint) fetchRegs();
  }, [open, item?._id, endpoint]);

  const fetchRegs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/api/collaborations/${endpoint}/${item._id}/registrations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to load registrations");
      const data = await res.json();
      setRegs(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      toast.error(err.message);
      setRegs([]);
    } finally {
      setLoading(false);
    }
  };

  const download = async (format) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/api/collaborations/${endpoint}/${item._id}/registrations/export?format=${format}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(item.title || "registrations").replace(/[^\w\s-]/g, "").trim()}_${format === "xlsx" ? "registrations.xlsx" : "registrations.csv"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!open || !item) return null;

  const d = (reg) => reg.details || {};
  const s = (reg) => reg.student || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between p-5 border-b shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users size={20} className="text-indigo-600" />
              Registrations — {item.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{regs.length} registrant(s)</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 p-4 border-b shrink-0">
          <button
            type="button"
            onClick={() => download("csv")}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50"
          >
            <Download size={16} />
            Download CSV
          </button>
          <button
            type="button"
            onClick={() => download("xlsx")}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50"
          >
            <FileSpreadsheet size={16} />
            Download Excel
          </button>
        </div>

        <div className="overflow-auto flex-1 p-4">
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading registrations…</p>
          ) : regs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No registrations yet.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600">
                  <th className="p-2 border-b">#</th>
                  <th className="p-2 border-b">Name</th>
                  <th className="p-2 border-b">Email</th>
                  <th className="p-2 border-b">Phone</th>
                  <th className="p-2 border-b">Institution</th>
                  <th className="p-2 border-b">Dept</th>
                  <th className="p-2 border-b">Year</th>
                  <th className="p-2 border-b">Roll No</th>
                  {type === "challenge" && <th className="p-2 border-b">Team</th>}
                  <th className="p-2 border-b">Date</th>
                </tr>
              </thead>
              <tbody>
                {regs.map((reg, i) => (
                  <tr key={reg._id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{i + 1}</td>
                    <td className="p-2 font-medium">{d(reg).name || s(reg).name}</td>
                    <td className="p-2">{d(reg).email || s(reg).email}</td>
                    <td className="p-2">{d(reg).phone || s(reg).phone}</td>
                    <td className="p-2">{d(reg).institution || s(reg).institution}</td>
                    <td className="p-2">{d(reg).department || s(reg).department}</td>
                    <td className="p-2">{d(reg).year || s(reg).year}</td>
                    <td className="p-2">{d(reg).rollNo || s(reg).rollNo}</td>
                    {type === "challenge" && (
                      <td className="p-2">{d(reg).teamName || reg.teamName || "—"}</td>
                    )}
                    <td className="p-2 text-gray-500">
                      {new Date(reg.registeredAt || reg.appliedAt || reg.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
