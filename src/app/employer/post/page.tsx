"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import JobCard from "@/components/JobCard";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import type { Job } from "@/data/jobs";

const JOB_TYPES = ["Contract / 1099", "Owner-operator", "Full-time", "Part-time"];
const VEHICLES = ["Bike", "Car", "Cargo Van", "Sprinter Van", "26' Box Truck"];

export default function PostJobPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState(JOB_TYPES[0]);
  const [vehicle, setVehicle] = useState(VEHICLES[0]);
  const [pay, setPay] = useState("");
  const [description, setDescription] = useState("");
  const [requirementsText, setRequirementsText] = useState("");
  const [savedDraft, setSavedDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const titleError = title.trim() === "";

  const preview: Job = {
    id: "preview",
    title: title || "Job title",
    company: company || "Your company",
    location: location || "City, State",
    pay: pay || "$0/hr",
    payValue: 0,
    type,
    vehicle,
    postedAt: "just now",
    postedDaysAgo: 0,
    isNew: true,
    description: description || "Job description will appear here.",
    requirements: requirementsText
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean),
    status: "live",
    applicantCount: 0,
  };

  function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setPublishing(true);
    signIn("employer", company || "Employer");
    // ponytail: no real backend — simulate the publish round-trip so the loading state is honest
    setTimeout(() => {
      toast(`${title || "Job"} published`);
      router.push("/employer/dashboard");
    }, 500);
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-6 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="mb-1 text-lg font-bold text-[var(--color-ink)]">Post a job</h1>
        <p className="mb-6 text-sm text-[var(--color-ink-soft)]">
          Fill in the details below — a live preview updates on the right.
        </p>

        <form onSubmit={handlePublish} className="flex flex-col gap-6">
          <FormSection title="Basic info">
            <Field
              label="Job title"
              value={title}
              onChange={setTitle}
              placeholder="Same-Day Delivery Driver"
              required
              error={titleError ? "Job title is required" : undefined}
            />
            <Field label="Company name" value={company} onChange={setCompany} placeholder="Rapid Route Logistics" required />
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Job type" value={type} onChange={setType} options={JOB_TYPES} />
              <SelectField label="Vehicle type" value={vehicle} onChange={setVehicle} options={VEHICLES} />
            </div>
          </FormSection>

          <FormSection title="Location">
            <Field label="City, State" value={location} onChange={setLocation} placeholder="Denver, CO" required />
          </FormSection>

          <FormSection title="Compensation">
            <Field label="Pay" value={pay} onChange={setPay} placeholder="$22–26/hr" required />
          </FormSection>

          <FormSection title="Description">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[var(--color-ink)]">Job description</span>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the route, schedule, and day-to-day work."
                className="rounded-md border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
              />
            </label>
          </FormSection>

          <FormSection title="Requirements">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                One requirement per line
              </span>
              <textarea
                rows={4}
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
                placeholder={"Valid driver's license\nOwn cargo van (2015+)"}
                className="rounded-md border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
              />
            </label>
          </FormSection>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setSavedDraft(true);
                toast("Draft saved");
              }}
              disabled={publishing}
              className="flex-1 rounded-md border border-[var(--color-border)] py-2.5 text-sm font-semibold text-[var(--color-ink)] transition-colors duration-150 ease-out hover:border-[var(--color-primary)] disabled:opacity-60"
            >
              Save as draft
            </button>
            <button
              type="submit"
              disabled={publishing}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
            >
              {publishing && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {publishing ? "Publishing…" : "Publish"}
            </button>
          </div>
          {savedDraft && (
            <p className="text-sm text-[var(--color-success-ink)]">Draft saved. It won&apos;t be visible to job seekers until published.</p>
          )}
        </form>
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Live preview
        </p>
        <JobCard job={preview} />
      </div>
    </main>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
  error?: string;
}) {
  const [touched, setTouched] = useState(false);
  const showError = touched && error;
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
      <input
        type="text"
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        aria-invalid={showError ? true : undefined}
        placeholder={placeholder}
        className={`rounded-md border px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] ${
          showError ? "border-red-400" : "border-[var(--color-border)]"
        }`}
      />
      {showError && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
