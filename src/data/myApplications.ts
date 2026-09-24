export type MyApplication = {
  jobId: string;
  appliedAt: string;
  status: "new" | "contacted" | "rejected" | "hired";
};

export const MY_APPLICATIONS: MyApplication[] = [
  { jobId: "2", appliedAt: "3d ago", status: "contacted" },
  { jobId: "6", appliedAt: "1w ago", status: "new" },
  { jobId: "5", appliedAt: "2w ago", status: "rejected" },
];
