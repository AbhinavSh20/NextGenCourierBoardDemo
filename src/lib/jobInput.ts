export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export type NewJob = {
  title: string;
  company: string;
  location: string;
  pay: string;
  payValue: number;
  type: string;
  vehicle: string;
  description: string;
  requirements: string[];
  openings: number;
  voiceRoute: string | null;
  textRoute: string | null;
  externalRef: string | null;
  expiresInDays: number;
};

export type JobPatch = {
  status?: "live" | "closed" | "expired";
  renew?: boolean;
  expiresInDays?: number;
  title?: string;
  company?: string;
  location?: string;
  pay?: string;
  payValue?: number;
  type?: string;
  vehicle?: string;
  description?: string;
  requirements?: string[];
  openings?: number;
  voiceRoute?: string | null;
  textRoute?: string | null;
};

const EDITABLE_TEXT = [
  ["title", 200],
  ["company", 200],
  ["location", 200],
  ["pay", 100],
  ["type", 100],
  ["vehicle", 100],
  ["description", 5000],
] as const;

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function text(body: Record<string, unknown>, key: string, max: number, required: boolean, fallback = "") {
  const raw = body[key];
  if (raw === undefined || raw === null || raw === "") {
    return required ? fail(`${key} is required`) : { ok: true as const, value: fallback };
  }
  if (typeof raw !== "string") return fail(`${key} must be a string`);
  const value = raw.trim();
  if (!value && required) return fail(`${key} is required`);
  if (value.length > max) return fail(`${key} must be at most ${max} characters`);
  return { ok: true as const, value };
}

function intInRange(body: Record<string, unknown>, key: string, min: number, max: number, fallback: number) {
  const raw = body[key];
  if (raw === undefined) return { ok: true as const, value: fallback };
  if (typeof raw !== "number" || !Number.isInteger(raw) || raw < min || raw > max) {
    return fail(`${key} must be an integer from ${min} to ${max}`);
  }
  return { ok: true as const, value: raw };
}

function route(body: Record<string, unknown>, key: string, scheme: "tel" | "sms") {
  const raw = body[key];
  if (raw === undefined || raw === null || raw === "") return { ok: true as const, value: null };
  if (typeof raw !== "string" || !new RegExp(`^${scheme}:\\+?[\\d\\s().-]{3,30}$`).test(raw.trim())) {
    return fail(`${key} must be a ${scheme}: link`);
  }
  return { ok: true as const, value: raw.trim() };
}

