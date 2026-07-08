import { ProtectedNavbar } from "@/components/Navigation/Navbar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ProtectedNavbar />
      <main className="flex-1">{children}</main>
    </>
  );
}
