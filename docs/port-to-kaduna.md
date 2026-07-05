# Porting Gombe UI & Bug Fixes to Kaduna Instance

Changes made in the Gombe (`gombe-privateuni`) instance that must be replicated
in the Kaduna (`KD_Project`) instance. Apply them in the order listed.

---

## 1. Bug Fix — `form_status` Premature Completion

**File:** `src/app/api/schools/profile/route.ts`

**Problem:** The profile save route hardcoded `form_status = 'complete'` on every
save, so even a partial test-save pushed the school into the admin's pending-approval
queue immediately.

**Fix:** Compute the status server-side before the query. Only set `'complete'` when
every required section has its minimum fields; otherwise set `'pending'`.

```ts
// Insert this block just before the pool.query call
const generalOk = !!(proprietorName && contact_person && category);
const academicOk = !!(modeOfOperation?.length && programmes?.length);
const infraOk = !!(labStatus && libraryStatus); // adapt field names to Kaduna
const licenseOk = !!license_status;
const newFormStatus =
  generalOk && academicOk && infraOk && licenseOk ? "complete" : "pending";
```

In the SQL, replace the hardcoded literal with the next available `$N` placeholder:

```sql
-- Before
form_status = 'complete',

-- After (use whichever $N is next in your query)
form_status = $N,
```

Add `newFormStatus` as the last entry in the params array.

> **Kaduna note:** Kaduna's form sections are different — adjust the `*Ok` checks
> to match its actual required fields.

---

## 2. UI — Horizontal Stepper replacing Vertical Accordion

**File:** `src/components/ui/SchoolProfileForm.tsx`

### What changed

| Before                                           | After                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| Each section is a collapsible accordion panel    | One content card; steps shown as a horizontal numbered nav at the top |
| Clicking a section header toggles it open/closed | Clicking a step circle or Previous/Next buttons moves between steps   |
| `activeSection` defaults to `null` (all closed)  | `activeSection` defaults to the first step id (first step auto-open)  |
| Cancel + Save buttons at the bottom              | Previous · Save Profile · Next buttons at the bottom                  |

### Implementation steps

**a) Add React import** (needed for keyed `React.Fragment` in stepper map):

```ts
import React, { useState, useEffect } from "react";
```

**b) Change `activeSection` default:**

```ts
const [activeSection, setActiveSection] = useState<string | null>("general");
// replace "general" with whatever your first step id is
```

**c) Add STEPS array + helpers** (place after your section-completion checks,
before the `return`):

```ts
const STEPS = [
  { id: "general", label: "General Info" },
  { id: "academic", label: "Academic" },
  { id: "infrastructure", label: "Facilities" }, // include only if Kaduna has this section --> it does not have this at this tiem
  { id: "people", label: "People" }, // include only if Kaduna has this section
  { id: "license", label: "Certificate" },
] as const;
type StepId = (typeof STEPS)[number]["id"];

const stepComplete: Record<StepId, boolean> = {
  general: !!isGeneralComplete,
  academic: !!isAcademicComplete,
  infrastructure: !!isInfrastructureComplete,
  people: !!isPeopleComplete, // remove if Kaduna has no People section
  license: !!isLicenseComplete,
};

const currentStepIndex = STEPS.findIndex((s) => s.id === activeSection);
const prevStep = () => {
  if (currentStepIndex > 0) setActiveSection(STEPS[currentStepIndex - 1].id);
};
const nextStep = () => {
  if (currentStepIndex < STEPS.length - 1)
    setActiveSection(STEPS[currentStepIndex + 1].id);
};
```

**d) Replace the return statement structure.**

Remove: the large header card, all accordion section wrappers (`<div><button>header</button>{activeSection === "..." && ...}</div>`).

Add the following scaffold around the existing field JSX (keep field JSX untouched):

