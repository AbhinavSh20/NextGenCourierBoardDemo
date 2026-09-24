export type ApplicantStatus = "new" | "contacted" | "rejected" | "hired";

export type Applicant = {
  id: string;
  jobId: string;
  name: string;
  phone: string;
  email: string;
  vehicle: string;
  appliedAt: string;
  status: ApplicantStatus;
  message: string;
};

export const MOCK_APPLICANTS: Applicant[] = [
  {
    id: "a1",
    jobId: "1",
    name: "Marcus Reyes",
    phone: "(720) 555-0142",
    email: "marcus.reyes@example.com",
    vehicle: "2019 Ford Transit",
    appliedAt: "3h ago",
    status: "new",
    message: "Drove for a similar route last year, know the downtown zones well.",
  },
  {
    id: "a2",
    jobId: "1",
    name: "Priya Chandran",
    phone: "(303) 555-0198",
    email: "priya.c@example.com",
    vehicle: "2021 RAM ProMaster",
    appliedAt: "6h ago",
    status: "contacted",
    message: "Available immediately, full-time or part-time.",
  },
  {
    id: "a3",
    jobId: "1",
    name: "Dwayne Osei",
    phone: "(720) 555-0110",
    email: "d.osei@example.com",
    vehicle: "2016 Nissan NV200",
    appliedAt: "1d ago",
    status: "rejected",
    message: "Looking for weekend-only shifts.",
  },
  {
    id: "a4",
    jobId: "3",
    name: "Elena Vasquez",
    phone: "(303) 555-0177",
    email: "elena.v@example.com",
    vehicle: "Trek FX 3",
    appliedAt: "2h ago",
    status: "new",
    message: "Student at CU Boulder, need afternoon shifts.",
  },
  {
    id: "a5",
    jobId: "3",
    name: "Jordan Blake",
    phone: "(720) 555-0163",
    email: "jordan.blake@example.com",
    vehicle: "Specialized Sirrus",
    appliedAt: "1d ago",
    status: "hired",
    message: "Two years bike courier experience downtown.",
  },
  {
    id: "a6",
    jobId: "4",
    name: "Samantha Cole",
    phone: "(303) 555-0121",
    email: "s.cole@example.com",
    vehicle: "N/A — company van",
    appliedAt: "5h ago",
    status: "new",
    message: "Former UPS driver, 3 years experience.",
  },
];
