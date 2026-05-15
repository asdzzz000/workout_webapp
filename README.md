# FlexTrack - 健身紀錄 Web App

這是一個基於 Next.js 15+、Drizzle ORM 與 PostgreSQL (Neon) 構建的簡約健身紀錄應用程式。

---

## 🚀 API 接口規劃

### 🔐 認證 (Authentication)
| 方法 | 路由 | 功能 |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | 使用者註冊 |
| `POST` | `/api/auth/login` | 使用者登入 |

### 📚 動作資料庫 (Workout Items)
*預設動作資料，通常為唯讀*
| 方法 | 路由 | 功能 |
| :--- | :--- | :--- |
| `GET` | `/api/workout-items` | 取得所有訓練動作 (可加 `?part=胸部` 篩選) |
| `GET` | `/api/workout-items/:id` | 取得特定訓練動作細節 |

### 📅 訓練紀錄 (Workout Sessions)
*代表「每一次」的健身流程*
| 方法 | 路由 | 功能 |
| :--- | :--- | :--- |
| `POST` | `/api/sessions` | 新增一筆訓練紀錄 |
| `GET` | `/api/sessions` | 取得目前使用者的所有訓練歷史 |
| `GET` | `/api/sessions/:id` | 取得單次訓練的完整詳細 (含動作與組數) |
| `PUT` | `/api/sessions/:id` | 修改訓練標題、日期或筆記 |
| `DELETE` | `/api/sessions/:id` | 刪除單次訓練紀錄 |

### 🏋️ 訓練動作 (Session Exercises)
*單次訓練中包含的具體動作*
| 方法 | 路由 | 功能 |
| :--- | :--- | :--- |
| `POST` | `/api/exercises` | 新增動作到特定訓練中 (需帶 `sessionId` & `itemId`) |
| `PUT` | `/api/exercises/:id` | 修改動作在 UI 中的顯示順序 |
| `DELETE` | `/api/exercises/:id` | 從訓練中移除該動作 |

### 🔢 組數紀錄 (Exercise Sets)
*每個動作下的具體重量與次數*
| 方法 | 路由 | 功能 |
| :--- | :--- | :--- |
| `POST` | `/api/sets` | 為動作新增一組紀錄 (需帶 `exerciseId`) |
| `PUT` | `/api/sets/:id` | 修改該組的重量、次數或筆記 |
| `DELETE` | `/api/sets/:id` | 刪除該組紀錄 |

---

## 🛠 開發指南

### 指令集
- `npm run dev`: 啟動開發伺服器 (Port: 3001)
- `npm run db:generate`: 產生資料庫遷移文件
- `npm run db:migrate`: 執行資料庫遷移
- `npm run db:seed`: 注入初始部位與動作資料
- `npm run db:studio`: 開啟 Drizzle 視覺化管理介面
