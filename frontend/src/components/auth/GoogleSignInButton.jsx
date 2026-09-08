import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import { googleLoginUser, handleApiError } from "../../services/auth";

export default function GoogleSignInButton({ mode = "signin" }) {
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) return null;

  const handleSuccess = async (credentialResponse) => {
    try {
      const credential = credentialResponse?.credential;
      if (!credential) {
        toast.error("Google sign-in was cancelled");
        return;
      }

      const data = await googleLoginUser(credential);
      localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", data.role || data.user?.role || "student");

      if (data.pending) {
        toast.success(data.message || "Registration submitted. Awaiting admin approval.", { duration: 6000 });
        navigate(`/${data.role || "student"}`);
        return;
      }

      toast.success(mode === "signup" ? "Signed up with Google!" : "Signed in with Google!", { duration: 4000 });
      navigate(`/${data.role || data.user?.role || "student"}`);
    } catch (err) {
      toast.error(handleApiError(err));
    }
  };

  return (
    <div className="w-full flex justify-center google-signin-wrap">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => toast.error("Google sign-in failed. Please try again.")}
        theme="outline"
        size="large"
        shape="rectangular"
        text={mode === "signup" ? "signup_with" : "signin_with"}
        width="100%"
      />
    </div>
  );
}
