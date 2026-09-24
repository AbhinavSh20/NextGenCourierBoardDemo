export type FilterState = {
  jobTypes: string[];
  vehicles: string[];
  maxDaysAgo: number | null;
  payMin: number | null;
};

export const JOB_TYPES = ["Contract / 1099", "Owner-operator", "Full-time", "Part-time"];
export const VEHICLES = ["Bike", "Car", "Cargo Van", "Sprinter Van", "26' Box Truck"];

export const EMPTY_FILTERS: FilterState = {
  jobTypes: [],
  vehicles: [],
  maxDaysAgo: null,
  payMin: null,
};

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
        {label}
      </legend>
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
              className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function FilterFields({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Location
        </legend>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="City or zip"
            className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
          />
          <select className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]">
            <option>Within 10 miles</option>
            <option>Within 25 miles</option>
            <option>Within 50 miles</option>
          </select>
        </div>
      </fieldset>

      <FilterGroup
        label="Job type"
        options={JOB_TYPES}
        selected={filters.jobTypes}
        onToggle={(value) => onChange({ ...filters, jobTypes: toggle(filters.jobTypes, value) })}
      />

      <FilterGroup
        label="Vehicle type"
        options={VEHICLES}
        selected={filters.vehicles}
        onToggle={(value) => onChange({ ...filters, vehicles: toggle(filters.vehicles, value) })}
      />

      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Minimum pay ($/hr equivalent)
        </legend>
        <input
          type="number"
          min={0}
          placeholder="e.g. 20"
          value={filters.payMin ?? ""}
          onChange={(e) =>
            onChange({ ...filters, payMin: e.target.value === "" ? null : Number(e.target.value) })
          }
          className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
        />
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Date posted
        </legend>
        <select
          value={filters.maxDaysAgo ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              maxDaysAgo: e.target.value === "" ? null : Number(e.target.value),
            })
          }
          className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
        >
          <option value="">Any time</option>
          <option value="1">Past 24 hours</option>
          <option value="3">Past 3 days</option>
          <option value="7">Past 7 days</option>
        </select>
      </fieldset>

      <button
        type="button"
        onClick={() => onChange(EMPTY_FILTERS)}
        className="text-left text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        Clear all filters
      </button>
    </div>
  );
}

export function activeFilterCount(filters: FilterState) {
  return (
    filters.jobTypes.length +
    filters.vehicles.length +
    (filters.maxDaysAgo !== null ? 1 : 0) +
    (filters.payMin !== null ? 1 : 0)
  );
}

export default function FilterPanel({
  filters,
  onChange,
  isOpen,
  onClose,
}: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <aside className="hidden w-full max-w-[260px] shrink-0 lg:block">
        <FilterFields filters={filters} onChange={onChange} />
      </aside>

      <div
        className={`fixed inset-0 z-30 lg:hidden ${isOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!isOpen}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ease-out ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />
        <div
          className={`absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-white/40 bg-[var(--color-surface)]/90 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-xl transition-transform duration-200 ease-out ${
            isOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--color-ink)]">Filters</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="rounded-full p-1 text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            >
              ✕
            </button>
          </div>
          <FilterFields filters={filters} onChange={onChange} />
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-md bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-primary-dark)]"
          >
            Show results
          </button>
        </div>
      </div>
    </>
  );
}
