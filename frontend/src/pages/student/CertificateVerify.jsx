import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Award, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { API_URL } from "../../config/api";

export default function CertificateVerify() {
  const { certificateId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/learning/certificates/verify/${certificateId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
        else setError(res.message || "Certificate not found");
      })
      .catch(() => setError("Verification failed"))
      .finally(() => setLoading(false));
  }, [certificateId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Verifying certificate…
      </div>
    );
  }

  const valid = data?.valid && data?.status === "verified";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border border-gray-200 rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-indigo-100">
          {valid ? <CheckCircle className="w-8 h-8 text-green-600" /> : <XCircle className="w-8 h-8 text-red-500" />}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Certificate Verification</h1>
        <p className="text-sm text-gray-500 mt-1">Campus2Career Learning Platform</p>

        {valid ? (
          <div className="mt-6 space-y-3 text-left bg-gray-50 rounded-xl p-5">
            <div className="flex items-center gap-2 text-green-700 font-medium justify-center mb-4">
              <Award size={20} /> Verified Certificate
            </div>
            <p className="text-sm"><span className="text-gray-500">Student:</span> <strong>{data.studentName}</strong></p>
            <p className="text-sm"><span className="text-gray-500">Course:</span> <strong>{data.courseName}</strong></p>
            {data.provider && <p className="text-sm"><span className="text-gray-500">Provider:</span> {data.provider}</p>}
            <p className="text-sm"><span className="text-gray-500">Completion:</span> {new Date(data.completionDate).toLocaleDateString()}</p>
            <p className="text-sm"><span className="text-gray-500">Certificate ID:</span> <code className="text-indigo-600">{data.certificateId}</code></p>
          </div>
        ) : (
          <p className="mt-6 text-red-600">{error || "This certificate could not be verified."}</p>
        )}
      </div>
    </div>
  );
}
