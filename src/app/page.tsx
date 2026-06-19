import React from "react";
import { auth } from "@/auth";
import LogoutButton from "@/components/auth/LogoutButton";
import Link from "next/link";
import { db } from "@/db";
import { workoutSession } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import WorkoutHistoryList from "@/components/workout/WorkoutHistoryList";
import type { SessionData } from "@/types/workout";

export default async function HomePage() {
  const session = await auth();

  // 未登入時顯示介紹與登入入口
  if (!session) {
    return (
      <main className="container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", textAlign: "center" }}>
        <div style={{ marginBottom: "2rem" }}>
            <Link href="/" style={{ fontSize: "1.5rem", fontWeight: "900", color: "var(--foreground)", textDecoration: "none", letterSpacing: "-0.05em" }}>
                FLEX<span style={{ color: "var(--primary)" }}>TRACK</span>
            </Link>
        </div>
        <header style={{ marginBottom: "3rem" }}>
          <h1 style={{ fontSize: "3rem", fontWeight: "900", lineHeight: "1.2", marginBottom: "1rem" }}>
            追蹤你的進度，<br />
            <span style={{ color: "var(--primary)" }}>成就更好的自己。</span>
          </h1>
          <p className="text-muted" style={{ fontSize: "1.125rem", maxWidth: "500px", margin: "0 auto" }}>
            最簡約、優雅的健身紀錄工具。專為追求效率與質感的你設計，輕鬆紀錄每一組訓練。
          </p>
        </header>

        <div style={{ display: "flex", gap: "1rem" }}>
          <Link href="/register" className="btn-primary" style={{ textDecoration: "none" }}>立即註冊</Link>
          <Link href="/login" className="btn-secondary" style={{ textDecoration: "none" }}>登入帳號</Link>
        </div>

        <div style={{ marginTop: "4rem", opacity: 0.5, fontSize: "0.875rem" }} className="text-muted">
          ✦ 簡單操作 ✦ 數據分析 ✦ 完全免費
        </div>
      </main>
    );
  }

  // 取得已登入使用者的訓練紀錄
  const userId = (session.user as { id?: string })?.id;
  let userSessions: SessionData[] = [];
  let weeklyCount = 0;
  let weeklyVolume = 0;

  if (userId) {
    try {
      userSessions = await db.query.workoutSession.findMany({
        where: eq(workoutSession.userId, userId),
        orderBy: [desc(workoutSession.sessionDate), desc(workoutSession.createdAt)],
        with: {
          exercises: {
            orderBy: (exercises, { asc }) => [asc(exercises.orderNum)],
            with: {
              workoutItem: {
                with: {
                  bodyPart: true,
                }
              },
              sets: {
                orderBy: (sets, { asc }) => [asc(sets.setNumber)],
              },
            }
          }
        }
      });

      // 計算本週資料（週一 00:00:00 到現在）
      const today = new Date();
      const day = today.getDay();
      const mondayDiff = today.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(today.getFullYear(), today.getMonth(), mondayDiff, 0, 0, 0, 0);

      const sessionsThisWeek = userSessions.filter((s) => {
        const sDate = new Date(s.sessionDate);
        return sDate >= startOfWeek;
      });

      weeklyCount = sessionsThisWeek.length;

      sessionsThisWeek.forEach((s) => {
        s.exercises.forEach((ex) => {
          ex.sets.forEach((set) => {
            const w = set.weightKg ? parseFloat(set.weightKg) : 0;
            const r = set.reps ? set.reps : 0;
            weeklyVolume += w * r;
          });
        });
      });
    } catch (error) {
      console.error("Failed to query user sessions or compute stats:", error);
    }
  }

  // 已登入時顯示訓練儀表板
  return (
    <main className="container" style={{ paddingBottom: "100px" }}>
      {/* 頁首 */}
      <header style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "800", letterSpacing: "-0.025em" }}>
            {session.user?.name}，歡迎回來！
          </h1>
          <p className="text-muted">準備好開始今天的訓練了嗎？</p>
        </div>
        <LogoutButton />
      </header>

      {/* 本週訓練摘要 */}
      <div className="card" style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
        <div>
          <p className="text-muted">本週訓練</p>
          <p style={{ fontSize: "1.5rem", fontWeight: "700" }}>{weeklyCount} 次</p>
        </div>
        <div style={{ borderLeft: "1px solid var(--border)", height: "40px", alignSelf: "center" }}></div>
        <div>
          <p className="text-muted">本週累計負重</p>
          <p style={{ fontSize: "1.5rem", fontWeight: "700" }}>
            {weeklyVolume > 0 ? `${weeklyVolume.toLocaleString()} kg` : "0 kg"}
          </p>
        </div>
      </div>

      {/* 快速操作 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2.5rem" }}>
        <Link
          href="/sessions/new"
          className="btn-primary"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            padding: "1.5rem",
            textDecoration: "none",
            background: "linear-gradient(135deg, var(--primary) 0%, #2563eb 100%)",
            boxShadow: "0 4px 14px rgba(59, 130, 246, 0.25)",
            borderRadius: "16px",
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>➕</span>
          <span style={{ fontWeight: "700" }}>開始新訓練</span>
        </Link>
        <Link
          href="/workout-items"
          className="btn-secondary"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            padding: "1.5rem",
            textDecoration: "none",
            borderRadius: "16px",
            border: "1px solid var(--border)",
            background: "var(--card)",
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>📚</span>
          <span style={{ fontWeight: "700", color: "var(--foreground)" }}>動作庫</span>
        </Link>
      </div>

      {/* 訓練歷史紀錄 */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "700" }}>訓練歷史紀錄</h2>
          <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: "600" }}>
            共 {userSessions.length} 筆
          </span>
        </div>

        <WorkoutHistoryList initialSessions={userSessions} />
      </section>

      {/* 底部導覽列 */}
      <nav style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--card)",
        borderTop: "1px solid var(--border)",
        padding: "0.75rem 0",
        display: "flex",
        justifyContent: "space-around",
        zIndex: 10
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "var(--primary)" }}>
          <span style={{ fontSize: "1.25rem" }}>🏠</span>
          <span style={{ fontSize: "0.7rem", fontWeight: "600" }}>首頁</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.4 }}>
          <span style={{ fontSize: "1.25rem" }}>📊</span>
          <span style={{ fontSize: "0.7rem", fontWeight: "600" }}>分析</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.4 }}>
          <span style={{ fontSize: "1.25rem" }}>👤</span>
          <span style={{ fontSize: "0.7rem", fontWeight: "600" }}>我的</span>
        </div>
      </nav>
    </main>
  );
}
