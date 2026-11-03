// lib/certificate.ts
// Whether a school's certificate is valid. (The database calls it a licence.)
//
// A certificate is issued once. The Ministry hasn't decided whether it should
// ever expire, so for now it doesn't: once Active, it stays valid, and stored
// expiry dates (for example from a licence issued before this portal) are kept
// for the record but ignored. To enforce expiry later, decide the rule, set
// this to true, set expiry dates in activateLicense, and adjust the check below.
// Every validity decision goes through this file.
export const CERTIFICATE_EXPIRY_ENFORCED = false;

export type CertificateState = "valid" | "expired" | "none";

export function getCertificateState(school: {
  license_status: string | null;
  license_expiry_date: string | Date | null;
}): CertificateState {
  if (school.license_status !== "Active") return "none";
  if (
    CERTIFICATE_EXPIRY_ENFORCED &&
    school.license_expiry_date &&
    new Date(school.license_expiry_date) < new Date()
  ) {
    return "expired";
  }
  return "valid";
}

// The expiry date to show anyone, or null for "does not expire"
export function getDisplayedExpiry(school: {
  license_expiry_date: string | Date | null;
}) {
  return CERTIFICATE_EXPIRY_ENFORCED ? school.license_expiry_date : null;
}
