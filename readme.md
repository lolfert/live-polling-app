# Live Polling App

A full-stack web application for creating and participating in real-time interactive polls.

![Live Polling App](https://img.shields.io/badge/status-ready-brightgreen)

## 📋 Summary

The Live Polling App is a responsive, real-time application designed for creating and participating in multiple-choice polls. Ideal for presentations, classrooms, or team meetings, it enables presenters to get immediate, visualized feedback from their audience without requiring participants to create accounts or download additional software.

## ✨ Features

- **Quick Poll Creation**: Create a poll with a question and multiple answers in seconds
- **Drag-and-Drop Option Reordering**: Easily reorder poll options with intuitive drag-and-drop
- **Unique Shareable Links**: Each poll gets a short code and unique URL for easy sharing
- **Real-time Updates**: See votes and results update instantly using WebSocket technology
- **Live Participant Count**: Track how many people are currently viewing the poll
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Anonymous Voting**: Participants can vote without creating accounts
- **Time-Limited Polls**: Polls automatically close after a set period of time
- **Vote Changing**: Participants can change their vote until the poll closes
- **Visual Results**: See results visualized in real-time as votes come in

## 🛠️ Architecture

This project is structured as a monorepo using pnpm workspaces:

### Frontend (`apps/client`)

- **Framework**: React with TypeScript (Vite)
- **UI Components**: shadcn/ui (built on Radix UI primitives)
- **Styling**: Tailwind CSS
- **Real-time**: Socket.IO client
- **Routing**: React Router
- **State Management**: React hooks

### Backend (`apps/server`)

- **Framework**: Node.js/Express.js with TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Real-time**: Socket.IO server
- **API**: RESTful endpoints for poll operations
- **Data Models**: Polls, Options, Votes

### Database Schema

```prisma
model Poll {
  id        String    @id @default(cuid())
  question  String
  createdAt DateTime  @default(now())
  updatedAt DateTime? @updatedAt
  endTime   DateTime?
  shortCode String    @default(dbgenerated("generate_alphanumeric_id(6)"))
  options   Option[]
  votes     Vote[]
}

model Option {
  id     String @id @default(cuid())
  text   String
  pollId String
  poll   Poll   @relation(fields: [pollId], references: [id], onDelete: Cascade)
  votes  Vote[]
}

model Vote {
  id        String   @id @default(cuid())
  optionId  String
  pollId    String
  voterId   String
  createdAt DateTime @default(now())
  option    Option   @relation(fields: [optionId], references: [id])
  poll      Poll     @relation(fields: [pollId], references: [id])
  
  @@unique([pollId, voterId])
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL database

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/poll-app.git
   cd poll-app
   ```

2. Install dependencies

   ```bash
   pnpm install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory with:

   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/polldb?schema=public"
   CLIENT_URL="http://localhost:3000"
   PORT=8000
   ```

4. Run database migrations

   ```bash
   pnpm prisma:migrate
   ```

5. Generate Prisma client

   ```bash
   pnpm prisma:generate
   ```

### Running the Application

Start both the frontend and backend in development mode:

```bash
pnpm dev
```

Or run separately:

- Frontend: `pnpm --filter ./apps/client dev`
- Backend: `pnpm --filter ./apps/server dev`

### Building for Production

```bash
pnpm build
```

## 💻 Usage

1. **Creating a Poll**:
   - Visit the homepage
   - Enter your question
   - Add your options (drag to reorder)
   - Click "Create Poll"

2. **Sharing a Poll**:
   - Copy the unique URL or short code displayed after creation
   - Share it with participants via any communication channel

3. **Participating in a Poll**:
   - Click on the shared poll link
   - Select an option to vote
   - View real-time results as they come in
   - Change your vote at any time before the poll closes

4. **Viewing Results**:
   - Results are displayed automatically below voting options
   - See total votes and current participant count
   - Watch updates in real-time

## 🧠 Technical Insights

- **WebSocket Implementation**: Uses Socket.IO for real-time bidirectional communication
- **Anonymous Voting**: Uses browser localStorage to maintain anonymous voter identity
- **Optimistic UI Updates**: UI updates immediately on vote, then confirms with server
- **Database Transactions**: Ensures data integrity during vote operations

## 📄 License

ISC © Luke Olfert

---

Built using React, Node.js, Socket.IO, and Prisma
