# Workout App Improvement Plan

## Project Assessment

The current focus is not on adding a large number of new features. Instead, priority should be given to improving:

* Stability
* Data Consistency
* Code Quality
* Documentation
* Type Safety

The goal is to strengthen, refine, and standardize the existing architecture rather than redesign the system.

---

# Improvement Priorities

## 1. Fix Text Encoding and Content Quality Issues

README files, seed data, UI labels, and some code comments currently contain corrupted or garbled text.

These issues negatively impact:

* User experience
* Code readability
* Maintenance efficiency
* AI-assisted development

### Tasks

* Review all README files
* Review seed data
* Review UI text and labels
* Review code comments
* Ensure all files use UTF-8 encoding
* Replace corrupted text with correct content

### Acceptance Criteria

* No corrupted text appears in README files
* No corrupted text appears in the UI
* Seed data displays correctly
* Comments are readable and meaningful

---

## 2. Perform Project Health Checks

Before making feature changes, verify that the project is currently in a healthy state.

### Tasks

Run:

```bash
npm run lint
npm run build
```

Fix any issues related to:

* TypeScript errors
* Import errors
* JSX syntax issues
* Build failures

### Acceptance Criteria

* Lint completes successfully
* Build completes successfully
* No obvious syntax or compilation errors remain

---

## 3. Align Documentation with Actual Implementation

The README currently contains API documentation that may not fully match the current implementation.

### Tasks

* Review all API documentation in the README
* Remove outdated information
* Document the current data flow
* Document the current session update mechanism

### Acceptance Criteria

* Documentation accurately reflects the implementation
* No undocumented or non-existent APIs are referenced
* New developers can understand the system from the documentation

---

## 4. Implement Database Cascade Delete Rules

The current workout session deletion process requires multiple manual deletion steps:

1. Delete Exercise Sets
2. Delete Session Exercises
3. Delete Workout Session

While functional, this approach increases the risk of orphaned data.

Database-level cascade deletion should be used where appropriate.

### Tasks

* Update the Drizzle schema
* Generate migrations
* Verify deletion behavior

### Acceptance Criteria

* Related records are automatically deleted when a session is removed
* No orphaned records remain in the database

---

## 5. Improve Data Consistency for Multi-Step Database Operations

Creating or updating a workout session currently involves multiple database write operations.

Because the project currently uses Neon HTTP connections without transaction support, a failure during any intermediate step may leave the database in a partially updated state.

Examples of potential issues:

* A session is created but some exercises fail to save
* Exercises are updated but related sets fail to update
* Old records are deleted before new records are successfully created
* Network interruptions leave incomplete data

### Short-Term Improvements

Improve reliability without changing the current database architecture.

#### Tasks

* Add stronger request validation before any database writes occur
* Validate all required IDs and relationships before processing updates
* Improve error handling and logging
* Return clear error messages when an operation fails
* Reduce unnecessary write operations
* Add cleanup logic where practical to minimize partial data creation
* Ensure failed operations do not leave obvious orphaned records

### Long-Term Improvements

Evaluate moving to a database connection strategy that supports transactions.

Potential options:

* Neon Pool
* WebSocket-based connections
* Other transaction-capable database configurations

Before making this change:

* Evaluate complexity and deployment impact
* Verify compatibility with the current architecture
* Determine whether transaction support is necessary for the expected application scale

### Acceptance Criteria

* Invalid requests are rejected before database writes occur
* API responses provide clear and actionable error messages
* Partial updates are minimized whenever possible
* Known consistency risks are documented
* The codebase is prepared for future transaction support if needed


---

## 6. Consolidate TypeScript Types

A shared type file already exists:

```text
src/types/workout.ts
```

However, some pages still contain:

* Duplicate interfaces
* Excessive use of `any`

### Tasks

* Consolidate shared types
* Remove duplicated interfaces
* Reduce unnecessary `any` usage
* Standardize API response types

### Acceptance Criteria

* Workout-related types are centrally managed
* Duplicate type definitions are reduced
* TypeScript warnings are minimized

---

## 7. Strengthen Validation and Authorization

The Session API already includes:

* Authentication
* Ownership checks

This is the correct direction, but additional validation and authorization improvements are still needed.

### Validation Requirements

Verify:

* At least one set is provided when required
* Weight values are valid
* Rep values are valid
* Request payloads are complete and properly structured

### Authorization Review

Clearly define:

* Which resources are user-owned
* Which resources are system-managed

Prevent unauthorized access or modification.

### Acceptance Criteria

* Protected resources require authentication
* User-owned resources enforce ownership checks
* Invalid data cannot be written to the database
* Authorization rules are consistently applied

---

# Implementation Strategy

Work through improvement items in priority order.

Unless explicitly requested, do not start new feature development before addressing the higher-priority stability and quality improvements listed above.

Each task should be completed, tested, and verified before moving on to the next priority.
