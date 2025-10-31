"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { EyeClosed, Eye, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import Rightside from "@/components/ui/rightside";

interface Institution {
  id: number;
  name: string;
  school_id: string;
  email: string;
}

const SignUp = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    institution: "",
    password: "",
  });
  const [iloading, isetLoading] = useState(false); // for fetching institutions
  const [loading, setLoading] = useState(false);

  // Fetch all institutions from DB
  useEffect(() => {
    const fetchInstitutions = async () => {
      isetLoading(true); // Start loading before fetch begins
      try {
        const res = await fetch("/api/schools/forsignup");
        if (!res.ok) throw new Error("Failed to fetch institutions");
        const data = await res.json();
        setInstitutions(data);
      } catch (err) {
        console.error("Error fetching institutions:", err);
        setInstitutions([]); // Ensure it's always an array
      } finally {
        isetLoading(false); // Stop loading after success or error
      }
    };

    fetchInstitutions();
  }, []);

  // ✅ Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true); // Start loading before fetch begins

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create account");
        return;
      }

      toast.success(
        "Account created successfully! Please reach out to your institution to verify your account.",
        {
          duration: 8000,
        }
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";
      toast.error(errorMessage);
    } finally {
      setLoading(false); // Stop loading after success or error
    }
  };

  return (
    <div className="w-full flex flex-col sm:flex-row ">
      {/* Left Section */}
      <div className="w-[100%] sm:w-[45%] h-[100%] bg-[#ffffff] relative top-0 left-0 flex flex-col justify-between">
        <div className="w-4/5 sm:w-3/5 mx-auto mt-6 flex flex-col gap-4 px-6 sm:px-0">
          <Image
            src="/kirs.png"
            alt="kano state"
            width={56}
            height={56}
            className="md:block object-cover mx-auto"
          />
          <h2 className="text-lg font-bold mx-auto">Register</h2>
          <p className="text-gray-500 text-xs">
            Create an account to view your Institutions insight.
          </p>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              placeholder="Enter your Name"
              value={formData.name}
              onChange={handleChange}
            />

            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />

            {/* Institution (fetched from DB) */}
            <div>
              <label className="block text-sm font-medium">Institution</label>
              <select
                name="institution"
                value={formData.institution}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    institution: e.target.value,
                  }))
                }
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                disabled={iloading} // optional: disable while loading
              >
                {iloading ? (
                  <option value=""> ↻ Loading institutions...</option>
                ) : (
                  <>
                    <option value="">Select Institution</option>
                    {/* extra manual option */}
                    <option value="CBS_Admin">CBS Admin</option>
                    {/* mapped options from database */}
                    {institutions.map((school) => (
                      <option key={school.id} value={school.school_id}>
                        {school.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                id="password"
                name="password"
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button" // Prevents form submission
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 text-sm"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? <EyeClosed size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-[#28a745] text-white font-semibold py-3 rounded-md text-sm transition cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Please Wait</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-xs text-gray-500">
            Already have an account ?{" "}
            <Link href="/" className="text-sm text-blue-700 font-semibold">
              Sign in
            </Link>
          </p>

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
      <div
        className="hidden sm:block w-full sm:w-[55%] relative bg-[#199b39] bg-cover bg-center sm:order-2 order-1"
        style={{
          backgroundImage:
            "linear-gradient(rgba(25,155,57,0.9), rgba(25,155,57,1.0)), url('/kirs.png')",
          backgroundSize: "620px",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <Rightside />
      </div>
    </div>
  );
};

export default SignUp;
