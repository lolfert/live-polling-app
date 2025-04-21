# Design Document: Live Poll App

---

## 1. Introduction

This document outlines the design and requirements for the Live Poll App, a full-stack web application designed for creating and participating in real-time polls. The goal is to enable users, particularly in group settings like presentations or classrooms, to quickly set up multiple-choice polls and gather immediate, visualized feedback from participants. This document reflects the decisions made regarding features, user flow, and technical stack prior to the implementation of the frontend components.

---

## 2. Goals

* Allow users to quickly create simple multiple-choice polls.
* Enable easy sharing of polls via a unique URL.
* Allow participants to join polls anonymously and vote easily via the shared URL.
* Provide real-time updates of poll results to all viewers.
* Display live participant counts and total voter counts.
* Offer a clean, responsive, and modern user interface (defaulting to dark mode).
* Serve as a portfolio project demonstrating full-stack development skills.

---

## 3. Target Audience & Use Case

* **Primary Users:** Presenters, educators, team leaders, or anyone needing quick, informal feedback from a group.
* **Primary Use Case:** A user (creator) sets up a poll, shares the link (e.g., displayed on a screen or sent via chat). Participants click the link on their devices (laptops, phones), vote, and everyone sees the results update live on the poll page.

---

## 4. Core Features / Functional Requirements

* **Poll Creation:**
  * A dedicated UI allows users to input a poll question (text).
  * Users can define multiple-choice options (text), with the ability to add/remove options (minimum 2, maximum e.g., 10).
  * Upon submission, the backend generates a unique poll ID and saves the poll data.
* **Poll Sharing & Access:**
  * After creation, the creator is redirected to a unique URL for the poll (`/poll/:pollId`).
  * This URL is the primary mechanism for sharing the poll.
  * Participants access the poll by navigating directly to this unique URL.
* **Anonymous Voting:**
  * Voting is anonymous. Participants do not need to create accounts or provide nicknames.
  * A unique, anonymous voter identifier (UUID) is generated client-side and stored in the browser's `localStorage` to identify a specific browser instance for voting purposes.
* **Implicit & Changeable Voting:**
  * Participants vote by clicking directly on their desired option button.
  * There is no separate "Submit" button; the vote is registered immediately upon click.
  * Participants can change their vote by simply clicking on a different option. The backend updates their existing vote using an `upsert` operation.
* **Real-time Results Display:**
  * The poll page displays the current results visually (e.g., using progress bars showing percentages and/or vote counts per option).
  * Results update automatically in real-time for all viewers whenever a vote is cast or changed, without requiring a page refresh (via WebSockets).
* **Live Participant Count:**
  * The poll page displays a live count of how many participants are currently connected to the poll via WebSockets.
* **Total Voter Count:**
  * The poll page displays the total number of unique (anonymous) participants who have cast at least one vote for this poll. This count updates in real-time alongside the results.

---

## 5. User Flows

* **Poll Creator:**
    1. Opens the website homepage.
    2. Inputs poll question and options into the creation form.
    3. Submits the form.
    4. Is automatically redirected to the unique poll page (`/poll/:pollId`).
    5. Shares the full URL of this page with potential voters.
    6. Views the poll page, observing live results and counts as votes come in.
* **Poll Voter:**
    1. Receives the unique poll URL from the creator.
    2. Clicks the link or navigates to the URL.
    3. (First visit only) Frontend generates and stores an anonymous voter UUID in `localStorage`.
    4. Views the poll page displaying the question and options.
    5. Retrieves their anonymous voter UUID from `localStorage`.
    6. Clicks on the desired option button to cast/change their vote (implicit submission).
    7. Observes the results updating live.

---

## 6. Non-Functional Requirements

* **Usability:** Simple, intuitive interface for poll creation and voting. Responsive design for various screen sizes (desktop, mobile).
* **Performance:** Fast page loads. Low latency for vote submission and real-time updates. Should handle dozens of concurrent voters smoothly for a typical use case.
* **Reliability:** Votes should be accurately recorded and updated. Real-time updates should be consistent.
* **Security:** Basic web security measures (e.g., input sanitization, CORS configuration). No sensitive user data is stored (voting is anonymous).

---

## 7. Technical Architecture

* **Monorepo:** `pnpm` workspace managing frontend and backend packages.
* **Frontend (`apps/client`):**
  * Framework/Library: React (via Vite)
  * Language: TypeScript
  * UI Library: `shadcn/ui`
  * Styling: Tailwind CSS (configured for `class`-based dark mode)
  * Real-time Client: `socket.io-client`
  * Routing: `react-router-dom`
  * Other Libraries: `uuid` (for anonymous voter ID)
* **Backend (`apps/server`):**
  * Framework/Library: Node.js / Express.js
  * Language: TypeScript
  * Real-time Server: `Socket.IO` (handling connections, rooms, broadcasting)
  * ORM: Prisma
  * Database: PostgreSQL
  * Middleware: `cors`, `express.json`
* **Database Schema (`prisma/schema.prisma`):**
  * `Poll` model (id, question)
  * `Option` model (id, text, pollId, relation to Poll)
  * `Vote` model (id, optionId, pollId, voterIdentifier, relation to Option, relation to Poll)
    * `voterIdentifier`: Stores the anonymous client-side UUID (String).
    * `@@unique([pollId, voterIdentifier])`: Constraint to ensure one vote per anonymous user per poll (used by `upsert`).
* **Real-time Communication:** Direct WebSocket connection via Socket.IO between client and server.
  * Server manages rooms based on `pollId` (e.g., `poll-XYZ`).
  * Events:
    * Client -> Server: `joinPoll` (with room name `poll-<pollId>`)
    * Server -> Client: `new-vote` (payload: `{ options: Option[], voterCount: number }`), `participant-update` (payload: `{ participantCount: number }`).
* **API Endpoints (Express):**
  * `POST /api/polls`: Creates a poll.
  * `GET /api/polls/:pollId`: Retrieves poll data, options with counts, and total voter count.
  * `POST /api/vote`: Receives `pollId`, `optionId`, `voterIdentifier`. Uses `prisma.vote.upsert` to record/update vote. Triggers `broadcastPollUpdates`.

---

## 8. UI/UX Considerations

* **Default Dark Mode:** The application interface defaults to a dark theme.
* **Implicit Voting:** Clicking an option immediately submits/changes the vote for a fluid experience.
* **Clear Visual Feedback:** Selected options should be clearly highlighted. Results visualization should be easy to understand (e.g., progress bars).
* **Responsiveness:** UI adapts cleanly to different screen sizes.

---

## 9. Future Considerations / Out of Scope (v1.0)

* Allowing participants to join via a short code entered on the homepage.
* Poll creators setting an expiry time/date for polls.
* Poll creators manually starting/stopping polls.
* User accounts for poll creators to manage their polls.
* Displaying voter identities (e.g., nicknames or user accounts) alongside votes (explicitly decided against for v1.0 due to complexity and privacy).

---
