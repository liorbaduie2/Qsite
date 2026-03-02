"use client";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Shield, RefreshCw } from "lucide-react";
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
  const { userPermissions } = useAuth();
  const [matrix, setMatrix] = useState<
    Record<PermissionKey, Record<AdminRoleKey, boolean>> | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rolesConfig, setRolesConfig] = useState<
    {
      role_name: AdminRoleKey;
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
            owner: false,
            guardian: false,
            admin: false,
            moderator: false,
            user: false,
          };
        }
        for (const row of rows) {
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
          throw new Error(
            rolesJson.error || "שגיאה בטעינת הגדרות תפקידים",
          );
        }
        setRolesConfig(rolesJson.roles ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "שגיאה בטעינת מטריצת הרשאות",
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
        </header>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/60 rounded text-sm text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Per-role numeric limits & defaults */}
        <section className="mb-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-100">
            הגדרות לפי תפקיד
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            ערכי ברירת מחדל ומגבלות עבור כל דרגת ניהול. ישמשו בכרטיס
            הניהול ובמסכי השעייה/ניכוי מוניטין.
          </p>
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
                  const draft =
                    roleDrafts[role.role_name] ?? {
                      maxReputation: role.max_reputation_deduction ?? 0,
                      maxSuspension: role.max_suspension_hours ?? 0,
                      defaultSuspension: role.default_suspension_hours ?? 0,
                      defaultReputation:
                        role.default_reputation_deduction ?? 0,
                      saving: false,
                    };

                  const updateDraft = (
                    patch: Partial<Exclude<typeof draft, undefined>>,
                  ) => {
                    setRoleDrafts((prev) => ({
                      ...prev,
                      [role.role_name]: { ...draft, ...patch },
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
                      const res = await fetch("/api/admin/config/admin-roles", {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify({
                          roleName: role.role_name,
                          maxReputationDeduction: draft.maxReputation,
                          maxSuspensionHours:
                            draft.maxSuspension > 0 ? draft.maxSuspension : null,
                          defaultReputationDeduction:
                            draft.defaultReputation > 0
                              ? draft.defaultReputation
                              : null,
                          defaultSuspensionHours:
                            draft.defaultSuspension > 0
                              ? draft.defaultSuspension
                              : null,
                        }),
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        throw new Error(
                          data.error || "שגיאה בעדכון הגדרות תפקיד",
                        );
                      }
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
                      key={role.role_name}
                      className="border-b border-slate-100 dark:border-slate-700/60"
                    >
                      <td className="px-2 py-2 font-semibold text-slate-800 dark:text-slate-100">
                        {role.role_name_hebrew}
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          className="w-20 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                          value={draft.maxReputation}
                          onChange={(e) =>
                            updateDraft({
                              maxReputation: Number(e.target.value || 0),
                            })
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          className="w-20 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                          value={draft.maxSuspension}
                          onChange={(e) =>
                            updateDraft({
                              maxSuspension: Number(e.target.value || 0),
                            })
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          className="w-24 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                          value={draft.defaultSuspension}
                          onChange={(e) =>
                            updateDraft({
                              defaultSuspension: Number(e.target.value || 0),
                            })
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          className="w-24 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                          value={draft.defaultReputation}
                          onChange={(e) =>
                            updateDraft({
                              defaultReputation: Number(e.target.value || 0),
                            })
                          }
                        />
                      </td>
                      <td className="px-2 py-2 text-left">
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={draft.saving}
                          className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                        >
                          {draft.saving ? "שומר..." : "שמור"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {loading || !matrix ? (
          <div className="flex items-center justify-center py-10 gap-2 text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>טוען מטריצת הרשאות...</span>
          </div>
        ) : (
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
                    ["owner", "guardian", "admin", "moderator", "user"] as AdminRoleKey[]
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
                    <React.Fragment key={perm.key}>
                      {showCategory && (
                        <tr className="bg-slate-50 dark:bg-slate-800">
                          <td
                            colSpan={7}
                            className="px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-slate-700"
                          >
                            {perm.category}
                          </td>
                        </tr>
                      )}
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/80">
                        <td className="px-3 py-2 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                          &nbsp;
                        </td>
                        <td className="px-3 py-2 border-t border-slate-100 dark:border-slate-700">
                          <div className="font-semibold text-slate-800 dark:text-slate-100">
                            {perm.label}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {perm.description}
                          </div>
                        </td>
                        {(
                          ["owner", "guardian", "admin", "moderator", "user"] as AdminRoleKey[]
                        ).map((roleKey) => {
                          const checked = row?.[roleKey] ?? false;
                          const toggle = async () => {
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
                                const data = await res
                                  .json()
                                  .catch(() => ({}));
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
                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

