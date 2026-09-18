# Home Board

A personal applet board built with **Next.js**, **Sanity**, and **Vercel**. Weather, stocks, and sports are live.

## What each piece does

- **Next.js** is the website. It renders Home Board, serves `/api/weather`, `/api/geocode`, `/api/stocks`, and `/api/sports`, and embeds Sanity Studio at `/studio`.
- **Sanity** is the CMS catalog. It stores the board title, which applets exist, and editorial defaults (cities, tickers, featured teams).
- **Vercel** hosts the Next.js app. One deploy gives you the public board and the Studio.

Live data does **not** live in Sanity:

- Weather conditions come from Open-Meteo.
- Stock quotes come from Yahoo Finance.
- Sports scores come from ESPN.

If Sanity is not connected yet, the app falls back to a weather / stocks / sports catalog and still fetches live data.

## Local setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use the right-hand catalog to switch applets.

### Connect Sanity

1. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SANITY_PROJECT_ID`.
2. Restart `npm run dev`.
3. In the Sanity project CORS settings, add `http://localhost:3000` with credentials allowed.
4. Open [http://localhost:3000/studio](http://localhost:3000/studio).
5. Add **Platform settings**, then:
   - Applets with `kind` of `weather`, `stocks`, or `sports` and `status: live`
   - Weather locations (city, state/region, country, lat/lng)
   - Stock tickers
   - Sports teams (`nba`, `nfl`, `mlb`, or `nhl`)

## Deploy on Vercel

1. Push this repo and import it in [Vercel](https://vercel.com/new).
2. Add the same Sanity env vars in the Vercel project settings.
3. Add your Vercel URL as a Sanity CORS origin, for example `https://your-app.vercel.app`.

After deploy, the board is `/` and Studio is `/studio`.
