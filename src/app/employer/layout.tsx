import RequireRole from "@/components/RequireRole";

export default function EmployerLayout({ children }: LayoutProps<"/employer">) {
  return <RequireRole role="employer">{children}</RequireRole>;
}
