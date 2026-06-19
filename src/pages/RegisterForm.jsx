import { useState } from "react";
import { FaUserPlus, FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function FloatingInput({ type, name, label, value, onChange, children }) {
  return (
    <div className="relative mb-5">
      <input
        type={type}
        name={name}
        placeholder=" "
        value={value}
        onChange={onChange}
        className="peer w-full px-3 pt-5 pb-2 border border-gray-300 rounded-lg bg-white text-sm outline-none focus:border-[#0d4a17] focus:ring-2 focus:ring-[#0d4a17]/20 transition-all duration-200"
      />
      <label className="absolute left-3 top-2.5 text-[10px] text-gray-400 pointer-events-none transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#0d4a17] peer-focus:font-semibold peer-[&:not(:placeholder-shown)]:top-1.5 peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:text-[#0d4a17] peer-[&:not(:placeholder-shown)]:font-semibold bg-white px-1 rounded">
        {label}
      </label>
      {children}
    </div>
  );
}

function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // ← NEW
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return setError(data.message || "Registration failed. Please try again.");
      }
      setOtpStep(true);
    } catch (err) {
      setError("Registration failed. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    setError("");
    setOtpLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpLoading(false);
        return setError(data.message);
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/admin";
    } catch (err) {
      setOtpLoading(false);
      setError("OTP verification failed. Try again.");
    }
  }

  return (
    <div>
      {error && (
        <div className="bg-red-100 text-red-700 text-center px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {otpStep ? (
        <form onSubmit={handleOtpSubmit}>
          <div className="text-center mb-6">
            <p className="text-sm font-semibold text-[#0d4a17]">
              Verify your email
            </p>
            <p className="text-xs text-gray-500 mt-1">
              We sent a 6-digit code to <strong>{formData.email}</strong>
            </p>
          </div>
          <FloatingInput
            type="text"
            name="otp"
            label="ENTER OTP CODE"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button
            type="submit"
            disabled={otpLoading}
            className="w-full py-3.5 bg-[#171305] text-white text-sm rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {otpLoading ? (
              <>
                <Spinner /> Verifying...
              </>
            ) : (
              "Verify & Continue"
            )}
          </button>
          <p
            onClick={() => {
              setOtpStep(false);
              setOtp("");
              setError("");
            }}
            className="text-center mt-4 text-xs text-[#8b6f3d] cursor-pointer"
          >
            ← Back to registration
          </p>
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          <FloatingInput
            type="text"
            name="fullName"
            label="USERNAME"
            value={formData.fullName}
            onChange={handleChange}
          />
          <FloatingInput
            type="email"
            name="email"
            label="EMAIL"
            value={formData.email}
            onChange={handleChange}
          />
          <div className="relative">
            <FloatingInput
              type={showPassword ? "text" : "password"}
              name="password"
              label="PASSWORD"
              value={formData.password}
              onChange={handleChange}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#171305] cursor-pointer z-10 text-base"
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </span>
          </div>

          {/* Create Account button with spinner */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#171305] text-white text-sm rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Spinner /> Creating account...
              </>
            ) : (
              <>
                <FaUserPlus /> Create Account
              </>
            )}
          </button>

          <div className="flex items-center gap-3 my-4">
            <hr className="flex-1 border-gray-300" />
            <span className="text-xs text-gray-400">or</span>
            <hr className="flex-1 border-gray-300" />
          </div>

          {/* Google button — disabled while loading */}
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              (window.location.href = `${API_URL}/api/auth/google`)
            }
            className="w-full py-3 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FcGoogle className="text-lg" />
            Sign Up with Google
          </button>
        </form>
      )}
    </div>
  );
}

export default RegisterForm;
