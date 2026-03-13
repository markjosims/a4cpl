"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StartAssessmentButton({
  assessmentId,
  existingSessionId,
  label,
}: {
  assessmentId: string;
  existingSessionId?: string;
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (existingSessionId) {
      router.push(`/dashboard/assessments/${assessmentId}/session`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/sessions`, {
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to start assessment");
      }

      router.push(`/dashboard/assessments/${assessmentId}/session`);
    } catch (error) {
      console.error("Start assessment error:", error);
      alert("Failed to start assessment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Starting..." : label}
    </button>
  );
}