export function derivePayValue(pay: string): number {
  const nums = (pay.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((n) => Number(n.replace(/,/g, "")));
  if (nums.length === 0) return 0;
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  const perHour = /\/\s*w(?:ee)?k/i.test(pay)
    ? avg / 40
    : /\/\s*(?:yr|year)/i.test(pay)
      ? avg / 2080
      : /\/\s*day/i.test(pay)
        ? avg / 8
        : avg;
  return Math.round(perHour);
}

// The platform's API tool builder has no array type, so accept newline-separated text too.
function requirementsList(raw: unknown): Result<string[]> {
  const list = typeof raw === "string" ? raw.split("\n").map((line) => line.trim()).filter(Boolean) : raw;
  if (!Array.isArray(list) || list.length > 20 || !list.every((x) => typeof x === "string" && x.trim() && x.length <= 300)) {
    return fail("requirements must be an array of up to 20 short strings");
  }
  return { ok: true, value: list.map((x: string) => x.trim()) };
}

function payValueOf(body: Record<string, unknown>, fallback: number): Result<number> {
  if (body.payValue === undefined) return { ok: true, value: fallback };
  const p = body.payValue;
  if (typeof p !== "number" || !Number.isFinite(p) || p < 0) return fail("payValue must be a non-negative number");
  return { ok: true, value: Math.round(p) };
}

export function parseNewJob(body: unknown): Result<NewJob> {
  if (!isRecord(body)) return fail("Body must be a JSON object");

  const title = text(body, "title", 200, true);
  if (!title.ok) return title;
  const company = text(body, "company", 200, true);
  if (!company.ok) return company;
  const location = text(body, "location", 200, true);
  if (!location.ok) return location;
  const pay = text(body, "pay", 100, true);
  if (!pay.ok) return pay;
  const type = text(body, "type", 100, false, "Contract / 1099");
  if (!type.ok) return type;
  const vehicle = text(body, "vehicle", 100, false, "Any");
  if (!vehicle.ok) return vehicle;
  const description = text(body, "description", 5000, false);
  if (!description.ok) return description;
  const externalRef = text(body, "externalRef", 200, false);
  if (!externalRef.ok) return externalRef;

  const openings = intInRange(body, "openings", 1, 99, 1);
  if (!openings.ok) return openings;
  const expiresInDays = intInRange(body, "expiresInDays", 1, 365, 30);
  if (!expiresInDays.ok) return expiresInDays;

  const voiceRoute = route(body, "voiceRoute", "tel");
  if (!voiceRoute.ok) return voiceRoute;
  const textRoute = route(body, "textRoute", "sms");
  if (!textRoute.ok) return textRoute;

  let requirements: string[] = [];
  if (body.requirements !== undefined) {
    const r = requirementsList(body.requirements);
    if (!r.ok) return r;
    requirements = r.value;
  }

  const payValue = payValueOf(body, derivePayValue(pay.value));
  if (!payValue.ok) return payValue;

  return {
    ok: true,
    value: {
      title: title.value,
      company: company.value,
      location: location.value,
      pay: pay.value,
      payValue: payValue.value,
      type: type.value,
      vehicle: vehicle.value,
      description: description.value,
      requirements,
      openings: openings.value,
      voiceRoute: voiceRoute.value,
      textRoute: textRoute.value,
      externalRef: externalRef.value || null,
      expiresInDays: expiresInDays.value,
    },
  };
}

export function parseJobPatch(body: unknown): Result<JobPatch> {
  if (!isRecord(body)) return fail("Body must be a JSON object");

  const patch: JobPatch = {};

  if (body.status !== undefined) {
    if (body.status !== "live" && body.status !== "closed" && body.status !== "expired") {
      return fail("status must be live, closed or expired");
    }
    patch.status = body.status;
  }
  if (body.renew !== undefined) {
    if (typeof body.renew !== "boolean") return fail("renew must be a boolean");
    if (body.renew) patch.renew = true;
  }
  if (body.expiresInDays !== undefined) {
    const days = intInRange(body, "expiresInDays", 1, 365, 30);
    if (!days.ok) return days;
    if (patch.renew) patch.expiresInDays = days.value;
  }

  // Empty strings are skipped so an unfilled tool argument cannot blank a field.
  for (const [key, max] of EDITABLE_TEXT) {
    const raw = body[key];
    if (raw === undefined || raw === null || raw === "") continue;
    const value = text(body, key, max, true);
    if (!value.ok) return value;
    patch[key] = value.value;
  }
  if (patch.pay !== undefined) {
    const payValue = payValueOf(body, derivePayValue(patch.pay));
    if (!payValue.ok) return payValue;
    patch.payValue = payValue.value;
  }

  if (body.openings !== undefined) {
    const openings = intInRange(body, "openings", 1, 99, 1);
    if (!openings.ok) return openings;
    patch.openings = openings.value;
  }
  if (body.requirements !== undefined && body.requirements !== "") {
    const requirements = requirementsList(body.requirements);
    if (!requirements.ok) return requirements;
    patch.requirements = requirements.value;
  }
  for (const [key, scheme] of [["voiceRoute", "tel"], ["textRoute", "sms"]] as const) {
    if (body[key] === undefined || body[key] === "") continue;
    const value = body[key] === null ? { ok: true as const, value: null } : route(body, key, scheme);
    if (!value.ok) return value;
    patch[key] = value.value;
  }

  if (Object.keys(patch).length === 0) return fail("Provide at least one field to change");
  if (patch.renew && patch.status !== undefined && patch.status !== "live") {
    return fail("Cannot renew into a non-live status");
  }
  return { ok: true, value: patch };
}
