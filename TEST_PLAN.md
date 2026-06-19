# FlexTrack Test Plan

This document defines the current manual/API/DB verification plan for the workout web app. It is based on the current implementation and does not assume that features work until verified.

## Summary

Testing is split into three layers:

- UI happy path: registration, login/logout, session CRUD, workout item browsing.
- API behavior: validation, authentication, authorization, and response contracts.
- Data consistency: complete writes, reconciliation updates, cascade delete, and orphan checks.

Current implementation notes:

- Session CRUD APIs exist: `GET/POST /api/sessions`, `GET/PUT/DELETE /api/sessions/:id`.
- Workout Item APIs currently support create/read only: `GET/POST /api/workout-items`, `GET /api/workout-items/:id`.
- Workout Item update/delete APIs and UI are not currently implemented.
- The home page reads session history directly in a Server Component instead of calling `GET /api/sessions`.
- `workout_item` currently has no `userId`, so newly created workout items are global, not user-owned.

## Preconditions

- Use a test database or a database where test data can be safely created and deleted.
- Run seed data before testing if body parts or default workout items are missing.
- Prepare two accounts:
  - `User A`
  - `User B`
- Keep browser DevTools, Postman, curl, or another API client available for direct API checks.
- For DB consistency checks, use Drizzle Studio or SQL queries against the test database.

## Recommended Test Order

### Highest Priority

- [o] Run `npm run lint`.
- [o] Run `npm run build`.
- [o] Verify registration, login, and logout.
- [o] Verify session create/read/update/delete.
- [o] Verify unauthenticated session APIs return `401`.
- [o] Verify User A cannot read, update, or delete User B's session.
- [o] Verify cascade delete removes child `session_exercise` and `exercise_set` records.

### Second Priority

- [o] Verify session payload validation.
- [ ] Verify workout item create validation.
- [ ] Verify session edit reconciliation: add/remove sets and exercises.

### Last Priority

- [ ] Verify `GET /api/health`.
- [ ] Verify `GET /api/workout-items/:id`.
- [ ] Verify workout item page search/filter UI.
- [ ] Verify boundary values: long text, special characters, invalid dates, `weightKg: 0`, decimal weight.

## Functional Tests

### Registration

- [o] Register a new user.
  - Steps: Open `/register`, enter name/account/email/password, submit.
  - Expected: Success alert appears, user is redirected to `/login`, DB `user` row exists, and `passwordHash` is not plain text.

### Login

- [o] Log in with valid credentials.
  - Steps: Open `/login`, enter valid email/password, submit.
  - Expected: User is redirected to `/`, home page shows user name, logout button, and "開始新訓練".

### Logout

- [o] Log out.
  - Steps: Click logout after login.
  - Expected: User is redirected to `/`, home page shows logged-out landing state.

### Session Create

- [o] Create a workout session.
  - Steps: Log in, open `/sessions/new`, add one exercise, keep or modify first set, click complete.
  - Expected: User returns to home page, history contains the new session, DB contains matching `workout_session`, `session_exercise`, and `exercise_set` rows.

### Session History

- [o] View workout history.
  - Steps: Log in, open `/`, expand a session.
  - Expected: UI shows title/date, exercise, body part, sets, and total volume. Only current user's sessions are visible.

### Session Edit

- [o] Edit a session.
  - Steps: Expand a history item, click edit, update title/date/notes, modify weight/reps, add a set, remove a set, save.
  - Expected: User returns to home page, updated data is shown, old removed set is not left in DB, set numbers remain reasonable.

### Session Delete

- [o] Delete a session.
  - Steps: Expand a history item, click delete, confirm.
  - Expected: UI removes the session, parent session is deleted from DB, child exercises and sets are also deleted.

### Workout Item Read

- [ ] Browse workout items.
  - Steps: Open `/workout-items`, search by name/description, switch body-part filter.
  - Expected: List loads, search works, filter works.

### Workout Item Create API

- [ ] Create a workout item through API.
  - Steps: While logged in, call `POST /api/workout-items` with valid `itemName`, existing `partId`, and optional `description`.
  - Expected: `200`, response includes `message: "新增動作成功"` and `item`; `GET /api/workout-items` includes the new item.

