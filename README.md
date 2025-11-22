This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Backend API

The NestJS backend powers the WatsonX agent integration and other server features. To start it locally:

```bash
npm install           # first-time dependency install (includes backend deps)
npm run backend:dev   # starts the Nest server with ts-node
```

By default the backend listens on [http://localhost:4000](http://localhost:4000). CORS is open for local development, so the Next.js app can call the API directly.

Environment variables for the WatsonX integration are read from `.env.local`. Ensure values such as `WATSONX_API_URL`, `WATSONX_AGENT_ID`, and key material are defined before enabling the real agent; otherwise, the backend falls back to the placeholder response "Votre reponse est en cours de traitement...".

If you change environment variables, restart the backend process for them to take effect.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
