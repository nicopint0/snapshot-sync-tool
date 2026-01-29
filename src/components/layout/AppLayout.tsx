import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