```tsx
return (
  <div className="max-w-6xl mx-auto">
    {/* Compact header */}
    <div className="bg-white rounded-xl px-6 py-4 mb-4 border border-gray-200 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold text-gray-900">
          Update School Profile
        </h1>
        <p className="text-xs text-gray-500">
          Complete all sections to submit your institution's information
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 transform -rotate-90">
            <circle
              cx="28"
              cy="28"
              r="22"
              stroke="rgba(7,234,37,0.2)"
              strokeWidth="5"
              fill="none"
            />
            <circle
              cx="28"
              cy="28"
              r="22"
              stroke="#16a34a"
              strokeWidth="5"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - completionPercentage / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-900">
              {completionPercentage}%
            </span>
          </div>
        </div>
        <span className="text-xs text-gray-500">Complete</span>
      </div>
    </div>

    {/* Horizontal Stepper */}
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 mb-4">
      <div className="flex items-center">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <button
              type="button"
              onClick={() => setActiveSection(step.id)}
              className="flex flex-col items-center gap-1 group flex-1 min-w-0"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  activeSection === step.id
                    ? "bg-green-600 text-white shadow-md"
                    : stepComplete[step.id]
                      ? "bg-green-100 text-green-700 border-2 border-green-500"
                      : "bg-gray-100 text-gray-400 border-2 border-gray-200 group-hover:border-gray-400"
                }`}
              >
                {stepComplete[step.id] && activeSection !== step.id ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={`text-xs font-medium text-center leading-tight px-1 ${
                  activeSection === step.id
                    ? "text-green-700 font-semibold"
                    : stepComplete[step.id]
                      ? "text-green-600"
                      : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </button>
            {index < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-[0.3] mx-1 mb-4 rounded transition-colors ${
                  stepComplete[step.id] ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>

    <form className="space-y-4">
      {/* Single content card — all section content lives here */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {activeSection === "general" && (
          <div className="p-6">
            {/* Section description */}
            <div className="mb-5 pb-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">
                General Information
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Basic school details, ownership, and contact person
              </p>
            </div>
            {/* ... existing general fields unchanged ... */}
          </div>
        )}

        {activeSection === "academic" && (
          <div className="p-6 space-y-6">
            <div className="pb-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">
                Academic Information
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Mode of operation, programmes, fees, and academic calendar
              </p>
            </div>
            {/* ... existing academic fields unchanged ... */}
          </div>
        )}

        {/* repeat pattern for each section */}
      </div>

      {/* Step navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStepIndex <= 0}
          className="px-5 py-2.5 border-2 text-sm border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="px-8 py-2.5 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Profile
            </>
          )}
        </button>
        <button
          type="button"
          onClick={nextStep}
          disabled={currentStepIndex >= STEPS.length - 1}
          className="px-5 py-2.5 border-2 text-sm border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </form>
  </div>
);
```

**e) Remove unused imports** — after removing accordion headers, check whether
`Building`, `Users`, `FileText` (or Kaduna equivalents) are still referenced
anywhere. Remove any that are not.

---

## 3. Section Description Headers

Inside each section's content `<div className="p-6...">`, add a small header
block **before** the field grids:

```tsx
<div className="mb-5 pb-4 border-b border-gray-100">
  <h2 className="text-sm font-bold text-gray-800">Section Title Here</h2>
  <p className="text-xs text-gray-500 mt-0.5">
    One-line description of what the section collects
  </p>
</div>
```

For sections that already start with status banners (e.g. academic re-approval banner),
place this block **before** the banners.

---

## 4. Profile View Redesign — `SchoolProfileView.tsx`

### What changed

| Before                                                       | After                                                                         |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| "Profile incomplete" blocks the entire view                  | Shows as an amber badge in the header; saved data remains readable            |
| 3 tabs: Overview / Academic Info / Consent Certificate & Tax | Tab bar matches the form's sections (adapt to Kaduna's sections)              |
| Fields displayed with `<p>` labels and values                | `Field` + `SectionTitle` helper components for consistent typography          |
| Courses shown as uniform orange cards                        | Course pills are green (Accredited) or red (Not Accredited) matching the form |

### Reusable helper components

Add these two helpers near the top of the file (before the default export):

```tsx
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <div className="text-sm font-semibold text-gray-900">{value || "—"}</div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="pb-3 mb-5 border-b border-gray-100">
      <h2 className="text-sm font-bold text-gray-700">{title}</h2>
    </div>
  );
}
```

### Header (replace existing header card)

```tsx
<div className="bg-white rounded-xl border border-gray-200 px-6 py-4 flex items-center justify-between">
  <div>
    <h1 className="text-lg font-bold text-gray-900">School Profile</h1>
    <p className="text-xs text-gray-400 mt-0.5">
      Last updated: {formatDate(schoolData?.updated_at)}
    </p>
  </div>
  <div className="flex items-center gap-3">
    {incomplete && (
      <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
        <AlertCircle className="w-3.5 h-3.5" />
        Profile incomplete
      </span>
    )}
    {!incomplete && (
      <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
        <CheckCircle className="w-3.5 h-3.5" />
        Profile complete
      </span>
    )}
    {onEdit && (
      <button
        onClick={onEdit}
        className="flex items-center gap-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-all"
      >
        <Edit className="w-4 h-4" />
        Edit Profile
      </button>
    )}
  </div>
</div>
```

