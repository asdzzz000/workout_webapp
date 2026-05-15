import React from "react";
import { auth } from "@/auth";
import LogoutButton from "@/components/auth/LogoutButton";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();

  // 如果使用者未登入，顯示 Landing Page
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

  // 如果使用者已登入，顯示 Dashboard
  return (
    <main className="container" style={{ paddingBottom: "100px" }}>
      {/* Header Section */}
      <header style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "800", letterSpacing: "-0.025em" }}>
            {session.user?.name}，歡迎回來！
          </h1>
          <p className="text-muted">準備好開始今天的訓練了嗎？</p>
        </div>
        <LogoutButton />
      </header>

      {/* Summary Statistics Card */}
      <div className="card" style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
        <div>
          <p className="text-muted">本週訓練</p>
          <p style={{ fontSize: "1.5rem", fontWeight: "700" }}>3 次</p>
        </div>
        <div style={{ borderLeft: "1px solid var(--border)", height: "40px", alignSelf: "center" }}></div>
        <div>
          <p className="text-muted">累計負重</p>
          <p style={{ fontSize: "1.5rem", fontWeight: "700" }}>1,250 kg</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2.5rem" }}>
        <button className="btn-primary" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "1.5rem" }}>
          <span style={{ fontSize: "1.5rem" }}>➕</span>
          <span>開始新訓練</span>
        </button>
        <button className="btn-secondary" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "1.5rem" }}>
          <span style={{ fontSize: "1.5rem" }}>📚</span>
          <span>動作庫</span>
        </button>
      </div>

      {/* Recent Activity Section */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "700" }}>最近紀錄</h2>
          <button style={{ background: "none", color: "var(--primary)", fontWeight: "600", fontSize: "0.875rem" }}>查看全部</button>
        </div>

        <div className="card" style={{ padding: "0" }}>
          {[
            { id: 1, date: "今天", title: "胸部與三頭肌", duration: "45 min", weight: "450kg" },
            { id: 2, date: "昨天", title: "背部與二頭肌", duration: "60 min", weight: "800kg" },
          ].map((workout, index, arr) => (
            <div
              key={workout.id}
              style={{
                padding: "1.25rem",
                borderBottom: index === arr.length - 1 ? "none" : "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <p style={{ fontWeight: "600" }}>{workout.title}</p>
                <p className="text-muted">{workout.date} • {workout.duration}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontWeight: "700", color: "var(--accent)" }}>{workout.weight}</p>
                <p className="text-muted">總負重</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation Placeholder (Bottom) */}
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