### Workout Item Update/Delete Gap

- [ ] Confirm update/delete are not implemented.
  - Steps: Check for `PUT/PATCH/DELETE /api/workout-items/:id` or corresponding UI.
  - Expected: These are currently absent and should be recorded as a feature gap, not a test failure.

## Validation Tests

### Registration Validation

- [o] `POST /api/auth/register` with missing email or password.
  - Expected: `400`, `{ "error": "信箱或密碼不可為空" }`.

- [o] `POST /api/auth/register` with duplicate email.
  - Expected: `400`, `{ "error": "此帳號已存在" }`.

- [o] `POST /api/auth/register` with duplicate account.
  - Expected: Current implementation may return `500` due to DB unique constraint. Record as a risk.

### Session Payload Validation

- [o] `POST /api/sessions` with invalid JSON.
  - Expected: `400`, `{ "error": "Invalid JSON body" }`.

- [o] `POST /api/sessions` with body that is not an object.
  - Expected: `400`, `{ "error": "Request body must be an object" }`.

- [o] `POST /api/sessions` without `sessionDate`.
  - Expected: `400`, `{ "error": "Session date is required" }`.

- [o] `POST /api/sessions` with non-`YYYY-MM-DD` `sessionDate`.
  - Expected: `400`, `{ "error": "Session date must use YYYY-MM-DD format" }`.

- [o] `POST /api/sessions` with `exercises: []`.
  - Expected: `400`, `{ "error": "At least one exercise is required" }`.

- [o] `POST /api/sessions` with an exercise that is not an object.
  - Expected: `400`, `{ "error": "Each exercise must be an object" }`.

- [o] `POST /api/sessions` with missing sets or `sets: []`.
  - Expected: `400`, `{ "error": "Each exercise must include at least one set" }`.

- [o] `POST /api/sessions` with a set that is not an object.
  - Expected: `400`, `{ "error": "Each set must be an object" }`.

- [o] `POST /api/sessions` with a set that has no reps, weight, or duration.
  - Expected: `400`, `{ "error": "Each set must include reps, weight, or duration" }`.

- [o] `POST /api/sessions` with nonexistent `itemId`.
  - Expected: `400`, `{ "error": "Workout item not found" }`.

- [o] `POST /api/sessions` with `weightKg: -1`.
  - Expected: `400`, `{ "error": "weightKg must be a non-negative number" }`.

- [o] `POST /api/sessions` with `reps: 0` or `reps: -1`.
  - Expected: `400`, `{ "error": "reps must be a positive integer" }`.

- [o] `POST /api/sessions` with `weightKg: 0` and `reps > 0`.
  - Expected: `201`; this represents bodyweight training.

### Workout Item Validation

- [ ] `POST /api/workout-items` with invalid JSON.
  - Expected: `400`, `{ "error": "Invalid JSON body" }`.

- [ ] `POST /api/workout-items` with empty `itemName`.
  - Expected: `400`, `{ "error": "動作名稱或欄位不可為空" }`.

- [ ] `POST /api/workout-items` with nonexistent `partId`.
  - Expected: `400`, `{ "error": "找不到指定的訓練部位" }`.

- [ ] `POST /api/workout-items` with duplicate `itemName`.
  - Expected: `400`, `{ "error": "此動作已存在" }`.

- [ ] `GET /api/workout-items/:id` with non-positive or non-integer id.
  - Expected: `400`, `{ "error": "動作 ID 格式不正確" }`.

- [ ] `GET /api/workout-items/:id` with nonexistent id.
  - Expected: `404`, `{ "error": "找不到該動作" }`.

## Authentication Tests

- [o] Unauthenticated `GET /api/sessions`.
  - Expected: `401`, `{ "error": "Unauthorized" }`.

- [o] Unauthenticated `POST /api/sessions`.
  - Expected: `401`, `{ "error": "Unauthorized" }`.

- [o] Unauthenticated `GET /api/sessions/:id`.
  - Expected: `401`, `{ "error": "Unauthorized" }`.

