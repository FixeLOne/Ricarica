import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function PageTransition({ children, locationKey }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={locationKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-amber-50 dark:bg-stone-900">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6">
          <PageTransition locationKey={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
