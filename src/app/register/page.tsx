"use client";

import { useState } from "react";
import Image from "next/image";
import { CircleX } from "lucide-react";

import Link from "next/link";

type FormData = {
  A: {
    officialName: string;
    yearEstablished: string;
    cacNumber: string;
    proprietorName: string;
    chairmanName: string;
    licenseNumber: string;
    lastLicenseRenewal: string;
    ownershipType: string;
    tin: string;
    lastTaxFiling: string;
    address: string;
    lga: string;
    state: string;
    email: string;
    confirmemail: string;
    phone: string;
  };

  B: {
    faculties: string;
    modeOfOperation: string[];
    studentPopulation: string;
    populationByLevel: {
      "100": string;
      "200": string;
      "300": string;
      "400": string;
      "500": string;
      PG: string;
    };
    intlStudents: string;
    avgFee: string;
    avgFeeByLevel: {
      "100": string;
      "200": string;
      "300": string;
      "400": string;
      "500": string;
      PG: string;
    };
    totalRevenue: string;
    academicSession: string;
    weeksPerSemester: string;
    sessionStart: string;
    sessionEnd: string;
    programmes: string[];
  };

  C: {
    methodOfCollection: string[];
    paymentGateway: string[];
    currentGateway: string;
    partnerBanks: string;
    paymentReports: string[];
  };

  D: {
    licenceStatus: string[];
    prevLicence: string[];
    prevAmount: string;
    prevDate: string;
    outstandingPenalties: string[];
    penalty: string;
  };
  E: {
    eName: string;
    comments: string;
  };

  // ✅ Safely allow dynamic string keys for toggleCheckbox
  [key: string]: Record<string, unknown>;
};

const sections = [
  { id: "A", title: "Section A - General Information" },
  { id: "B", title: "Section B - Academic Information" },
  { id: "C", title: "Section C - Payment Structure & Systems" },
  { id: "D", title: "Section D - License and Tax Obligations" },
  { id: "E", title: "Section E - Enumerator / School Officer" },
  { id: "F", title: "Section F - Complete" },
] as const;