- [o] Unauthenticated `PUT /api/sessions/:id`.
  - Expected: `401`, `{ "error": "Unauthorized" }`.

- [o] Unauthenticated `DELETE /api/sessions/:id`.
  - Expected: `401`, `{ "error": "Unauthorized" }`.

- [o] Unauthenticated `POST /api/workout-items`.
  - Expected: `401`, `{ "error": "Unauthorized" }`.

- [o] Unauthenticated user opens `/sessions/new`.
  - Expected: Page may load, but saving should fail with API `401`. Record this as a UX risk.

- [o] Unauthenticated user opens `/sessions/:id/edit`.
  - Expected: API returns `401`; page should alert and return home. Record actual behavior.

## Authorization Tests

- [o] User B calls `GET /api/sessions` after User A creates a session.
  - Expected: User B response does not include User A's session.

- [o] User B calls `GET /api/sessions/:userASessionId`.
  - Expected: `403`, `{ "error": "Forbidden" }`.

- [o] User B calls `PUT /api/sessions/:userASessionId` with a valid payload.
  - Expected: `403`, `{ "error": "Forbidden" }`.

- [o] User B calls `DELETE /api/sessions/:userASessionId`.
  - Expected: `403`, `{ "error": "Forbidden" }`; User A's session still exists.

- [o] User A updates a session using an `exerciseId` not belonging to that session.
  - Expected: `400`, `{ "error": "Exercise does not belong to this session" }`.

- [o] User A updates a session using a `setId` not belonging to that session.
  - Expected: `400`, `{ "error": "Set does not belong to this session" }`.

- [o] User A sends a valid `setId` under the wrong exercise.
  - Expected: `400`, `{ "error": "Set does not belong to the provided exercise" }`.

## Data Consistency Tests

- [ ] Create a complete session.
  - Steps: Create one session with two exercises and two sets per exercise.
  - Expected: DB has one `workout_session`, two `session_exercise`, four `exercise_set`, and valid FK relationships.

- [ ] Update session base fields.
  - Expected: title/date/notes change; exercise/set rows are not unexpectedly inserted or deleted.

- [ ] Add an exercise during session update.
  - Expected: New `session_exercise` exists and its sets are correct.

- [ ] Remove an exercise during session update.
  - Expected: Removed `session_exercise` is gone and its sets are gone.

- [ ] Add a set during session update.
  - Expected: New `exercise_set` belongs to the correct exercise.

- [ ] Remove a set during session update.
  - Expected: Removed set is gone; unrelated sets remain.

- [o] Delete cascade.
  - Expected: Deleting `workout_session` removes related `session_exercise` and `exercise_set`.

- [ ] Orphan records check.
  - Expected: No `session_exercise.session_id` points to a missing `workout_session`; no `exercise_set.exercise_id` points to a missing `session_exercise`.

- [ ] Partial failure check.
  - Steps: Trigger failure with nonexistent `itemId` or invalid payload and compare DB before/after.
  - Expected: No session is created; if a partial session was created before failure, cleanup removes it.

## API Matrix

