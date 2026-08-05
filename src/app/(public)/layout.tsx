import PublicNavbar from "@/components/layout/public-navbar";
import PublicFooter from "@/components/layout/public-footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col font-poppins min-w-0 overflow-x-hidden">
      <PublicNavbar />
      <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      <PublicFooter />
    </div>
  );
}
