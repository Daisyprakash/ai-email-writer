# AI Email Writer

A clean, modern web app that generates professional emails using AI. Describe what you need, choose a tone and length, and get a polished email in seconds.

## Features

- Single-page email generation interface
- Tone options: Professional, Friendly, Formal, Casual, Persuasive, Apologetic
- Length options: Short, Medium, Long
- Copy, regenerate, and clear actions
- Light and dark mode support
- Responsive, mobile-friendly layout

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js Route Handlers
- **AI:** OpenAI API (GPT-4o mini)
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- An [OpenAI API key](https://platform.openai.com/api-keys)

### Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy the environment file and add your OpenAI API key:

```bash
cp .env.example .env.local
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key |

## API

### `POST /api/generate-email`

**Request:**

```json
{
  "prompt": "I want to request leave tomorrow because I have fever.",
  "tone": "Professional",
  "length": "Medium",
  "additionalInstructions": "Keep it polite."
}
```

**Response:**

```json
{
  "generatedEmail": "Dear [Manager's Name],\n\n..."
}
```

## Deploy to Vercel

1. Push your code to GitHub.
2. Import the project on [Vercel](https://vercel.com).
3. Add the `OPENAI_API_KEY` environment variable in project settings.
4. Deploy.

## Project Structure

```
app/
  page.tsx                    # Home page
  api/generate-email/         # Email generation API
components/
  EmailForm/                  # Email input form
  GeneratedEmail/             # Generated email display
  Header/                     # App header
  Loading/                    # Loading spinner
lib/
  openai.ts                   # OpenAI client and prompt logic
types/
  email.ts                    # TypeScript types
utils/
  validation.ts               # Request validation
```

## License

MIT