| API | Scenario | Expected Status | Expected Response |
|---|---|---:|---|
| `POST /api/auth/register` | Valid registration | `200` | `{ message, user }` |
| `POST /api/auth/register` | Missing email/password | `400` | `{ error: "信箱或密碼不可為空" }` |
| `POST /api/auth/register` | Duplicate email | `400` | `{ error: "此帳號已存在" }` |
| `GET /api/health` | DB reachable | `200` | `{ status: "ok", message, data }` |
| `GET /api/workout-items` | Read item library | `200` | `WorkoutItem[]` with `bodyPart` |
| `POST /api/workout-items` | Unauthenticated | `401` | `{ error: "Unauthorized" }` |
| `POST /api/workout-items` | Valid create | `200` | `{ message: "新增動作成功", item }` |
| `POST /api/workout-items` | Empty name or invalid part | `400` | `{ error }` |
| `GET /api/workout-items/:id` | Valid ID | `200` | `WorkoutItem[]` |
| `GET /api/workout-items/:id` | Invalid ID | `400` | `{ error: "動作 ID 格式不正確" }` |
| `GET /api/workout-items/:id` | Missing ID | `404` | `{ error: "找不到該動作" }` |
| `GET /api/sessions` | Unauthenticated | `401` | `{ error: "Unauthorized" }` |
| `GET /api/sessions` | Authenticated | `200` | Current user `SessionData[]` |
| `POST /api/sessions` | Unauthenticated | `401` | `{ error: "Unauthorized" }` |
| `POST /api/sessions` | Valid create | `201` | `{ message: "新增訓練紀錄成功", session }` |
| `POST /api/sessions` | Invalid JSON | `400` | `{ error: "Invalid JSON body" }` |
| `POST /api/sessions` | Validation failure | `400` | `{ error: validationMessage }` |
| `GET /api/sessions/:id` | Owner | `200` | `SessionData` |
| `GET /api/sessions/:id` | Unauthenticated | `401` | `{ error: "Unauthorized" }` |
| `GET /api/sessions/:id` | Missing session | `404` | `{ error: "Workout session not found" }` |
| `GET /api/sessions/:id` | Non-owner | `403` | `{ error: "Forbidden" }` |
| `PUT /api/sessions/:id` | Owner valid update | `200` | `{ message: "訓練紀錄修改成功" }` |
| `PUT /api/sessions/:id` | Unauthenticated | `401` | `{ error: "Unauthorized" }` |
| `PUT /api/sessions/:id` | Non-owner with valid payload | `403` | `{ error: "Forbidden" }` |
| `PUT /api/sessions/:id` | Invalid JSON | `400` | `{ error: "Invalid JSON body" }` |
| `PUT /api/sessions/:id` | Nonexistent itemId | `400` | `{ error: "Workout item not found" }` |
| `PUT /api/sessions/:id` | Foreign exercise/set ID | `400` | `{ error }` |
| `DELETE /api/sessions/:id` | Owner | `200` | `{ message: "訓練紀錄已成功刪除" }` |
| `DELETE /api/sessions/:id` | Unauthenticated | `401` | `{ error: "Unauthorized" }` |
| `DELETE /api/sessions/:id` | Non-owner | `403` | `{ error: "Forbidden" }` |
| `DELETE /api/sessions/:id` | Missing session | `404` | `{ error: "Workout session not found" }` |

## High-Risk and Often-Missed Cases

- `PUT /api/sessions/:id` validates payload before ownership checks. Use a valid payload when testing non-owner access, otherwise the test may return `400` before authorization is reached.
- `POST /api/workout-items` creates global workout items because `workout_item` has no `userId`. This conflicts with a future user-customizable item library model.
- `GET /api/workout-items/:id` returns an array, not a single object. Test current behavior, but record the API consistency risk.
- Duplicate `account` during registration may return `500` instead of a clear validation error.
- Frontend number inputs can submit empty strings, decimals, or negative values. API behavior must be tested directly.
- Date validation currently checks format, not calendar validity. Test values like `2026-99-99`.
- Very long `title`, `itemName`, or `description` may hit DB constraints and return `500`.
- Home page and `GET /api/sessions` are separate data paths. Test both to catch drift.
- Session creation/update uses multiple writes without transactions. Failed writes must be checked for partial data.
- Cascade delete must be verified in the DB, not only through UI removal.
- Workout Item Update/Delete are not implemented. Treat this as a product gap if CRUD is required.

## Test Run - 2026-06-14
- Environment: test DB
- Tester: 陳
- Result: partial
- Issues found:
  - 重複account 回傳500，要補上錯誤處理
  - 輸入錯誤的密碼會導致系統crash，目前沒有相對應的處理

## Test Run - 2026-06-18
- Environment: test DB
- Tester: 陳
- Result: partial
- Issues found:
  - 未登入進 /sessions/:id/edit 會顯示 Error: 訓練紀錄不存在，但實際上有該紀錄，只是使用者沒有驗證所以無法存取
  - User_session 不會自動 expire，若沒有登出直接把連線中斷，重新連上後依然會顯示登入


