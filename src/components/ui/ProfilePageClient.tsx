"use client";

import { useState } from "react";
import SchoolProfileView from "@/components/ui/SchoolProfileView";
import SchoolProfileForm from "@/components/ui/SchoolProfileForm";
import LicenseModal from "@/components/ui/LicenseModal"; // ← add this once you have the modal
import { School } from "@/lib/types";

export default function ProfilePageClient({ school }: { school: School }) {
  const [isEditing, setIsEditing] = useState(false);

  // ── Check 1: form not complete → show form ──────────────────────────────────
  if (school.form_status !== "complete" || isEditing) {
    return (
      <div>
        {isEditing && (
          <button
            onClick={() => setIsEditing(false)}
            className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            ← Back to Profile View
          </button>
        )}
        <SchoolProfileForm schoolData={school} />
      </div>
    );
  }

  // ── Check 2: says it holds a certificate but hasn't entered it → show modal ──
  // Admin checks these details at approval before confirming the certificate.
  const hasNoLicense =
    !school.license_number &&
    (school.license_claim === "Active" || school.license_claim === "Expired");

  return (
    <div>
      {hasNoLicense && <LicenseModal schoolId={school.school_id} />}
      <SchoolProfileView
        schoolData={school}
        onEdit={() => setIsEditing(true)}
      />
    </div>
  );
}