### Tab bar (replace existing tabs)

Define Kaduna's tabs (no Facilities or People):

```ts
const TABS = [
  { id: "general", label: "General" },
  { id: "academic", label: "Academic" },
  { id: "certificate", label: "Certificate" },
] as const;
type TabId = (typeof TABS)[number]["id"];
```

Render:

```tsx
<div className="bg-white rounded-xl border border-gray-200 px-4 py-2 flex gap-1">
  {TABS.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
        activeTab === tab.id
          ? "bg-green-600 text-white shadow-sm"
          : "text-gray-500 hover:bg-gray-100"
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>
```

### Course pills (Academic tab)

Replace the uniform orange course cards with colour-coded accreditation pills:

```tsx
{
  courses.map((course, i) => (
    <span
      key={i}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
        course.accredited
          ? "bg-green-50 border-green-200 text-green-800"
          : "bg-red-50 border-red-200 text-red-800"
      }`}
    >
      {course.name}
      <span
        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
          course.accredited
            ? "bg-green-200 text-green-800"
            : "bg-red-200 text-red-800"
        }`}
      >
        {course.accredited ? "Accredited" : "Not Accredited"}
      </span>
    </span>
  ));
}
```

Also add the accreditation summary counts above the list:

```tsx
<div className="flex gap-4 text-xs font-semibold text-gray-400 mb-3">
  <span className="flex items-center gap-1">
    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
    Accredited: {courses.filter((c) => c.accredited).length}
  </span>
  <span className="flex items-center gap-1">
    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
    Not Accredited: {courses.filter((c) => !c.accredited).length}
  </span>
</div>
```

### Imports to add / remove

```ts
// Add
import { Edit, CheckCircle, AlertCircle } from "lucide-react";

// Remove (no longer used as section-header icons)
// Building, Users, FileText, Calendar, Award
```

---

## 5. Approval-Pending Banner & Nav Locks

**Files:** `src/components/SchoolShelllayout.tsx`, `src/components/Navigation.tsx`

### What it does

When a school's `approval_status` is not `"approved"`, the portal:

1. Shows a persistent amber banner below the top bar telling the institution they are awaiting admin approval and that some features are restricted.
2. Renders restricted nav items as non-clickable `<div>`s (instead of `<Link>`s) with a lock icon and 50% opacity. Hovering shows a tooltip: "Available after approval".

Overview and Profile remain fully accessible so the school can still fill in their profile while pending.

---

### SchoolShell changes (`SchoolShelllayout.tsx`)

Add `approvalStatus` state and fetch it alongside the existing `form-status` check:

```tsx
import { Clock } from "lucide-react";

// inside the component, alongside existing state:
const [approvalStatus, setApprovalStatus] = useState<string | null>(null);

// inside the useEffect, alongside checkFormStatus():
async function fetchApprovalStatus() {
  try {
    const res = await fetch(`/api/schools/${encodeURIComponent(institution)}`);
    if (res.ok) {
      const data = await res.json();
      setApprovalStatus(data.approval_status ?? "pending");
    }
  } catch {
    // silently skip — banner just won't show
  }
}
fetchApprovalStatus();
```

Derive flags and pass `isApproved` to `Navigation`:

```tsx
// Treat null (still loading) as approved — prevents lock icons flashing on refresh
const isApproved = approvalStatus === null || approvalStatus === "approved";
const showBanner = approvalStatus !== null && !isApproved;

// on Navigation:
<Navigation
  collapsed={collapsed}
  setCollapsed={setCollapsed}
  isApproved={isApproved}
/>;
```

Render the banner between the sidebar and the `<main>` content:

```tsx
{
  showBanner && (
    <div
      className={`fixed z-20 right-0 transition-all duration-300 ${
        collapsed ? "left-0 lg:left-20" : "left-0 lg:left-72"
      }`}
      style={{ top: "64px" }}
    >
      <div className="flex items-center gap-3 px-5 py-2.5 bg-amber-50 border-b border-amber-200">
        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-xs font-semibold text-amber-800">
          Your institution is awaiting admin approval. Some features are
          restricted until approval is granted.
        </p>
      </div>
    </div>
  );
}
```

