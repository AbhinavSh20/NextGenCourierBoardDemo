type IconProps = { className?: string };

const base = "h-3.5 w-3.5 shrink-0";

export function LocationPinIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  );
}

export function ClockIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

export function PayIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 15.5c0 1 1 1.8 2.5 1.8s2.5-.7 2.5-1.7c0-2.5-5-1.2-5-3.7 0-1 1-1.7 2.5-1.7s2.5.7 2.5 1.7M12 7.3v9.4" />
    </svg>
  );
}

export function BikeIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M5.5 17.5 9 10h5l4 7.5M9 10l2.5-3.5H14M13 10l1.5 3" />
    </svg>
  );
}

export function CarIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path d="M4 16V12l2-5h12l2 5v4" />
      <path d="M4 16h16M4 16a1.5 1.5 0 0 0 3 0M17 16a1.5 1.5 0 0 0 3 0" />
    </svg>
  );
}

export function VanIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <rect x="3" y="7" width="14" height="9" rx="1.5" />
      <path d="M17 10h2.5L22 13v3h-5" />
      <circle cx="7.5" cy="18" r="1.7" />
      <circle cx="17.5" cy="18" r="1.7" />
    </svg>
  );
}

export function TruckIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <rect x="2" y="6" width="12" height="10" rx="1" />
      <path d="M14 10h4l3.5 3.5V16H14" />
      <circle cx="6.5" cy="18" r="1.7" />
      <circle cx="17.5" cy="18" r="1.7" />
    </svg>
  );
}

export function PhoneIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path d="M5 4h3.5l1.5 4.5L7.5 10a11 11 0 0 0 6.5 6.5L15.5 14l4.5 1.5V19a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

export function MessageIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path d="M4 5h16v11H8l-4 4V5z" />
    </svg>
  );
}

export function vehicleIcon(vehicle: string, className?: string) {
  const v = vehicle.toLowerCase();
  if (v.includes("bike")) return <BikeIcon className={className} />;
  if (v.includes("van")) return <VanIcon className={className} />;
  if (v.includes("truck")) return <TruckIcon className={className} />;
  return <CarIcon className={className} />;
}
