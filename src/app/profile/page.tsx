"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const VEHICLES = ["Bike", "Car", "Cargo Van", "Sprinter Van", "26' Box Truck"];

export default function ProfileOverviewPage() {
  const { name } = useAuth();
  const [vehicle, setVehicle] = useState(VEHICLES[2]);
  const [licensed, setLicensed] = useState(true);
  const [insured, setInsured] = useState(true);
  const [blurb, setBlurb] = useState("");
  const [saved, setSaved] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(true);
      }}
      className="flex flex-col gap-4"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[var(--color-ink)]">Name</span>
        <input
          type="text"
          defaultValue={name || "Driver"}
          className="rounded-md border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[var(--color-ink)]">Vehicle type</span>
        <select
          value={vehicle}
          onChange={(e) => setVehicle(e.target.value)}
          className="rounded-md border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
        >
          {VEHICLES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
          <input
            type="checkbox"
            checked={licensed}
            onChange={(e) => setLicensed(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          Valid driver&apos;s license
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
          <input
            type="checkbox"
            checked={insured}
            onChange={(e) => setInsured(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          Vehicle insured
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[var(--color-ink)]">Experience</span>
        <textarea
          rows={4}
          value={blurb}
          onChange={(e) => setBlurb(e.target.value)}
          placeholder="2 years delivering for a regional courier company..."
          className="rounded-md border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
        />
      </label>

      <button
        type="submit"
        className="w-fit rounded-md bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-primary-dark)]"
      >
        Save profile
      </button>
      {saved && <p className="text-sm text-[var(--color-success-ink)]">Profile saved.</p>}
    </form>
  );
}
