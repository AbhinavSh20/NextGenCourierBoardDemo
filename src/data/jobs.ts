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
      "You'll run the same route most days once you learn it — mostly Denver metro, 20-35 stops depending on volume. Shift's usually done by early afternoon. We use a routing app so you're not guessing at addresses all day.",
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
      "Steady lane between Denver and Colorado Springs, same client every week so the volume doesn't swing much. Fuel surcharge is on top of the rate, not baked in. Mostly daytime runs, occasional early start.",
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
      "Pretty much all downtown Boulder, so no long hauls. Good gig if you've got class in the afternoon or just don't want a 9-to-5 — pick shifts that work for you. Tips are solid on food runs.",
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
      "This is a real W2 job, not 1099 — health benefits kick in after 60 days. Same residential route every day so you'll know it cold within a couple weeks. We provide the van, you just show up and drive.",
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
      "Just Saturdays and Sundays, 6 to 2. We get a lot of interest from drivers who already have a weekday job and want extra cash on the weekend — that's basically who this is built for.",
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
      "Mostly legal documents and small parcels, nothing heavy. You're paid per mile so a slow week just means fewer runs, not a wasted shift. Log in to the dispatch app whenever you want to work — no set schedule.",
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
      "Last-mile drops for one of our bigger e-commerce accounts, so the volume's pretty predictable day to day. No weekend work on this one. Note: this posting's currently closed, but check back — it reopens when the account renews.",
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
      "You're moving lab specimens and supplies between clinics, sometimes on short notice — that's why the pay's higher than our other routes. It's on-call, not a fixed schedule, so this works best if you can drop what you're doing when a run comes in.",
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
