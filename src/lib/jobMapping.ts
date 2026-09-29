import type { Job } from "@/data/jobs";

export type JobRecord = {
  id: string;
  title: string;
  company: string;
  location: string;
  pay: string;
  payValue: number;
  type: string;
  vehicle: string;
  description: string;
  requirements: string[];
  status: Job["status"];
  openings: number;
  voiceRoute: string | null;
  textRoute: string | null;
  createdAt: Date;
  renewedAt: Date | null;
  expiresAt: Date | null;
};

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function ago(ms: number): string {
  const mins = Math.max(0, Math.floor(ms / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function toJob(r: JobRecord, now = Date.now()): Job {
  const age = Math.max(0, now - r.createdAt.getTime());

  return {
    id: r.id,
    title: r.title,
    company: r.company,
    location: r.location,
    pay: r.pay,
    payValue: r.payValue,
    type: r.type,
    vehicle: r.vehicle,
    description: r.description,
    requirements: r.requirements,
    status: r.status === "live" && r.expiresAt && r.expiresAt.getTime() <= now ? "expired" : r.status,
    openings: r.openings,
    applicantCount: 0,
    postedAt: ago(age),
    postedDaysAgo: age / DAY,
    isNew: age < DAY,
    ...(r.renewedAt && { renewedAt: `renewed ${ago(now - r.renewedAt.getTime())}` }),
    ...(r.expiresAt && {
      expiresAt:
        r.expiresAt.getTime() <= now ? "expired" : `expires in ${Math.ceil((r.expiresAt.getTime() - now) / DAY)}d`,
    }),
    ...(r.voiceRoute && { voiceRoute: r.voiceRoute }),
    ...(r.textRoute && { textRoute: r.textRoute }),
  };
}
