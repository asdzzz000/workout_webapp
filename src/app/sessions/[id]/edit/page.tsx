"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import type {
  ApiErrorResponse,
  ExerciseSetInput,
  SelectedExerciseInput,
  SessionData,
  SessionRequest,
  WorkoutItemData,
} from "@/types/workout";

export default function EditSessionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  // 訓練基本資料
  const [title, setTitle] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [notes, setNotes] = useState("");

  // 本次訓練已選擇的動作
  const [selectedExercises, setSelectedExercises] = useState<SelectedExerciseInput[]>([]);

  // 動作資料庫清單
  const [allWorkoutItems, setAllWorkoutItems] = useState<WorkoutItemData[]>([]);

  // 畫面狀態
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPartFilter, setSelectedPartFilter] = useState("全部");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // 取得動作清單與原始訓練紀錄
  useEffect(() => {
    if (!sessionId) return;

    // 1. 取得動作資料庫
    const fetchExercisesDB = fetch("/api/workout-items")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAllWorkoutItems(data);
        }
      });

    // 2. 取得原始訓練詳細資料
    const fetchOriginalSession = fetch(`/api/sessions/${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error("訓練紀錄不存在");
        return res.json() as Promise<SessionData>;
      })
      .then((data) => {
        setTitle(data.title || "自主訓練");
        setSessionDate(data.sessionDate);
        setNotes(data.notes || "");

        // 將資料庫回應轉成前端狀態格式
        const mappedExercises = data.exercises.map((ex) => ({
          exerciseId: ex.exerciseId, // 保留既有 ID 供更新時比對
          itemId: ex.itemId,
          itemName: ex.workoutItem.itemName,
          partName: ex.workoutItem.bodyPart.partName,
          sets: ex.sets.map((s) => ({
            setId: s.setId, // 保留既有 ID 供更新時比對
            setNumber: s.setNumber,
            weightKg: s.weightKg ? String(parseFloat(s.weightKg)) : "", // 將 "20.00" 顯示為 "20"
            reps: s.reps !== null ? String(s.reps) : "",
            isCompleted: s.notes === "Completed",
          })),
        }));
        setSelectedExercises(mappedExercises);
      });

    Promise.all([fetchExercisesDB, fetchOriginalSession])
      .catch((err) => {
        console.error(err);
        alert("載入訓練紀錄失敗，將返回首頁");
        router.push("/");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [sessionId, router]);

  // 依搜尋文字與部位篩選動作
  const filteredItems = allWorkoutItems.filter((item) => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedPartFilter === "全部" || item.bodyPart.partName === selectedPartFilter;
    return matchesSearch && matchesFilter;
  });

  // 取得不重複的部位名稱
  const partNames = ["全部", ...Array.from(new Set(allWorkoutItems.map((item) => item.bodyPart.partName)))];

  // 將動作加入本次訓練
  const handleAddExercise = (item: WorkoutItemData) => {
    if (selectedExercises.some((ex) => ex.itemId === item.itemId)) {
      setToastMessage(`「${item.itemName}」已經在訓練清單中囉！`);
      setTimeout(() => setToastMessage(""), 3000);
      setIsModalOpen(false);
      return;
    }

    const newExercise: SelectedExerciseInput = {
      itemId: item.itemId,
      itemName: item.itemName,
      partName: item.bodyPart.partName,
      sets: [
        {
          setNumber: 1,
          weightKg: "20",
          reps: "10",
          isCompleted: false,
        },
      ],
    };

    setSelectedExercises([...selectedExercises, newExercise]);
    setIsModalOpen(false);
    setSearchQuery("");
  };

  // 從本次訓練移除動作
  const handleRemoveExercise = (index: number) => {
    const updated = [...selectedExercises];
    updated.splice(index, 1);
    setSelectedExercises(updated);
  };

  // 為指定動作新增一組
  const handleAddSet = (exIndex: number) => {
    const updated = [...selectedExercises];
    const sets = updated[exIndex].sets;
    const lastSet = sets[sets.length - 1];

    const newSet: ExerciseSetInput = {
      setNumber: sets.length + 1,
      weightKg: lastSet ? lastSet.weightKg : "20",
      reps: lastSet ? lastSet.reps : "10",
      isCompleted: false,
    };

    updated[exIndex].sets = [...sets, newSet];
    setSelectedExercises(updated);
  };

  // 從指定動作移除一組
  const handleRemoveSet = (exIndex: number, setIndex: number) => {
    const updated = [...selectedExercises];
    const sets = [...updated[exIndex].sets];

    if (sets.length === 1) {
      handleRemoveExercise(exIndex);
      return;
    }

    sets.splice(setIndex, 1);
    // 重新編排組別編號
    const reindexedSets = sets.map((s, idx) => ({
      ...s,
      setNumber: idx + 1,
    }));

    updated[exIndex].sets = reindexedSets;
    setSelectedExercises(updated);
  };

  // 更新單組資料
  const handleUpdateSet = <K extends keyof ExerciseSetInput>(
    exIndex: number,
    setIndex: number,
    field: K,
    value: ExerciseSetInput[K]
  ) => {
    const updated = [...selectedExercises];
    const sets = [...updated[exIndex].sets];
    sets[setIndex] = {
      ...sets[setIndex],
      [field]: value,
    };
    updated[exIndex].sets = sets;
    setSelectedExercises(updated);
  };

  // 儲存訓練紀錄修改
  const handleSubmitWorkout = async () => {
    if (selectedExercises.length === 0) {
      alert("請至少新增一個訓練動作！");
      return;
    }

    setIsSubmitting(true);

    const payload: SessionRequest = {
      title,
      sessionDate,
      notes,
      exercises: selectedExercises.map((ex, exIndex) => ({
        exerciseId: ex.exerciseId, // 傳送既有動作 ID 供後端比對
        itemId: ex.itemId,
        orderNum: exIndex + 1,
        sets: ex.sets.map((s) => ({
          setId: s.setId, // 傳送既有組數 ID 供後端比對
          setNumber: s.setNumber,
          weightKg: s.weightKg ? parseFloat(s.weightKg) : null,
          reps: s.reps ? parseInt(s.reps, 10) : null,
          notes: s.isCompleted ? "Completed" : null,
        })),
      })),
    };

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowSuccessModal(true);
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1800);
      } else {
        const errData = await res.json() as ApiErrorResponse;
        alert(errData.error || "儲存訓練紀錄修改失敗");
      }
    } catch (err) {
      console.error(err);
      alert("網路錯誤，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="container" style={{ textAlign: "center", paddingTop: "20vh", color: "var(--muted)" }}>
        <p style={{ fontSize: "1.1rem" }}>載入訓練紀錄中...</p>
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingBottom: "100px", position: "relative" }}>
      {/* 提示訊息 */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--foreground)",
          color: "var(--background)",
          padding: "0.75rem 1.5rem",
          borderRadius: "30px",
          fontSize: "0.875rem",
          fontWeight: "600",
          zIndex: 1000,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          animation: "fadeIn 0.2s ease",
        }}>
          💡 {toastMessage}
        </div>
      )}

      {/* 頁首 */}
      <header style={{ marginBottom: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ textDecoration: "none", color: "var(--muted)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.95rem" }}>
          <span>←</span> <span>取消編輯</span>
        </Link>
        <h1 style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--foreground)", letterSpacing: "-0.025em" }}>修改訓練紀錄</h1>
        <button
          onClick={handleSubmitWorkout}
          disabled={isSubmitting || selectedExercises.length === 0}
          className="btn-primary"
          style={{
            padding: "0.5rem 1.25rem",
            fontSize: "0.9rem",
            opacity: selectedExercises.length === 0 ? 0.5 : 1,
            cursor: selectedExercises.length === 0 ? "not-allowed" : "pointer",
            background: "linear-gradient(135deg, var(--primary) 0%, #2563eb 100%)",
            boxShadow: "0 4px 14px rgba(59, 130, 246, 0.3)",
          }}
        >
          {isSubmitting ? "儲存中..." : "儲存修改"}
        </button>
      </header>

      {/* 訓練基本資料 */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>訓練標題</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：胸部與三頭肌"
            style={{
              width: "100%",
              background: "var(--secondary)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "0.75rem",
              fontSize: "1rem",
              color: "var(--foreground)",
              marginTop: "0.25rem",
              fontWeight: "600",
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>訓練日期</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              style={{
                width: "100%",
                background: "var(--secondary)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "0.75rem",
                fontSize: "1rem",
                color: "var(--foreground)",
                marginTop: "0.25rem",
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>備註（可選）</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="今天訓練狀態好嗎？有沒有突破重量？"
            rows={2}
            style={{
              width: "100%",
              background: "var(--secondary)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "0.75rem",
              fontSize: "0.95rem",
              color: "var(--foreground)",
              marginTop: "0.25rem",
              fontFamily: "inherit",
              resize: "none",
            }}
          />
        </div>
      </div>

      {/* 已選擇的訓練動作 */}
      <section style={{ marginTop: "2rem" }}>
        {selectedExercises.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "4rem 2rem",
            background: "var(--card)",
            borderRadius: "16px",
            border: "2px dashed var(--border)",
            color: "var(--muted)",
          }}>
            <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>🏋️‍♂️</span>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--foreground)", marginBottom: "0.5rem" }}>尚未新增動作</h3>
            <p style={{ fontSize: "0.9rem", maxWidth: "300px", margin: "0 auto 1.5rem" }}>
              選擇本次訓練要記錄的動作。
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary"
              style={{ padding: "0.6rem 1.5rem", borderRadius: "30px", fontSize: "0.9rem" }}
            >
              ➕ 新增訓練動作
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {selectedExercises.map((ex, exIndex) => (
              <div key={ex.itemId} className="card" style={{ padding: "1.25rem", marginBottom: 0 }}>
                {/* 動作標題 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--foreground)" }}>
                      {ex.itemName}
                    </h3>
                    <span style={{
                      display: "inline-block",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      background: "var(--secondary)",
                      color: "var(--primary)",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "6px",
                      marginTop: "0.25rem",
                    }}>
                      {ex.partName}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveExercise(exIndex)}
                    style={{
                      background: "none",
                      color: "red",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      opacity: 0.7,
                    }}
                  >
                    刪除動作
                  </button>
                </div>

                {/* 組數表格 */}
                <div style={{ width: "100%", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "280px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                        <th style={{ padding: "0.5rem 0.25rem", fontSize: "0.75rem", color: "var(--muted)", width: "12%" }}>組別</th>
                        <th style={{ padding: "0.5rem 0.25rem", fontSize: "0.75rem", color: "var(--muted)", width: "35%" }}>重量 (kg)</th>
                        <th style={{ padding: "0.5rem 0.25rem", fontSize: "0.75rem", color: "var(--muted)", width: "35%" }}>次數 (reps)</th>
                        <th style={{ padding: "0.5rem 0.25rem", fontSize: "0.75rem", color: "var(--muted)", width: "18%", textAlign: "center" }}>刪除</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ex.sets.map((set, setIndex) => (
                        <tr key={setIndex} style={{ borderBottom: "1px solid var(--border)", opacity: set.isCompleted ? 0.6 : 1 }}>
                          <td style={{ padding: "0.75rem 0.25rem", fontWeight: "700", fontSize: "0.95rem" }}>
                            {set.setNumber}
                          </td>
                          <td style={{ padding: "0.5rem 0.25rem" }}>
                            <input
                              type="number"
                              value={set.weightKg}
                              onChange={(e) => handleUpdateSet(exIndex, setIndex, "weightKg", e.target.value)}
                              placeholder="0"
                              style={{
                                width: "85%",
                                background: "var(--secondary)",
                                border: "none",
                                borderRadius: "8px",
                                padding: "0.4rem 0.5rem",
                                fontSize: "0.95rem",
                                color: "var(--foreground)",
                                fontWeight: "600",
                              }}
                            />
                          </td>
                          <td style={{ padding: "0.5rem 0.25rem" }}>
                            <input
                              type="number"
                              value={set.reps}
                              onChange={(e) => handleUpdateSet(exIndex, setIndex, "reps", e.target.value)}
                              placeholder="0"
                              style={{
                                width: "85%",
                                background: "var(--secondary)",
                                border: "none",
                                borderRadius: "8px",
                                padding: "0.4rem 0.5rem",
                                fontSize: "0.95rem",
                                color: "var(--foreground)",
                                fontWeight: "600",
                              }}
                            />
                          </td>
                          <td style={{ padding: "0.5rem 0.25rem", textAlign: "center" }}>
                            <button
                              onClick={() => handleRemoveSet(exIndex, setIndex)}
                              style={{
                                background: "none",
                                fontSize: "1.1rem",
                                color: "var(--muted)",
                                padding: "0.2rem",
                              }}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 新增組數按鈕 */}
                <button
                  onClick={() => handleAddSet(exIndex)}
                  className="btn-secondary"
                  style={{
                    width: "100%",
                    marginTop: "0.75rem",
                    padding: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    borderRadius: "8px",
                  }}
                >
                  ＋ 新增組數（沿用上一組）
                </button>
              </div>
            ))}

            {/* 繼續新增動作 */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-secondary"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "1rem",
                borderRadius: "16px",
                border: "1px dashed var(--border)",
                background: "var(--card)",
                fontWeight: "600",
              }}
            >
              <span>🏋️‍♂️</span>
              <span>繼續新增動作</span>
            </button>
          </div>
        )}
      </section>

      {/* 選擇訓練動作視窗 */}
      {isModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          zIndex: 100,
        }} onClick={() => setIsModalOpen(false)}>
          
          <div style={{
            background: "var(--card)",
            width: "100%",
            maxWidth: "600px",
            height: "80vh",
            borderTopLeftRadius: "24px",
            borderTopRightRadius: "24px",
            display: "flex",
            flexDirection: "column",
            animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            padding: "1.5rem",
            boxShadow: "0 -8px 24px rgba(0,0,0,0.15)",
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "800" }}>選擇訓練動作</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "var(--secondary)",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋動作名稱（例如：臥推、深蹲）"
              style={{
                width: "100%",
                background: "var(--secondary)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "0.75rem 1rem",
                fontSize: "0.95rem",
                color: "var(--foreground)",
                marginBottom: "1rem",
              }}
            />

            <div style={{
              display: "flex",
              gap: "0.5rem",
              overflowX: "auto",
              paddingBottom: "0.75rem",
              marginBottom: "1rem",
              scrollbarWidth: "none",
            }}>
              {partNames.map((part) => (
                <button
                  key={part}
                  onClick={() => setSelectedPartFilter(part)}
                  style={{
                    whiteSpace: "nowrap",
                    padding: "0.4rem 0.85rem",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    background: selectedPartFilter === part ? "var(--primary)" : "var(--secondary)",
                    color: selectedPartFilter === part ? "var(--primary-foreground)" : "var(--secondary-foreground)",
                  }}
                >
                  {part}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {filteredItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--muted)" }}>
                  沒有找到符合「{searchQuery}」的動作
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.itemId}
                    onClick={() => handleAddExercise(item)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1rem",
                      background: "var(--secondary)",
                      borderRadius: "12px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.01)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    <div>
                      <p style={{ fontWeight: "700", color: "var(--foreground)" }}>{item.itemName}</p>
                      {item.description && <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.15rem" }}>{item.description}</p>}
                    </div>
                    <span style={{
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      background: "var(--card)",
                      color: "var(--primary)",
                      padding: "0.25rem 0.6rem",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                    }}>
                      {item.bodyPart.partName}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 儲存成功畫面 */}
      {showSuccessModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "var(--background)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          animation: "fadeIn 0.3s ease",
        }}>
          <div style={{ textAlign: "center", maxWidth: "300px" }}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              border: "2px solid var(--accent)",
              fontSize: "3rem",
              animation: "bounce 0.8s infinite alternate",
            }}>
              🎉
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "900", marginBottom: "0.5rem" }}>修改成功！</h2>
            <p className="text-muted" style={{ fontSize: "0.95rem" }}>
              訓練紀錄已更新，正在返回首頁...
            </p>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-10px); }
        }
      `}</style>
    </main>
  );
}
