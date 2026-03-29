"use client";

import Image from "next/image";
import { useState } from "react";
import { EyeClosed, Eye, Loader2 } from "lucide-react";
import Rightside from "@/components/ui/rightside";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Page = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        // Important: include credentials so cookies are stored
        credentials: "include",
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // ✅ Success
      setSuccess(data.message);
      console.log("User details:", data.user);

      // ✅ Cookie is already set by backend — just redirect based on role
      if (data.user.role === "admin") {
        router.push("/dashboard"); // (admin)
      } else if (data.user.role === "school") {
        router.push("/home"); // (school)
      } else if (data.user.role === "finance") {
        router.push("/collections"); // (finance)
      } else if (data.user.role === "inspector") {
        router.push("/inspector"); // (inspector)
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center">
      {/* Left Section */}
      <div className="w-[100%] h-[100vh] bg-[#ffffff] relative top-0 left-0 flex flex-col justify-between">
        <div className="w-[33vw] mx-auto my-auto flex flex-col gap-2 px-6 sm:px-0">
          <Image
            src="/KD_logo.png"
            alt="kaduna state"
            width={66}
            height={66}
            className="md:block object-cover mx-auto"
          />
          <h2 className="text-xl font-bold mx-auto">Sign-In</h2>
          <p className="text-gray-500 text-xs">
            Access your dashboard using your email and password.
          </p>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col mt-3 gap-4">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button" // Prevents form submission
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 text-sm"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? <EyeClosed size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <Link
              href="/forgot-password"
              className="ml-auto text-xs font-semibold text-green-600 hover:underline"
            >
              Forgot password?
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#28a745] text-white font-semibold py-3 rounded-md text-sm transition cursor-pointer flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" /> Please
                  wait
                </>
              ) : (
                "Sign-In"
              )}
            </button>
          </form>

          <p className="text-xs text-gray-500">
            New on our platform?{" "}
            <Link
              href="/signup"
              className="text-sm text-blue-700 font-semibold"
            >
              Create an account
            </Link>
          </p>

          <div className="mt-16 flex gap-3 sm:gap-8 text-xs font-medium text-blue-700">
            <a href="#">Terms & Condition</a> <a href="#">Privacy Policy</a>{" "}
            <a href="#">Support</a>
          </div>
          <span className="flex items-center text-xs mt-3 mb-6">
            © {new Date().getFullYear()} Powered by
            <span className="ml-1">
              <Image src="/paypro.png" alt="Logo" width={46} height={46} />
            </span>
            <p className="hidden sm:block"> . All Rights Reserved. </p>
          </span>
        </div>
      </div>

      {/* Right Section */}
      {/* <div
        className="w-full sm:w-[55%] relative bg-[#199b39] bg-cover bg-center sm:order-2 order-1"
        style={{
          backgroundImage:
            "linear-gradient(rgba(25,155,57,0.9), rgba(25,155,57,1.0)), url('/KD_logo.png')",
          backgroundSize: "620px",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <Rightside />
      </div> */}
    </div>
  );
};

export default Page;
