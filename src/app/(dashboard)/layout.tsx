import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { SchoolProvider } from "@/components/providers/SchoolProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SchoolProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-72">
          <Header />
          <div className="pt-24 px-6 pb-6">{children}</div>
        </main>
      </div>
    </SchoolProvider>
  );
}
