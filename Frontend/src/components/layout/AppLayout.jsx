import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-stone-50">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto p-5 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
