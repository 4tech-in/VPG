import { Navbar } from "@/components/admin-panel/navbar";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
  breadcrumb?: React.ReactNode;
}

export function ContentLayout({
  title,
  children,
  breadcrumb
}: ContentLayoutProps) {
  return (
    <div>
      <Navbar title={title} breadcrumb={breadcrumb} />
      {children}
    </div>
  );
}
