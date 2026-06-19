"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface WorkoutItem {
  itemId: number;
  itemName: string;
  partId: number;
  description: string | null;
  bodyPart: {
    partId: number;
    partName: string;
  };
}

export default function WorkoutItemsPage() {
  const [items, setItems] = useState<WorkoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPart, setSelectedPart] = useState("全部");

  useEffect(() => {
    fetch("/api/workout-items")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setItems(data);
        }
      })
      .catch((err) => console.error("取得動作清單失敗：", err))
      .finally(() => setLoading(false));
  }, []);

  const partNames = ["全部", ...Array.from(new Set(items.map((i) => i.bodyPart.partName)))];

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPart = selectedPart === "全部" || item.bodyPart.partName === selectedPart;
    return matchesSearch && matchesPart;
  });

  return (
    <main className="container" style={{ paddingBottom: "100px" }}>
      {/* 頁首 */}
      <header style={{ marginBottom: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ textDecoration: "none", color: "var(--muted)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.95rem" }}>
          <span>←</span> <span>返回首頁</span>
        </Link>
        <h1 style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--foreground)", letterSpacing: "-0.025em" }}>健身動作庫</h1>
        <div style={{ width: "60px" }}></div> {/* 保持標題置中 */}
      </header>

      {/* 說明文字 */}
      <div style={{ marginBottom: "2rem" }}>
        <p className="text-muted" style={{ fontSize: "0.95rem" }}>
          瀏覽或搜尋預設的健身訓練動作。這些動作會顯示在新增訓練的動作選單中。
        </p>
      </div>

      {/* 搜尋欄位 */}
      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜尋動作名稱或描述..."
          style={{
            width: "100%",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "0.75rem 1rem",
            fontSize: "0.95rem",
            color: "var(--foreground)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
          }}
        />
      </div>

      {/* 部位篩選 */}
      <div style={{
        display: "flex",
        gap: "0.5rem",
        overflowX: "auto",
        paddingBottom: "0.75rem",
        marginBottom: "1.5rem",
        scrollbarWidth: "none",
      }}>
        {partNames.map((part) => (
          <button
            key={part}
            onClick={() => setSelectedPart(part)}
            style={{
              whiteSpace: "nowrap",
              padding: "0.4rem 0.85rem",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: "600",
              background: selectedPart === part ? "var(--primary)" : "var(--card)",
              color: selectedPart === part ? "var(--primary-foreground)" : "var(--secondary-foreground)",
              border: selectedPart === part ? "none" : "1px solid var(--border)",
            }}
          >
            {part}
          </button>
        ))}
      </div>

      {/* 動作清單 */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--muted)" }}>
          載入動作庫中...
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "4rem 1.5rem",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          color: "var(--muted)",
        }}>
          沒有找到符合「{searchQuery}」的動作
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.75rem" }}>
          {filteredItems.map((item) => (
            <div
              key={item.itemId}
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 1px 2px rgba(0,0,0,0.01)",
              }}
            >
              <div>
                <h3 style={{ fontSize: "0.975rem", fontWeight: "700", color: "var(--foreground)" }}>
                  {item.itemName}
                </h3>
                {item.description && (
                  <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.15rem" }}>
                    {item.description}
                  </p>
                )}
              </div>
              <span style={{
                fontSize: "0.75rem",
                fontWeight: "700",
                background: "var(--secondary)",
                color: "var(--primary)",
                padding: "0.25rem 0.6rem",
                borderRadius: "6px",
                whiteSpace: "nowrap",
              }}>
                {item.bodyPart.partName}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
