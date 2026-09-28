"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUnreadCount } from "@/hooks/use-pesan";

interface NavItem {
  path: string;
  icon: string;
  label: string;
  children?: Array<{ path: string; icon: string; label: string }>;
}

const navItems: NavItem[] = [
  { path: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { path: "/dashboard/siswa", icon: "person", label: "Manajemen Siswa" },
  {
    path: "/dashboard/absensi",
    icon: "assignment_turned_in",
    label: "Absensi",
    children: [
      { path: "/dashboard/absensi/harian", icon: "how_to_reg", label: "Absensi Harian" },
      { path: "/dashboard/absensi/rekap", icon: "history_edu", label: "Rekap Absensi" },
    ],
  },
  {
    path: "/dashboard/nilai",
    icon: "bar_chart",
    label: "Penilaian",
    children: [
      { path: "/dashboard/nilai", icon: "edit_note", label: "Input Nilai" },
      { path: "/dashboard/nilai/rapor", icon: "article", label: "Rapor" },
      { path: "/dashboard/nilai/ranking", icon: "military_tech", label: "Ranking" },
    ],
  },
  { path: "/dashboard/jadwal", icon: "calendar_today", label: "Jadwal Pelajaran" },
  { path: "/dashboard/kelas", icon: "meeting_room", label: "Manajemen Kelas" },
  {
    path: "/dashboard/pembayaran",
    icon: "payments",
    label: "Pembayaran SPP",
    children: [
      { path: "/dashboard/pembayaran", icon: "receipt_long", label: "Daftar Pembayaran" },
      { path: "/dashboard/pembayaran/tunggakan", icon: "money_off", label: "Tunggakan SPP" },
    ],
  },
  { path: "/dashboard/komunikasi", icon: "forum", label: "Komunikasi" },
  { path: "/dashboard/laporan", icon: "description", label: "Laporan" },
];

const settingsItem = { path: "/dashboard/pengaturan", icon: "settings", label: "Pengaturan" };

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: unreadData } = useUnreadCount();
  const unreadCount: number = unreadData?.data?.count ?? 0;

  // Track which parent sections are expanded
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Auto-expand the section that matches current path on mount/navigate
  useEffect(() => {
    const matchingParent = navItems.find(
      (item) => item.children && pathname.startsWith(item.path)
    );
    if (matchingParent) {
      setExpanded((prev) => new Set([...prev, matchingParent.path]));
    }
  }, [pathname]);

  const isPathActive = (item: NavItem) => {
    if (item.children) return pathname.startsWith(item.path);
    return pathname === item.path;
  };

  const isChildActive = (childPath: string) => pathname === childPath;

  const toggleExpanded = (item: NavItem) => {
    const isOpen = expanded.has(item.path);
    if (isOpen) {
      // Close: collapse the section
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(item.path);
        return next;
      });
    } else {
      // Open: expand section and navigate to first child
      setExpanded((prev) => new Set([...prev, item.path]));
      if (item.children && item.children.length > 0) {
        router.push(item.children[0].path);
      }
    }
  };

  const isExpanded = (path: string) => expanded.has(path);

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-[var(--muadalah-surface-container-lowest)] z-50 flex flex-col border-r border-[var(--muadalah-border-subtle)] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      {/* Logo */}
      <motion.div
        className="px-8 py-6 flex items-center gap-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
      >
        <motion.div
          className="w-10 h-10 bg-[var(--muadalah-primary-container)] rounded-xl flex items-center justify-center"
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <span className="material-symbols-outlined text-white">school</span>
        </motion.div>
        <span className="text-xl font-semibold text-[var(--muadalah-primary)] tracking-tight">
          Muadalah
        </span>
      </motion.div>

      {/* Navigation */}
      <motion.nav
        className="flex-1 px-4 space-y-1 overflow-y-auto pt-4 pb-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {navItems.map((item) => {
          const active = isPathActive(item);
          const hasChildren = !!(item.children && item.children.length > 0);
          const open = isExpanded(item.path);

          return (
            <motion.div key={item.path} variants={itemVariants}>
              {/* Parent item */}
              {hasChildren ? (
                // Clickable button to toggle expand + navigate to first child
                <button
                  onClick={() => toggleExpanded(item)}
                  className={cn(
                    "w-full flex items-center px-4 py-3 rounded-lg transition-all relative overflow-hidden cursor-pointer",
                    active
                      ? "bg-[var(--muadalah-primary-container)] text-white font-semibold"
                      : "text-[var(--muadalah-on-surface-variant)] hover:bg-[var(--muadalah-surface-container-low)] hover:text-[var(--muadalah-on-surface)]"
                  )}
                >
                  {active && (
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                      layoutId="activeIndicator"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="material-symbols-outlined mr-3 text-[22px]">
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium tracking-wide flex-1 text-left">
                    {item.label}
                  </span>
                  <motion.span
                    className="material-symbols-outlined text-[18px]"
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    expand_more
                  </motion.span>
                </button>
              ) : (
                // Regular link
                <Link
                  href={item.path}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg transition-all group relative overflow-hidden",
                    active
                      ? "bg-[var(--muadalah-primary-container)] text-white font-semibold shadow-md shadow-[var(--muadalah-primary)]/20"
                      : "text-[var(--muadalah-on-surface-variant)] hover:bg-[var(--muadalah-surface-container-low)] hover:text-[var(--muadalah-on-surface)]"
                  )}
                >
                  {active && (
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                      layoutId="activeIndicator"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <motion.span
                    className="material-symbols-outlined mr-3 text-[22px]"
                    whileHover={{ scale: 1.1, rotate: active ? 0 : 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    {item.icon}
                  </motion.span>
                  <span className="text-sm font-medium tracking-wide flex-1">
                    {item.label}
                  </span>
                  {/* Unread badge for Komunikasi */}
                  {item.path === "/dashboard/komunikasi" && unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </motion.span>
                  )}
                </Link>
              )}

              {/* Children (sub-items) — shown when expanded */}
              <AnimatePresence initial={false}>
                {hasChildren && open && (
                  <motion.div
                    key="children"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="overflow-hidden ml-4 mt-1 space-y-0.5 border-l-2 border-[var(--muadalah-primary-container)]/30 pl-3"
                  >
                    {item.children!.map((child) => {
                      const childActive = isChildActive(child.path);
                      return (
                        <Link
                          key={child.path}
                          href={child.path}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                            childActive
                              ? "bg-blue-50 text-blue-700 font-semibold"
                              : "text-[var(--muadalah-on-surface-variant)] hover:bg-[var(--muadalah-surface-container-low)] hover:text-[var(--muadalah-on-surface)]"
                          )}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {child.icon}
                          </span>
                          <span className="font-medium">{child.label}</span>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Settings (separated) */}
        <motion.div
          className="pt-4 mt-4 border-t border-[var(--muadalah-border-subtle)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <Link
            href={settingsItem.path}
            className={cn(
              "flex items-center px-4 py-3 rounded-lg transition-all group relative overflow-hidden",
              pathname === settingsItem.path
                ? "bg-[var(--muadalah-primary-container)] text-white font-semibold shadow-md shadow-[var(--muadalah-primary)]/20"
                : "text-[var(--muadalah-on-surface-variant)] hover:bg-[var(--muadalah-surface-container-low)] hover:text-[var(--muadalah-on-surface)]"
            )}
          >
            {pathname === settingsItem.path && (
              <motion.div
                className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                layoutId="activeIndicator"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <motion.span
              className="material-symbols-outlined mr-3 text-[22px]"
              whileHover={{ scale: 1.1, rotate: 180 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {settingsItem.icon}
            </motion.span>
            <span className="text-sm font-medium tracking-wide">
              {settingsItem.label}
            </span>
          </Link>
        </motion.div>
      </motion.nav>
    </aside>
  );
}
