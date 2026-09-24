export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  pay: string;
  payValue: number;
  type: string;
  vehicle: string;
  postedAt: string;
  postedDaysAgo: number;
  isNew?: boolean;
  description: string;
  requirements: string[];
  status: "live" | "closed";
  applicantCount: number;
};

const APPLICANT_COUNTS = [12, 8, 3, 20, 5, 7, 15, 9];

const JOB_BASE: Omit<Job, "status" | "applicantCount">[] = [
  {
    id: "1",
    title: "Same-Day Delivery Driver",
    company: "Rapid Route Logistics",
    location: "Denver, CO",
    pay: "$22–26/hr",
    payValue: 24,
    type: "Contract / 1099",
    vehicle: "Cargo Van",
    postedAt: "2h ago",
    postedDaysAgo: 0.08,
    isNew: true,
    description:
      "Deliver same-day parcels across the Denver metro on a set daily route. Most shifts run 8am–4pm with 20–35 stops.",
    requirements: [
      "Valid driver's license, clean MVR",
      "Own or lease a cargo van (2015+)",
      "Smartphone for route app",
      "Able to lift up to 50 lbs",
    ],
  },
  {
    id: "2",
    title: "Owner-Operator — Box Truck",
    company: "Summit Freight Co.",
    location: "Aurora, CO",
    pay: "$1,800/wk",
    payValue: 45,
    type: "Owner-operator",
    vehicle: "26' Box Truck",
    postedAt: "1d ago",
    postedDaysAgo: 1,
    description:
      "Regional box truck runs, Denver–Colorado Springs corridor. Consistent weekly volume, fuel surcharge included.",
    requirements: [
      "Own 26' box truck with liftgate",
      "2+ years commercial driving experience",
      "Active DOT number",
      "Available Mon–Fri",
    ],
  },
  {
    id: "3",
    title: "Bike Courier — Downtown Zone",
    company: "QuickHop Couriers",
    location: "Boulder, CO",
    pay: "$18/hr + tips",
    payValue: 18,
    type: "Part-time",
    vehicle: "Bike",
    postedAt: "5d ago",
    postedDaysAgo: 5,
    description:
      "Downtown Boulder food and package courier. Flexible shifts, ideal for students. Bring your own bike.",
    requirements: [
      "Own reliable bike + helmet",
      "Comfortable riding in traffic",
      "Smartphone with data plan",
      "18+ years old",
    ],
  },
  {
    id: "4",
    title: "Full-Time Delivery Driver",
    company: "Metro Parcel Services",
    location: "Denver, CO",
    pay: "$21/hr",
    payValue: 21,
    type: "Full-time",
    vehicle: "Cargo Van",
    postedAt: "3h ago",
    postedDaysAgo: 0.12,
    isNew: true,
    description:
      "Full-time W2 position with benefits. Fixed residential route, company van provided.",
    requirements: [
      "Valid driver's license",
      "Pass background check",
      "1+ year delivery experience preferred",
      "Reliable attendance",
    ],
  },
  {
    id: "5",
    title: "Weekend Van Driver",
    company: "Rapid Route Logistics",
    location: "Lakewood, CO",
    pay: "$20/hr",
    payValue: 20,
    type: "Part-time",
    vehicle: "Cargo Van",
    postedAt: "2d ago",
    postedDaysAgo: 2,
    description:
      "Saturday/Sunday delivery shifts, 6am–2pm. Great for drivers wanting weekend-only work.",
    requirements: [
      "Valid driver's license, clean MVR",
      "Available both weekend days",
      "Able to lift up to 40 lbs",
    ],
  },
  {
    id: "6",
    title: "Independent Contractor — Sedan Courier",
    company: "QuickHop Couriers",
    location: "Denver, CO",
    pay: "$0.65/mile",
    payValue: 19,
    type: "Contract / 1099",
    vehicle: "Car",
    postedAt: "6d ago",
    postedDaysAgo: 6,
    description:
      "Document and small-parcel courier runs across the metro. Paid per mile, set your own hours.",
    requirements: [
      "Own sedan or hatchback, 2012+",
      "Valid insurance",
      "Smartphone for dispatch app",
    ],
  },
  {
    id: "7",
    title: "Owner-Operator — Sprinter Van",
    company: "Summit Freight Co.",
    location: "Centennial, CO",
    pay: "$1,600/wk",
    payValue: 40,
    type: "Owner-operator",
    vehicle: "Sprinter Van",
    postedAt: "4d ago",
    postedDaysAgo: 4,
    description:
      "Last-mile Sprinter van routes for a regional e-commerce client. Consistent daily volume, no weekends.",
    requirements: [
      "Own Sprinter or similar high-roof van",
      "Active commercial auto insurance",
      "Clean driving record",
    ],
  },
  {
    id: "8",
    title: "Same-Day Courier — Medical Runs",
    company: "MedExpress Couriers",
    location: "Denver, CO",
    pay: "$25/hr",
    payValue: 25,
    type: "Contract / 1099",
    vehicle: "Car",
    postedAt: "8h ago",
    postedDaysAgo: 0.33,
    isNew: true,
    description:
      "Time-sensitive lab specimen and medical supply runs between clinics. On-call shifts, premium pay.",
    requirements: [
      "Valid driver's license, clean MVR",
      "Background check required (medical sites)",
      "Reliable vehicle with insurance",
      "Available for on-call shifts",
    ],
  },
];

export const MOCK_JOBS: Job[] = JOB_BASE.map((job, i) => ({
  ...job,
  status: job.id === "7" ? "closed" : "live",
  applicantCount: APPLICANT_COUNTS[i],
}));
