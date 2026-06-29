# FinTrack Mobile - Data Flow Diagram (DFD)

This document illustrates how data moves through the FinTrack Mobile application.

---

## Level 0: Context Diagram

The Context Diagram shows the entire system as a single process and its interaction with external entities.

```
+--------------------------+                                +---------------------------+
|                          |--(A) User Input & Credentials-->|                           |
|           User           |                                |       FinTrack Mobile     |
| (External Entity)        |<-(B) Displayed App Data---------|          (System)         |
|                          |                                |                           |
+--------------------------+                                +-------------+-------------+
                                                                         | ^
                                                                    (C) Auth Events
                                                                         | |
                                                                         v |
                                                           +---------------------------+
                                                           |                           |
                                                           |  Firebase Authentication  |
                                                           |   (External Entity)       |
                                                           |                           |
                                                           +---------------------------+
```

### Data Flows (Level 0):

*   **(A) User Input & Credentials**: User actions such as adding transactions, setting budgets, and entering login/registration details.
*   **(B) Displayed App Data**: The UI rendered for the user, including dashboards, charts, transaction lists, and reports.
*   **(C) Auth Events**: The flow of authentication requests (e.g., login/logout) to Firebase and the corresponding responses (e.g., user session state) back to the app.

---

## Level 1: System Breakdown

The Level 1 DFD breaks the "FinTrack Mobile" system into its major internal processes and shows how data flows between them and to the internal data store, which is now user-specific.

```
                                          +-----------------+
                                          |                 |
+-------------------+<---(F) User Auth----|     Firebase    |----(G) Auth Result--->+-------------------+
|                   |                     |  Authentication |                     |                   |
|       User        |--(E) Manage Data--->|   (External)    |                     |  1.0 Manage User  |
|                   |                     +-----------------+                     |      Session      |
+-------------------+------------------------------------------------------------>|                   |
        ^   |                                                                    +---------+---------+
        |   |                                                                              |
        |   | (D) UI Render                                                          (H) User Profile
        |   |                                                                              |
        |   +------------------------------------------------------------------------------+
        |                                                                                    |
        +------------------------------------------------------------------------------------+
        |                                                                                    |
        |                                       +-------------------+<---(J) Write Data---->+-------------------+
        +---------------------------------------|   User-Specific   |                      |                   |
                                                |   Local App Data  |<---(L) Save Report---|  3.0 Generate     |
--(I) Read Data-->+--------------------+        |    (Data Store)   |                      |      Reports      |
|                 |                   |        |                   |                      |                   |
| 2.0 Display UI &|                   +------->+-------------------+--------------------->+-------------------+
|   Dashboards    |                                                                              ^
|                 |                                                                              |
+-----------------|<--------------------------------------(K) Read Data--------------------------+

```

### Processes (Level 1):

*   **1.0 Manage User Session**: Handles all interactions with Firebase Authentication, including login, registration, and session management. It provides the authenticated `User Profile`.
*   **2.0 Display UI & Dashboards**: Renders all visual components. It now uses the `User Profile` (containing the UID) to read from and write to the correct user's partition in the `User-Specific Local App Data` store.
*   **3.0 Generate Reports**: A time-triggered process. It uses the `User Profile` to read the correct user's transaction data and writes the generated report back to that same user's data partition.

### Data Stores (Level 1):

*   **User-Specific Local App Data**: Represents the app's state persisted in the device's Local Storage. **Crucially, this data is now partitioned and accessed using the user's unique ID (UID) from their profile.** This includes:
    *   `transactions`
    *   `budgets`
    *   `categories`
    *   `savingGoals`
    *   `monthlyReports`
    *   `userSettings` (e.g., monthly income, onboarding status)

### Data Flows (Level 1):

*   **(D) UI Render**: The final rendered data presented to the user.
*   **(E) Manage Data**: User-initiated actions to create, update, or delete data.
*   **(F) User Auth**: Credentials sent to Firebase for authentication.
*   **(G) Auth Result**: The success or failure response from Firebase.
*   **(H) User Profile**: The authenticated user's profile information (UID, email), which is now essential for accessing the correct partition of the local data store. It flows to all processes that need to read or write data.
*   **(I) Read Data**: The flow of reading user-specific financial data from the data store to be rendered in the UI. This operation requires the `User Profile` (UID).
*   **(J) Write Data**: The flow of writing new or updated data (transactions, budgets, etc.) to the user-specific partition of the data store. This operation requires the `User Profile` (UID).
*   **(K) Read Data**: The `Generate Reports` process reads the previous month's transactions from the specific user's data partition. This operation requires the `User Profile` (UID).
*   **(L) Save Report**: The `Generate Reports` process writes the new report to the specific user's data partition. This operation requires the `User Profile` (UID).
