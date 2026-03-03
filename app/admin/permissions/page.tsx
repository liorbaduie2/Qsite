"use client";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { Shield, RefreshCw, ArrowRight } from "lucide-react";
import { AdminRoute, useAuth } from "../../components/AuthProvider";
import {
  ADMIN_ROLE_LABELS,
  PERMISSION_DEFINITIONS,
  type AdminRoleKey,
  type PermissionKey,
} from "@/lib/permissionKeys";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
);

export default function PermissionsMatrixPage() {
  return (
    <AdminRoute>
      <PermissionsMatrixInner />
    </AdminRoute>
  );
}

function PermissionsMatrixInner() {
  const { userPermissions, refreshPermissions } = useAuth();
  const [matrix, setMatrix] = useState<Record<
    PermissionKey,
    Record<AdminRoleKey, boolean>
  > | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rolesConfig, setRolesConfig] = useState<
    {
      role: AdminRoleKey;
      role_name_hebrew: string;
      max_reputation_deduction: number | null;
      max_suspension_hours: number | null;
      default_reputation_deduction: number | null;
      default_suspension_hours: number | null;
    }[]
  >([]);
  const [roleDrafts, setRoleDrafts] = useState<
    Record<
      string,
      {
        maxReputation: number;
        maxSuspension: number;
        defaultSuspension: number;
        defaultReputation: number;
        saving: boolean;
      }
    >
  >({});
  const [activeSection, setActiveSection] = useState<"roles" | "matrix">(
    "roles",
  );

  useEffect(() => {
    const load = async () => {
      if (!userPermissions || userPermissions.role !== "owner") return;
      try {
        setLoading(true);
        setError(null);
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("לא מחובר למערכת");
        }
        const res = await fetch("/api/admin/config/permissions-matrix", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "שגיאה בטעינת מטריצת הרשאות");
        }
        const rows: {
          role: AdminRoleKey;
          permission_key: PermissionKey;
          allowed: boolean;
        }[] = Array.isArray(data.rows) ? data.rows : [];
        const base: Record<
          PermissionKey,
          Record<AdminRoleKey, boolean>
        > = {} as any;
        for (const def of PERMISSION_DEFINITIONS) {
          base[def.key] = {
            // Owner always has full access; matrix cannot turn this off
            owner: true,
            guardian: false,
            admin: false,
            moderator: false,
            user: false,
          };
        }
        for (const row of rows) {
          // Ignore stored values for owner: owner is always fully enabled
          if (row.role === "owner") continue;
          if (base[row.permission_key]) {
            base[row.permission_key][row.role] = !!row.allowed;
          }
        }
        setMatrix(base);

        // Load per-role limits/defaults
        const rolesRes = await fetch("/api/admin/config/admin-roles", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const rolesJson = await rolesRes.json();
        if (!rolesRes.ok) {
          throw new Error(rolesJson.error || "שגיאה בטעינת הגדרות תפקידים");
        }
        const allowedRoles: AdminRoleKey[] = [
          "owner",
          "guardian",
          "admin",
          "moderator",
          "user",
        ];
        const rawRoles: any[] = Array.isArray(rolesJson.roles)
          ? rolesJson.roles
          : [];
        const byKey = new Map<string, any>();
        for (const r of rawRoles) {
          if (typeof r?.role === "string") {
            byKey.set(r.role, r);
          }
        }
        const normalized = allowedRoles.map((key) => {
          const existing = byKey.get(key);
          if (existing) return existing;
          return {
            role: key,
            role_name_hebrew: ADMIN_ROLE_LABELS[key],
            max_reputation_deduction: null,
            max_suspension_hours: null,
            default_reputation_deduction: null,
            default_suspension_hours: null,
          };
        });
        setRolesConfig(normalized);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "שגיאה בטעינת מטריצת הרשאות",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userPermissions]);

  if (!userPermissions || userPermissions.role !== "owner") {
    return (
      <div
        className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-4"
        dir="rtl"
      >
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center border dark:border-slate-700">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            אין הרשאת גישה
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            דף זה זמין לבעלים בלבד.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-slate-100"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/40">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">מטריצת הרשאות</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                הגדרת הרשאות ניהול לכל תפקיד במערכת.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה לפאנל הניהול
            </Link>
            <button
              type="button"
              onClick={() => {
                // simple reload
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
              רענן
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/60 rounded text-sm text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Section switcher */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setActiveSection("roles")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeSection === "roles"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              הגדרות לפי תפקיד
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("matrix")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeSection === "matrix"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              מטריצת הרשאות מפורטת
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            בחר בין תצוגת סיכום לפי תפקיד לבין מטריצה מלאה לפי הרשאה.
          </p>
        </div>

        {/* Per-role numeric limits & defaults */}
        {activeSection === "roles" && (
          <section className="mb-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  הגדרות לפי תפקיד
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ערכי ברירת מחדל ומגבלות עבור כל דרגת ניהול. ישמשו בכרטיס
                  הניהול ובמסכי השעייה/ניכוי מוניטין.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                    <th className="px-2 py-2 font-semibold text-slate-700 dark:text-slate-200">
                      תפקיד
                    </th>
                    <th className="px-2 py-2 font-semibold text-slate-700 dark:text-slate-200">
                      ניכוי מוניטין מקסימלי
                    </th>
                    <th className="px-2 py-2 font-semibold text-slate-700 dark:text-slate-200">
                      מגבלת השעייה (שעות)
                    </th>
                    <th className="px-2 py-2 font-semibold text-slate-700 dark:text-slate-200">
                      משך ההשעיה (ברירת מחדל, שעות)
                    </th>
                    <th className="px-2 py-2 font-semibold text-slate-700 dark:text-slate-200">
                      ניכוי מוניטין (ברירת מחדל)
                    </th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rolesConfig.map((role) => {
                    const isOwnerRole = role.role === "owner";
                    const draft = roleDrafts[role.role] ?? {
                      maxReputation: role.max_reputation_deduction ?? 0,
                      maxSuspension: role.max_suspension_hours ?? 0,
                      defaultSuspension: role.default_suspension_hours ?? 0,
                      defaultReputation: role.default_reputation_deduction ?? 0,
                      saving: false,
                    };

                    const updateDraft = (
                      patch: Partial<Exclude<typeof draft, undefined>>,
                    ) => {
                      setRoleDrafts((prev) => ({
                        ...prev,
                        [role.role]: { ...draft, ...patch },
                      }));
                    };

                    const handleSave = async () => {
                      try {
                        updateDraft({ saving: true });
                        const {
                          data: { session },
                        } = await supabase.auth.getSession();
                        if (!session) {
                          throw new Error("לא מחובר למערכת");
                        }
                        if (isOwnerRole) {
                          // Owner is always treated as unlimited; do not persist limits via this UI
                          return;
                        }
                        const res = await fetch(
                          "/api/admin/config/admin-roles",
                          {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${session.access_token}`,
                            },
                            body: JSON.stringify({
                              roleName: role.role,
                              maxReputationDeduction: draft.maxReputation,
                              maxSuspensionHours:
                                draft.maxSuspension > 0
                                  ? draft.maxSuspension
                                  : null,
                              defaultReputationDeduction:
                                draft.defaultReputation > 0
                                  ? draft.defaultReputation
                                  : null,
                              defaultSuspensionHours:
                                draft.defaultSuspension > 0
                                  ? draft.defaultSuspension
                                  : null,
                            }),
                          },
                        );
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) {
                          throw new Error(
                            data.error || "שגיאה בעדכון הגדרות תפקיד",
                          );
                        }
                        // Update local state so the table shows saved values without reload
                        setRolesConfig((prev) =>
                          prev.map((r) =>
                            r.role === role.role
                              ? {
                                  ...r,
                                  max_reputation_deduction: draft.maxReputation,
                                  max_suspension_hours:
                                    draft.maxSuspension > 0
                                      ? draft.maxSuspension
                                      : null,
                                  default_reputation_deduction:
                                    draft.defaultReputation > 0
                                      ? draft.defaultReputation
                                      : null,
                                  default_suspension_hours:
                                    draft.defaultSuspension > 0
                                      ? draft.defaultSuspension
                                      : null,
                                }
                              : r,
                          ),
                        );
                        // Refresh current admin's permissions so dashboards immediately reflect new limits
                        await refreshPermissions();
                      } catch (err) {
                        setError(
                          err instanceof Error
                            ? err.message
                            : "שגיאה בעדכון הגדרות תפקיד",
                        );
                      } finally {
                        updateDraft({ saving: false });
                      }
                    };

                    return (
                      <tr
                        key={role.role}
                        className="border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <td className="px-2 py-2 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                          {role.role_name_hebrew}
                        </td>
                        <td className="px-2 py-2">
                          {isOwnerRole ? (
                            <span className="text-slate-600 dark:text-slate-200">
                              ללא הגבלה
                            </span>
                          ) : (
                            <input
                              type="number"
                              min={0}
                              className="w-24 px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={draft.maxReputation}
                              onChange={(e) =>
                                updateDraft({
                                  maxReputation: Number(e.target.value || 0),
                                })
                              }
                            />
                          )}
                        </td>
                        <td className="px-2 py-2">
                          {isOwnerRole ? (
                            <span className="text-slate-600 dark:text-slate-200">
                              ללא הגבלה
                            </span>
                          ) : (
                            <input
                              type="number"
                              min={0}
                              className="w-24 px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={draft.maxSuspension}
                              onChange={(e) =>
                                updateDraft({
                                  maxSuspension: Number(e.target.value || 0),
                                })
                              }
                            />
                          )}
                        </td>
                        <td className="px-2 py-2">
                          {isOwnerRole ? (
                            <span className="text-slate-600 dark:text-slate-200">
                              ללא הגבלה
                            </span>
                          ) : (
                            <input
                              type="number"
                              min={0}
                              className="w-28 px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={draft.defaultSuspension}
                              onChange={(e) =>
                                updateDraft({
                                  defaultSuspension: Number(
                                    e.target.value || 0,
                                  ),
                                })
                              }
                            />
                          )}
                        </td>
                        <td className="px-2 py-2">
                          {isOwnerRole ? (
                            <span className="text-slate-600 dark:text-slate-200">
                              ללא הגבלה
                            </span>
                          ) : (
                            <input
                              type="number"
                              min={0}
                              className="w-28 px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={draft.defaultReputation}
                              onChange={(e) =>
                                updateDraft({
                                  defaultReputation: Number(
                                    e.target.value || 0,
                                  ),
                                })
                              }
                            />
                          )}
                        </td>
                        <td className="px-2 py-2 text-left">
                          <button
                            type="button"
                            onClick={handleSave}
                            disabled={draft.saving || isOwnerRole}
                            className="px-3 py-1 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isOwnerRole
                              ? "ללא מגבלה"
                              : draft.saving
                                ? "שומר..."
                                : "שמור"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeSection === "matrix" && (loading || !matrix) ? (
          <div className="flex items-center justify-center py-10 gap-2 text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>טוען מטריצת הרשאות...</span>
          </div>
        ) : activeSection === "matrix" && matrix ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 overflow-x-auto max-h-[70vh]">
            <table className="min-w-full text-sm text-right border-collapse">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 z-10">
                <tr>
                  <th className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 w-44">
                    קטגוריה
                  </th>
                  <th className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 w-80">
                    הרשאה
                  </th>
                  {(
                    [
                      "owner",
                      "guardian",
                      "admin",
                      "moderator",
                      "user",
                    ] as AdminRoleKey[]
                  ).map((roleKey) => (
                    <th
                      key={roleKey}
                      className="px-2 py-2 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-center"
                    >
                      {ADMIN_ROLE_LABELS[roleKey]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_DEFINITIONS.map((perm, index) => {
                  const prev = PERMISSION_DEFINITIONS[index - 1];
                  const showCategory = !prev || prev.category !== perm.category;
                  const row = matrix[perm.key];
                  return (
                    <tr
                      key={perm.key}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/80"
                    >
                      <td className="px-3 py-2 border-t border-slate-100 dark:border-slate-700 align-top text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {showCategory ? perm.category : ""}
                      </td>
                      <td className="px-3 py-2 border-t border-slate-100 dark:border-slate-700">
                        {showCategory && (
                          <div className="mb-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {perm.category}
                          </div>
                        )}
                        <div className="font-semibold text-slate-800 dark:text-slate-100">
                          {perm.label}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {perm.description}
                        </div>
                      </td>
                      {(
                        [
                          "owner",
                          "guardian",
                          "admin",
                          "moderator",
                          "user",
                        ] as AdminRoleKey[]
                      ).map((roleKey) => {
                        const isOwnerCol = roleKey === "owner";
                        const checked = isOwnerCol
                          ? true
                          : (row?.[roleKey] ?? false);
                        const toggle = async () => {
                          // Owner column is locked: cannot be toggled
                          if (isOwnerCol) return;
                          const snapshot = matrix;
                          const updated: typeof matrix = {
                            ...matrix,
                            [perm.key]: {
                              ...row,
                              [roleKey]: !checked,
                            },
                          };
                          setMatrix(updated);
                          try {
                            const {
                              data: { session },
                            } = await supabase.auth.getSession();
                            if (!session) {
                              throw new Error("לא מחובר למערכת");
                            }
                            const res = await fetch(
                              "/api/admin/config/permissions-matrix",
                              {
                                method: "PUT",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${session.access_token}`,
                                },
                                body: JSON.stringify({
                                  role: roleKey,
                                  permissionKey: perm.key,
                                  allowed: !checked,
                                }),
                              },
                            );
                            if (!res.ok) {
                              const data = await res.json().catch(() => ({}));
                              throw new Error(
                                data.error || "שגיאה בעדכון הרשאה",
                              );
                            }
                          } catch (err) {
                            setMatrix(snapshot);
                            setError(
                              err instanceof Error
                                ? err.message
                                : "שגיאה בעדכון הרשאה",
                            );
                          }
                        };
                        return (
                          <td
                            key={roleKey}
                            className="px-2 py-2 border-t border-slate-100 dark:border-slate-700 text-center align-middle"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={toggle}
                              disabled={isOwnerCol}
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 disabled:opacity-70"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