export default function PrivateInstitutionsForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    A: {
      officialName: "",
      yearEstablished: "",
      cacNumber: "",
      proprietorName: "",
      chairmanName: "",
      licenseNumber: "",
      lastLicenseRenewal: "",
      ownershipType: "",
      tin: "",
      lastTaxFiling: "",
      address: "",
      lga: "",
      state: "",
      email: "",
      confirmemail: "",
      phone: "",
    },
    B: {
      faculties: "",
      modeOfOperation: [],
      studentPopulation: "",
      populationByLevel: {
        "100": "",
        "200": "",
        "300": "",
        "400": "",
        "500": "",
        PG: "",
      },
      intlStudents: "",
      avgFee: "",
      avgFeeByLevel: {
        "100": "",
        "200": "",
        "300": "",
        "400": "",
        "500": "",
        PG: "",
      },
      totalRevenue: "",
      academicSession: "",
      weeksPerSemester: "",
      sessionStart: "",
      sessionEnd: "",
      programmes: [],
    },
    C: {
      methodOfCollection: [],
      paymentGateway: [],
      currentGateway: "",
      partnerBanks: "",
      paymentReports: [],
    },

    D: {
      licenceStatus: [],
      prevLicence: [],
      prevAmount: "",
      prevDate: "",
      outstandingPenalties: [],
      penalty: "",
    },
    E: {
      eName: "",
      comments: "",
    },
  });

  const handleChange = <T extends keyof FormData>(
    section: T,
    field: keyof FormData[T],
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // For general use of all checkboxes
  const toggleCheckbox = (
    section: keyof FormData,
    field: string,
    value: string
  ) => {
    setFormData((prev) => {
      const currentField = prev[section][field];

      // 🧩 Type check before using array methods
      if (Array.isArray(currentField)) {
        const selected = currentField.includes(value)
          ? currentField.filter((item: string) => item !== value)
          : [...currentField, value];

        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: selected,
          },
        };
      }

      // Fallback (in case field is not an array)
      return prev;
    });
  };

  //   const toggleProgramme = (programme: string) => {
  //     setFormData((prev) => {
  //       const selected = prev.B.programmes.includes(programme)
  //         ? prev.B.programmes.filter((p) => p !== programme)
  //         : [...prev.B.programmes, programme];
  //       return { ...prev, B: { ...prev.B, programmes: selected } };
  //     });
  //   };

  const nextStep = () => {
    if (currentStep < sections.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    console.log("Form submitted:", formData);
    alert("Form submitted! Check console.");
  };

  return (
    <div>
      <main>
        <Link href="/">
          <button className="w-full flex justify-center items-center gap-2 bg-[#28a745] text-white font-semibold py-3 text-sm transition cursor-pointer">
            <CircleX /> Cancel & Return Home
          </button>
        </Link>
        <div className="max-w-4xl mx-auto py-10 px-4">
          {/* Progress Bar */}
          <div className="flex items-center mb-8">
            {sections.map((section, index) => (
              <div key={section.id} className="flex-1 flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                ${index <= currentStep ? "bg-[#28a745]" : "bg-gray-300"}`}
                >
                  {section.id}
                </div>
                {index < sections.length - 1 && (
                  <div
                    className={`flex-1 h-1 ${
                      index < currentStep ? "bg-[#28a745]" : "bg-gray-300"
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>

          {/* Section Title */}
          <h2 className="text-2xl font-semibold mb-6">
            {sections[currentStep].title}
          </h2>

          {/* Section A */}
          {currentStep === 0 && (
            <div className="grid grid-cols-1 text-sm md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium">
                  Name of Institution
                </label>
                <input
                  type="text"
                  placeholder="Official Name of Institution"
                  value={formData.A.officialName}
                  onChange={(e) =>
                    handleChange("A", "officialName", e.target.value)
                  }
                  className="w-full p-2 border border-gray-400  rounded"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm  font-medium">
                  Year of Establishment
                </label>
                <input
                  type="number"
                  placeholder="Year of Establishment"
                  value={formData.A.yearEstablished}
                  onChange={(e) =>
                    handleChange("A", "yearEstablished", e.target.value)
                  }
                  className="w-full p-2 border border-gray-400 rounded"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">CAC Number</label>
                <input
                  type="text"
                  placeholder="CAC Registration Number"
                  value={formData.A.cacNumber}
                  onChange={(e) =>
                    handleChange("A", "cacNumber", e.target.value)
                  }
                  className="w-full p-2 border border-gray-400 rounded"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Proprietor Full Name
                </label>
                <input
                  type="text"
                  placeholder="Proprietor/Owner’s Full Name"
                  value={formData.A.proprietorName}
                  onChange={(e) =>
                    handleChange("A", "proprietorName", e.target.value)
                  }
                  className="w-full p-2 border border-gray-400 rounded"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Chairman’s Name</label>
                <input
                  type="text"
                  placeholder="Governing Council Chairman’s Name"
                  value={formData.A.chairmanName}
                  onChange={(e) =>
                    handleChange("A", "chairmanName", e.target.value)
                  }
                  className="w-full p-2 border border-gray-400 rounded"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">License Number</label>
                <input
                  type="text"
                  placeholder="License Number"
                  value={formData.A.licenseNumber}
                  onChange={(e) =>
                    handleChange("A", "licenseNumber", e.target.value)
                  }
                  className="w-full p-2 border border-gray-400 rounded"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Last License Renewal
                </label>
                <input
                  type="date"
                  placeholder="Date of Last License Renewal"
                  value={formData.A.lastLicenseRenewal}
                  onChange={(e) =>
                    handleChange("A", "lastLicenseRenewal", e.target.value)
                  }
                  className="w-full p-2 border border-gray-400 rounded"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Type of Ownership</label>
                <select
                  value={formData.A.ownershipType}
                  onChange={(e) =>
                    handleChange("A", "ownershipType", e.target.value)
                  }
                  className="w-full p-2 border border-gray-400 rounded"
                >
                  <option value="Private Individual">Private Individual</option>
                  <option value="Faith-Based">Faith-Based</option>
                  <option value="Corporate Body">Corporate Body</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">TIN</label>
                <input
                  type="text"
                  placeholder="Tax Identification Number (TIN)"
                  value={formData.A.tin}
                  onChange={(e) => handleChange("A", "tin", e.target.value)}
                  className="w-full p-2 border border-gray-400 rounded"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Last Tax Filing Date
                </label>
                <input
                  type="date"
                  placeholder="Last Tax Filing Date"
                  value={formData.A.lastTaxFiling}
                  onChange={(e) =>
                    handleChange("A", "lastTaxFiling", e.target.value)
                  }
                  className="w-full p-2 border border-gray-400 rounded"
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium">Address</label>
                <input
                  type="text"
                  placeholder="Physical Address of Institution"
                  value={formData.A.address}
                  onChange={(e) => handleChange("A", "address", e.target.value)}
                  className="w-full p-2 border rounded border-gray-400 "
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">LGA</label>
                <input
                  type="text"
                  placeholder="LGA"
                  value={formData.A.lga}
                  onChange={(e) => handleChange("A", "lga", e.target.value)}
                  className="w-full p-2 border border-gray-400 rounded"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">State</label>
                <input
                  type="text"
                  placeholder="State"
                  value={formData.A.state}
                  onChange={(e) => handleChange("A", "state", e.target.value)}
                  className="w-full p-2 border border-gray-400 rounded"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Institutions Email Address
                </label>
                <input
                  type="email"
                  placeholder="Official Email Address"
                  value={formData.A.email}
                  onChange={(e) => handleChange("A", "email", e.target.value)}
                  className="w-full p-2 border border-gray-400 rounded"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Confirm Institutions Email Address
                </label>
                <input
                  type="email"
                  placeholder="Re-enter Official Email Address"
                  value={formData.A.confirmemail}
                  onChange={(e) => handleChange("A", "email", e.target.value)}
                  className="w-full p-2 border border-gray-400 rounded"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Phone</label>
                <input
                  type="text"
                  placeholder="Telephone Number(s)"
                  value={formData.A.phone}
                  onChange={(e) => handleChange("A", "phone", e.target.value)}
                  className="w-full p-2 border  border-gray-400 rounded"
                />
              </div>
            </div>
          )}

          {/* Section B */}
          {currentStep === 1 && (
            <div className="space-y-6 text-sm">
              {/* Academic Programmes */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Number of Faculties/Colleges
                    </label>
                    <input
                      type="number"
                      placeholder="Number of Faculties/Colleges"
                      value={formData.B.faculties}
                      onChange={(e) =>
                        handleChange("B", "faculties", e.target.value)
                      }
                      className="p-2 border rounded"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Mode of Operation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {["Full-Time", "Part-Time", "Distance Learning"].map(
                        (mode) => (
                          <label key={mode} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.B.modeOfOperation.includes(
                                mode
                              )}
                              onChange={() =>
                                toggleCheckbox("B", "modeOfOperation", mode)
                              }
                            />
                            {mode}
                          </label>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Enrollment */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Student Population
                    </label>
                    <input
                      type="number"
                      placeholder="Current Student Population"
                      value={formData.B.studentPopulation}
                      onChange={(e) =>
                        handleChange("B", "studentPopulation", e.target.value)
                      }
                      className="p-2 border rounded"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      International Students
                    </label>
                    <input
                      type="number"
                      placeholder="International Students (if any)"
                      value={formData.B.intlStudents}
                      onChange={(e) =>
                        handleChange("B", "intlStudents", e.target.value)
                      }
                      className="p-2 border rounded"
                    />
                  </div>

                  {/* Fee by Level */}
                  <div className=" flex flex-col gap-2 md:col-span-2 p-6 border border-[#28a745] border-4 border-dotted rounded-xl">
                    <label className="text-sm font-medium">
                      Population by level
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        "100",
                        "200",
                        "300",
                        "400",
                        "500",
                        "Above 500 / PG",
                      ].map((level) => (
                        <div key={level} className="flex flex-col">
                          <label className="text-xs font-medium text-gray-600">
                            {level} Level
                          </label>
                          <input
                            type="number"
                            placeholder={` ${level}`}
                            value={
                              formData.B.populationByLevel[
                                level as keyof typeof formData.B.populationByLevel
                              ]
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                B: {
                                  ...prev.B,
                                  avgFeeByLevel: {
                                    ...prev.B.avgFeeByLevel,
                                    [level]: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="p-2 border rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tuition & Fees */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Average Fee per Student
                    </label>
                    <input
                      type="number"
                      placeholder="₦ Average Annual Fee per Student"
                      value={formData.B.avgFee}
                      onChange={(e) =>
                        handleChange("B", "avgFee", e.target.value)
                      }
                      className="p-2 border rounded"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Last Year Revenue
                    </label>
                    <input
                      type="number"
                      placeholder="₦ Total Fee Revenue (Last Year)"
                      value={formData.B.totalRevenue}
                      onChange={(e) =>
                        handleChange("B", "totalRevenue", e.target.value)
                      }
                      className="p-2 border rounded"
                    />
                  </div>

                  {/* Fee by Level */}
                  <div className=" flex flex-col gap-2 md:col-span-2 p-6 border border-[#28a745] border-4 border-dotted rounded-xl">
                    <label className="text-sm font-medium">
                      Average Fee by Level
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        "100",
                        "200",
                        "300",
                        "400",
                        "500",
                        "Above 500 / PG",
                      ].map((level) => (
                        <div key={level} className="flex flex-col">
                          <label className="text-xs font-medium text-gray-600">
                            {level} Level
                          </label>
                          <input
                            type="number"
                            placeholder={` ${level}`}
                            value={
                              formData.B.avgFeeByLevel[
                                level as keyof typeof formData.B.avgFeeByLevel
                              ]
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                B: {
                                  ...prev.B,
                                  avgFeeByLevel: {
                                    ...prev.B.avgFeeByLevel,
                                    [level]: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="p-2 border rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic Calendar */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Academic Session
                    </label>
                    <input
                      type="text"
                      placeholder="Academic Session"
                      value={formData.B.academicSession}
                      onChange={(e) =>
                        handleChange("B", "academicSession", e.target.value)
                      }
                      className="p-2 border rounded"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Weeks Per Semester
                    </label>
                    <input
                      type="number"
                      placeholder="Number of Weeks per Semester"
                      value={formData.B.weeksPerSemester}
                      onChange={(e) =>
                        handleChange("B", "weeksPerSemester", e.target.value)
                      }
                      className="p-2 border rounded"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Session Start Date
                    </label>
                    <input
                      type="date"
                      placeholder="Session Start Date"
                      value={formData.B.sessionStart}
                      onChange={(e) =>
                        handleChange("B", "sessionStart", e.target.value)
                      }
                      className="p-2 border rounded"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Expected End Date
                    </label>
                    <input
                      type="date"
                      placeholder="Expected End Date"
                      value={formData.B.sessionEnd}
                      onChange={(e) =>
                        handleChange("B", "sessionEnd", e.target.value)
                      }
                      className="p-2 border rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Programmes Offered */}
              <div>
                <h3 className="font-semibold mb-2">
                  5. Programmes Offered (Tick all that apply)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    "Bachelor’s Degree",
                    "Diploma Programmes / NCE",
                    "Postgraduate Diploma (PGD)",
                    "Master’s Degree",
                    "Doctorate Degree (Ph.D.)",
                    "Professional Certifications",
                    "Other",
                  ].map((prog) => (
                    <label key={prog} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.B.programmes.includes(prog)}
                        onChange={() => toggleCheckbox("B", "programmes", prog)}
                      />
                      {prog}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section C */}
          {currentStep === 2 && (
            <div className="space-y-4 text-sm">
              {/* Method of Collection */}
              <div>
                <h3 className="font-semibold mb-2">
                  Current Method of Fee Collection (Tick all that apply):
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    "Bank Deposit",
                    "POS",
                    "Transfer",
                    "Online Portal",
                    "Cash",
                    "Other",
                  ].map((method) => (
                    <label key={method} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.C.methodOfCollection.includes(method)}
                        onChange={() =>
                          toggleCheckbox("C", "methodOfCollection", method)
                        }
                      />
                      {method}
                    </label>
                  ))}
                </div>
              </div>
              {/* Payment Gateway */}
              <div>
                <h3 className="font-semibold mb-2">
                  Do you use a payment gateway?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {["Yes", "No"].map((pay) => (
                    <label key={pay} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.C.paymentGateway.includes(pay)}
                        onChange={() =>
                          toggleCheckbox("C", "paymentGateway", pay)
                        }
                      />
                      {pay}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium">
                  If yes, which one?
                </label>
                <input
                  type="text"
                  placeholder="Name of Payment Gateway"
                  value={formData.C.currentGateway}
                  onChange={(e) =>
                    handleChange("C", "currentGateway", e.target.value)
                  }
                  className="p-2 border rounded"
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium">Partner Banks</label>
                <input
                  type="text"
                  placeholder="Name(s) of Partner Banks"
                  value={formData.C.partnerBanks}
                  onChange={(e) =>
                    handleChange("C", "partnerBanks", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  Do you generate real-time payment reports?:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {["Yes", "No"].map((yn) => (
                    <label key={yn} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.C.paymentReports.includes(yn)}
                        onChange={() =>
                          toggleCheckbox("C", "paymentReports", yn)
                        }
                      />
                      {yn}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section D */}
          {currentStep === 3 && (
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">Current Licence Status:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    "New Registration Pending",
                    "Active Licence (Valid)",
                    "Renewal Due",
                    "Expired Licence",
                  ].map((status) => (
                    <label key={status} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.D.licenceStatus.includes(status)}
                        onChange={() =>
                          toggleCheckbox("D", "licenceStatus", status)
                        }
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  Have you paid Licence/Registration Fees in the past?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {["Yes", "No"].map((yn) => (
                    <label key={yn} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.D.prevLicence.includes(yn)}
                        onChange={() => toggleCheckbox("D", "prevLicence", yn)}
                      />
                      {yn}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Amount</label>
                  <input
                    type="number"
                    placeholder="Previous Amount Paid "
                    value={formData.D.prevAmount}
                    onChange={(e) =>
                      handleChange("D", "prevAmount", e.target.value)
                    }
                    className="p-2 border rounded"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Date</label>
                  <input
                    type="date"
                    placeholder="Payment Date"
                    value={formData.D.prevDate}
                    onChange={(e) =>
                      handleChange("D", "prevDate", e.target.value)
                    }
                    className="p-2 border rounded"
                  />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  Are there any outstanding penalties/fines?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {["Yes", "No"].map((yn) => (
                    <label key={yn} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.D.outstandingPenalties.includes(yn)}
                        onChange={() =>
                          toggleCheckbox("D", "outstandingPenalties", yn)
                        }
                      />
                      {yn}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium">If yes, specify</label>
                <input
                  type="text"
                  placeholder="Name of Penalty or Fine"
                  value={formData.C.currentGateway}
                  onChange={(e) =>
                    handleChange("C", "currentGateway", e.target.value)
                  }
                  className="p-2 border rounded"
                />
              </div>
            </div>
          )}

          {/* Section E */}
          {currentStep === 4 && (
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">Name</h3>
                <input
                  type="text"
                  placeholder="Enumurator Name"
                  value={formData.E.eName}
                  onChange={(e) => handleChange("E", "eName", e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Comments</label>
                <textarea
                  value={formData.E.comments}
                  placeholder="General Observations & Remarks"
                  onChange={(e) =>
                    handleChange("E", "comments", e.target.value)
                  }
                  className="p-2 border rounded h-[23vh] resize-none"
                />
              </div>
            </div>
          )}

          {/* Section F - Congratulations */}
          {currentStep === 5 && (
            <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
              <Image
                src="/success.svg" // optional: replace with your own success icon
                alt="Success"
                width={80}
                height={80}
                className="mx-auto"
              />

              <h2 className="text-2xl font-semibold text-green-600">
                🎉 Congratulations!
              </h2>
              <p className="text-gray-700 max-w-md">
                You’ve successfully completed all sections of the Private
                Institution Registration Form. Please review your information
                and click the button below to submit your data.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 0 ? (
              <button
                onClick={prevStep}
                className="px-6 py-2 bg-gray-400 text-white rounded"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            {currentStep < sections.length - 1 ? (
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-[#28a745] text-white rounded"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded"
              >
                Submit
              </button>
            )}
          </div>
        </div>
      </main>
      <footer className="w-full bg-gray-100 border-t border-gray-300 py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center justify-between text-xs sm:text-sm text-gray-600">
          {/* Left Side */}
          <div className="flex items-center mb-4 md:mb-0 text-center md:text-left">
            © {new Date().getFullYear()} Powered by{" "}
            <span className="ml-1">
              <Image src="/paypro.png" alt="Logo" width={46} height={46} />
            </span>
            . All Rights Reserved.
          </div>

          {/* Right Side */}
          <div className="flex space-x-4">
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
            <span>|</span>
            <a href="#" className="hover:underline">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
