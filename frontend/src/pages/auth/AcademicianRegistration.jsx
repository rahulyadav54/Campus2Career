import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";

export default function AcademicianRegistration() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", institution: "", designation: "", department: "" });
  const [loading, setLoading] = useState(false);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/register`, { ...form, role: "academician" });
      toast.success("Registration submitted for institution approval");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };
  return <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4"><form onSubmit={submit} className="w-full max-w-lg bg-white border rounded-xl p-6 space-y-4"><div><p className="text-sm font-semibold text-indigo-600">Campus2Career Academia</p><h1 className="text-2xl font-bold mt-1">Create academician account</h1><p className="text-gray-600 mt-2">Publish faculty programs and collaborate with industry.</p></div>{["name", "email", "institution", "designation", "department"].map((field) => <input key={field} name={field} type={field === "email" ? "email" : "text"} required value={form[field]} onChange={update} placeholder={field.charAt(0).toUpperCase() + field.slice(1)} className="w-full px-3 py-2 border rounded-lg" />)}<input name="password" type="password" required minLength="8" value={form.password} onChange={update} placeholder="Password (8+ characters)" className="w-full px-3 py-2 border rounded-lg" /><button disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-lg">{loading ? "Submitting..." : "Register as Academician"}</button><Link to="/login" className="block text-center text-sm text-indigo-600">Already registered? Sign in</Link></form></main>;
}