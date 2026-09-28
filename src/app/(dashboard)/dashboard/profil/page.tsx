"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useSchool } from "@/hooks/use-school";

export default function ProfilePage() {
  const { user } = useAuth();
  const { selectedSchool } = useSchool();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.user_metadata?.name || "",
        email: user.email || "",
        phone: user.user_metadata?.phone || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    // TODO: Implement profile update via Supabase
    console.log("Saving profile:", formData);
    setIsEditing(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-[var(--muadalah-on-surface)]">
          Profil Pengguna
        </h1>
        <p className="text-[var(--muadalah-on-surface-variant)] mt-1">
          Kelola informasi profil Anda
        </p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[var(--muadalah-surface-card)] rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[var(--muadalah-border-subtle)]"
      >
        {/* Avatar Section */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-[var(--muadalah-border-subtle)]">
          <motion.div
            className="w-24 h-24 rounded-full bg-[var(--muadalah-primary)] flex items-center justify-center text-white text-3xl font-semibold"
            whileHover={{ scale: 1.05 }}
          >
            {formData.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
          </motion.div>
          <div>
            <h2 className="text-2xl font-semibold text-[var(--muadalah-on-surface)]">
              {formData.name || "User"}
            </h2>
            <p className="text-[var(--muadalah-on-surface-variant)] mt-1">
              {user?.email}
            </p>
            {selectedSchool && (
              <div className="flex items-center gap-2 mt-2">
                <span className="material-symbols-outlined text-[var(--muadalah-primary)] text-[18px]">
                  account_balance
                </span>
                <span className="text-sm text-[var(--muadalah-on-surface-variant)]">
                  {selectedSchool.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--muadalah-on-surface)] mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-3 bg-[var(--muadalah-surface-container-low)] border border-[var(--muadalah-border-subtle)] rounded-lg text-[var(--muadalah-on-surface)] disabled:opacity-60 disabled:cursor-not-allowed focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 outline-none transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[var(--muadalah-on-surface)] mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-3 bg-[var(--muadalah-surface-container-low)] border border-[var(--muadalah-border-subtle)] rounded-lg text-[var(--muadalah-on-surface)] opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-[var(--muadalah-on-surface-variant)] mt-1">
              Email tidak dapat diubah
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-[var(--muadalah-on-surface)] mb-2">
              No. Telepon
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-3 bg-[var(--muadalah-surface-container-low)] border border-[var(--muadalah-border-subtle)] rounded-lg text-[var(--muadalah-on-surface)] disabled:opacity-60 disabled:cursor-not-allowed focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 outline-none transition-all"
              placeholder="08xxxxxxxxxx"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {!isEditing ? (
              <motion.button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-[var(--muadalah-primary)] text-white rounded-lg font-medium hover:bg-[var(--muadalah-primary)]/90 transition-colors flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
                Edit Profil
              </motion.button>
            ) : (
              <>
                <motion.button
                  onClick={handleSave}
                  className="px-6 py-3 bg-[var(--muadalah-primary)] text-white rounded-lg font-medium hover:bg-[var(--muadalah-primary)]/90 transition-colors flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  Simpan
                </motion.button>
                <motion.button
                  onClick={() => {
                    setIsEditing(false);
                    if (user) {
                      setFormData({
                        name: user.user_metadata?.name || "",
                        email: user.email || "",
                        phone: user.user_metadata?.phone || "",
                      });
                    }
                  }}
                  className="px-6 py-3 bg-[var(--muadalah-surface-container)] text-[var(--muadalah-on-surface)] rounded-lg font-medium hover:bg-[var(--muadalah-surface-container-high)] transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Batal
                </motion.button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 bg-[var(--muadalah-surface-card)] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[var(--muadalah-border-subtle)]"
      >
        <h3 className="text-lg font-semibold text-[var(--muadalah-on-surface)] mb-4">
          Informasi Akun
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muadalah-on-surface-variant)]">User ID</span>
            <span className="text-[var(--muadalah-on-surface)] font-mono">{user?.id.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muadalah-on-surface-variant)]">Status Akun</span>
            <span className="text-[var(--muadalah-success)] font-medium">Aktif</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muadalah-on-surface-variant)]">Terakhir Login</span>
            <span className="text-[var(--muadalah-on-surface)]">
              {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString("id-ID") : "-"}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