Shift content down when the banner is visible:

```tsx
<div className={`${showBanner ? "pt-28 lg:pt-32" : "pt-16 lg:pt-20"}`}>
```

---

### Navigation changes (`Navigation.tsx`)

Add the `Lock` import and `isApproved` prop:

```tsx
import { Lock } from "lucide-react";

interface NavigationProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  isApproved?: boolean; // defaults to true
}

const Navigation: React.FC<NavigationProps> = ({
  collapsed,
  setCollapsed,
  isApproved = true,
}) => { ... }
```

Add `requiresApproval` to each nav item:

```ts
const navItems = [
  { href: "/home",       label: "Overview",            requiresApproval: false, icon: ... },
  { href: "/assessment", label: "Assessment",           requiresApproval: true,  icon: ... },
  { href: "/fees",       label: "Compliance Standing",  requiresApproval: true,  icon: ... },
  { href: "/Invoices",   label: "Demand Notices",       requiresApproval: true,  icon: ... },
  { href: "/history",    label: "Transactions",         requiresApproval: true,  icon: ... },
  // adapt href/label to Kaduna's nav items
];
```

Replace the `<Link>` render with a conditional that blocks locked items:

```tsx
{
  navItems.map((item) => {
    const isActive = pathname === item.href;
    const locked = item.requiresApproval && !isApproved;

    const sharedClass = `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
      locked
        ? "opacity-50 cursor-not-allowed text-gray-400"
        : isActive
          ? "bg-green-600 text-white shadow-md"
          : "text-gray-700 hover:bg-gray-100"
    } ${collapsed ? "justify-center" : ""}`;

    const content = (
      <>
        <span
          className={`flex-shrink-0 ${
            locked
              ? "text-gray-400"
              : isActive
                ? "text-white"
                : "text-gray-500 group-hover:text-green-600"
          }`}
        >
          {item.icon}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 font-medium text-sm">{item.label}</span>
            {locked && <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
          </>
        )}
        {/* Tooltip */}
        {(collapsed || locked) && (
          <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            {locked ? "Available after approval" : item.label}
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45" />
          </div>
        )}
      </>
    );

    return locked ? (
      <div key={item.href} className={sharedClass}>
        {content}
      </div>
    ) : (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setIsMobileOpen(false)}
        className={sharedClass}
      >
        {content}
      </Link>
    );
  });
}
```

> **Kaduna note:** The nav item hrefs and labels will differ — just set `requiresApproval: true` on whichever items should be locked pre-approval, and `requiresApproval: false` on Overview and Profile.

---

## 6. Bug Fix — `form_status` Flipping to `"pending"` After Approval

**File:** `src/app/api/schools/profile/route.ts`

**Problem:** The profile save route recalculates `form_status` from scratch on every
save. An already-approved school editing a non-academic field (e.g. adding staff) can
inadvertently flip `form_status` back to `"pending"` if not all section fields are
included in that particular save payload. This is misleading — it looks like something
is awaiting review when it is not.

**Root cause:** The existing `newFormStatus` calculation only checks field presence in
the current request body. A partial save (one section at a time) will fail checks for
other sections and produce `"pending"` even though the school is fully approved.

**Fix:** In the SQL `UPDATE`, guard the `form_status` column so that an approved school
always keeps `'complete'`, and only unapproved schools get the recalculated value:

```sql
-- Before
form_status = $35,

-- After
form_status = CASE WHEN approval_status = 'approved' THEN 'complete' ELSE $35 END,
```

No change to the TypeScript recalculation logic above the query — `$35` (or whichever
param number `newFormStatus` maps to) is still passed in the params array; the SQL
`CASE` just ignores it for approved schools.

> **Kaduna note:** Apply the same `CASE WHEN` guard to whatever `form_status` column
> update exists in Kaduna's profile save route.

---

## 7. Kaduna-specific notes

- Kaduna does not have the People or Facilities sections — skip those tabs entirely.
- The `completionPercentage` divisor in the form must match the number of sections
  Kaduna has (e.g. 3 if only General, Academic, Certificate).
- Kaduna branding: keep existing colour tokens — only structural layout changes.
- **Courses — no accreditation in Kaduna.** Gombe courses carry `{ name, accredited }`.
  Kaduna courses are plain strings (or `{ name }` only). Do not port the colour-coded
  accreditation pills or the Accredited / Not Accredited summary counts (Section 4).
  Render courses as simple uniform pills instead.
