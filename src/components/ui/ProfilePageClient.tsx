// components/ProfilePageClient.tsx
// this is simply to handle interactivity
"use client";

import { useState } from "react";
import SchoolProfileView from "@/components/ui/SchoolProfileView";
import SchoolProfileForm from "@/components/ui/SchoolProfileForm";
import { School } from "@/lib/types"; // Import the type

export default function ProfilePageClient({ school }: { school: School }) {
  const [isEditing, setIsEditing] = useState(false);

  if (school.form_status !== "completed" || isEditing) {
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
        <SchoolProfileForm />
      </div>
    );
  }

  return (
    <SchoolProfileView schoolData={school} onEdit={() => setIsEditing(true)} />
  );
}
