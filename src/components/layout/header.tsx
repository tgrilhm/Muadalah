"use client";

import { useSchool } from "@/hooks/use-school";
import SchoolSelector from "@/components/layout/SchoolSelector";
import GlobalSearch from "@/components/layout/GlobalSearch";
import NotificationDropdown from "@/components/layout/NotificationDropdown";
import UserMenu from "@/components/layout/UserMenu";
import { motion } from "framer-motion";

export function Header() {
  const { selectedSchool, availableSchools, switchSchool } = useSchool();

  const schools = availableSchools.map((school) => ({
    id: school.id,
    name: school.name,
    type: school.level === "SMP" ? ("SMP" as const) : ("SMA" as const),
  }));

  return (
    <motion.header 
      className="fixed top-0 left-72 right-0 h-20 bg-[var(--muadalah-surface-container-lowest)]/80 backdrop-blur-md z-40 px-8 flex items-center justify-between border-b border-[var(--muadalah-border-subtle)] shadow-sm"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
    >
      {/* Left section: School selector + Search */}
      <div className="flex items-center gap-6 flex-1">
        <SchoolSelector 
          currentSchool={selectedSchool ? { id: selectedSchool.id, name: selectedSchool.name, type: selectedSchool.level as "SMP" | "SMA" } : undefined}
          schools={schools}
          onSchoolChange={(school) => switchSchool(school.id)}
        />
        <GlobalSearch />
      </div>

      {/* Right section: Notifications + User */}
      <motion.div 
        className="flex items-center gap-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <NotificationDropdown />
        <UserMenu />
      </motion.div>
    </motion.header>
  );
}

