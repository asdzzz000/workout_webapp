"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { SessionData } from "@/types/workout";

interface WorkoutHistoryListProps {
  initialSessions: SessionData[];
}

export default function WorkoutHistoryList({ initialSessions }: WorkoutHistoryListProps) {
  const [sessions, setSessions] = useState<SessionData[]>(initialSessions);
  const [expandedSessionIds, setExpandedSessionIds] = useState<Record<string, boolean>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // 展開或收合訓練紀錄
  const toggleExpand = (sessionId: string) => {
    setExpandedSessionIds((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  // 將日期轉成適合顯示的文字
  const formatDate = (dateStr: string) => {
    try {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      const checkDate = new Date(dateStr);

      const isToday = today.toDateString() === checkDate.toDateString();
      const isYesterday = yesterday.toDateString() === checkDate.toDateString();

      if (isToday) return "今天";
      if (isYesterday) return "昨天";

      const months = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
      return `${months[checkDate.getMonth()]}月${checkDate.getDate()}日`;
    } catch {
      return dateStr;
    }
  };

  // 計算單次訓練的總負重
  const calculateVolume = (session: SessionData) => {
    let total = 0;
    session.exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        const w = set.weightKg ? parseFloat(set.weightKg) : 0;
        const r = set.reps ? set.reps : 0;
        total += w * r;
      });
    });
    return total;
  };

  // 計算單次訓練的總組數
  const countSets = (session: SessionData) => {
    let count = 0;
    session.exercises.forEach((ex) => {
      count += ex.sets.length;
    });
    return count;
  };

  // 刪除訓練紀錄
  const handleDelete = async (sessionId: string) => {
    setIsDeleting(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // 從畫面移除已刪除的紀錄
        setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
        setDeleteConfirmId(null);
      } else {
        alert("刪除紀錄失敗，請稍後再試");
      }
    } catch (err) {
      console.error(err);
      alert("網路錯誤，無法刪除");
    } finally {
      setIsDeleting(null);
    }
  };

  if (sessions.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: "3rem 1.5rem",
        background: "var(--card)",
        borderRadius: "16px",
        border: "1px solid var(--border)",
        color: "var(--muted)"
      }}>
        <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.75rem" }}>🗒️</span>
        <p style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--foreground)" }}>尚無訓練紀錄</p>
        <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>今天就開始你的第一筆健身紀錄吧！</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {sessions.map((session) => {
        const isExpanded = !!expandedSessionIds[session.sessionId];
        const volume = calculateVolume(session);
        const setCount = countSets(session);
        const showDeleteConfirm = deleteConfirmId === session.sessionId;

        return (
          <div
            key={session.sessionId}
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              overflow: "hidden",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* 訓練紀錄摘要 */}
            <div
              onClick={() => toggleExpand(session.sessionId)}
              style={{
                padding: "1.25rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                userSelect: "none",
                background: isExpanded ? "var(--secondary)" : "none",
                transition: "background 0.2s ease",
              }}
            >
              <div>
                <p style={{ fontWeight: "750", fontSize: "1.05rem", color: "var(--foreground)", letterSpacing: "-0.01em" }}>
                  {session.title || "自主訓練"}
                </p>
                <p className="text-muted" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                  <span>{formatDate(session.sessionDate)}</span>
                  <span>•</span>
                  <span>{session.exercises.length} 個動作 ({setCount} 組)</span>
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: "800", color: volume > 0 ? "var(--accent)" : "var(--muted)", fontSize: "1.1rem" }}>
                    {volume > 0 ? `${volume.toLocaleString()} kg` : "自重"}
                  </p>
                  <p className="text-muted" style={{ fontSize: "0.75rem", fontWeight: "600" }}>總負重</p>
                </div>
                <span style={{
                  fontSize: "0.85rem",
                  color: "var(--muted)",
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                  display: "inline-block",
                }}>
                  ▼
                </span>
              </div>
            </div>

            {/* 展開後的訓練詳細資料 */}
            {isExpanded && (
              <div style={{
                padding: "1.25rem",
                borderTop: "1px solid var(--border)",
                background: "var(--card)",
                animation: "slideDown 0.2s ease",
              }}>
                {session.notes && (
                  <div style={{
                    background: "var(--secondary)",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    marginBottom: "1.25rem",
                    fontSize: "0.875rem",
                    borderLeft: "3px solid var(--primary)",
                  }}>
                    <p style={{ fontWeight: "700", marginBottom: "0.15rem", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--primary)" }}>備註</p>
                    <p style={{ color: "var(--foreground)" }}>{session.notes}</p>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {session.exercises.map((ex) => (
                    <div key={ex.exerciseId} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{
                          fontSize: "0.7rem",
                          fontWeight: "700",
                          background: "var(--secondary)",
                          color: "var(--primary)",
                          padding: "0.15rem 0.4rem",
                          borderRadius: "4px",
                        }}>
                          {ex.workoutItem.bodyPart.partName}
                        </span>
                        <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--foreground)" }}>
                          {ex.workoutItem.itemName}
                        </h4>
                      </div>

                      {/* 組數清單 */}
                      <div style={{
                        paddingLeft: "0.5rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                      }}>
                        {ex.sets.map((set) => {
                          const w = set.weightKg ? parseFloat(set.weightKg) : 0;
                          const r = set.reps ? set.reps : 0;
                          return (
                            <div
                              key={set.setId}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "1rem",
                                fontSize: "0.875rem",
                                color: "var(--secondary-foreground)",
                              }}
                            >
                              <span style={{ color: "var(--muted)", width: "30px", fontWeight: "600" }}>第 {set.setNumber} 組</span>
                              <span style={{ fontWeight: "600", color: "var(--foreground)" }}>
                                {w > 0 ? `${w} kg` : "自重"} × {r} 次
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 訓練紀錄操作按鈕 */}
                <div style={{
                  marginTop: "1.5rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center"
                }}>
                  {showDeleteConfirm ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", animation: "fadeIn 0.2s ease" }}>
                      <span style={{ fontSize: "0.85rem", color: "red", fontWeight: "600" }}>確定刪除？</span>
                      <button
                        onClick={() => handleDelete(session.sessionId)}
                        disabled={isDeleting === session.sessionId}
                        className="btn-primary"
                        style={{
                          background: "red",
                          color: "white",
                          padding: "0.35rem 0.85rem",
                          borderRadius: "8px",
                          fontSize: "0.8rem",
                          fontWeight: "700",
                        }}
                      >
                        {isDeleting === session.sessionId ? "刪除中..." : "確定"}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="btn-secondary"
                        style={{
                          padding: "0.35rem 0.85rem",
                          borderRadius: "8px",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                        }}
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
                      <Link
                        href={`/sessions/${session.sessionId}/edit`}
                        style={{
                          textDecoration: "none",
                          color: "var(--primary)",
                          fontSize: "0.85rem",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          transition: "opacity 0.2s ease",
                        }}
                      >
                        <span>✏️</span> <span>編輯紀錄</span>
                      </Link>
                      <button
                        onClick={() => setDeleteConfirmId(session.sessionId)}
                        style={{
                          background: "none",
                          color: "var(--muted)",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "red"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--muted)"}
                      >
                        <span>🗑️</span> <span>刪除紀錄</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <style jsx global>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
