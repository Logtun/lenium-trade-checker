# Is my trade allowed? · Lenium Trade Rule Checker

A free, fan-made checker for [Lenium](https://www.lenium.capital/) evaluation accounts. Enter your account size (or current balance), side, entry price and size, plus optional open exposure and profit from this market. It shows pass / warning / fail for each rule, quoting Lenium's Rules page:

- **Entry price 20¢–80¢** (a NO at p is checked as YES 100 − p)
- **Max position 5%** of current balance at entry
- **Max total exposure 10%** of balance
- **Consistency: 15% per market** of the profit target (25% with the Consistency boost). Going over raises the target and never ends the account

It also shows the most contracts you can buy at that price and the fee: 0.07 × contracts × price × (1 − price), rounded up to the next cent (Lenium's fee calculator).

Rules as read from lenium.capital on Oct 23, 2026. Lenium's Rules page is the final word.

Static site: `index.html`, `styles.css`, `app.js`, no build step, no backend.

## Deploy on Vercel (auto-deploys on every push)

1. Go to [vercel.com](https://vercel.com) and log in **with GitHub** (the same account that owns this repo).
2. Click **Add New → Project**.
3. Find **Logtun/lenium-trade-checker** in the GitHub list and click **Import**. (If it isn't listed, click "Adjust GitHub App Permissions" and give Vercel access to this repo.) Importing from the list is what makes future pushes deploy automatically; pasting the repo URL does not.
4. Framework preset: **Other**. Leave build settings empty. Click **Deploy**.

## After deploying: fix the link preview

X and WhatsApp need absolute URLs for the preview image. Once you have your Vercel URL (e.g. `https://lenium-trade-checker.vercel.app`), edit `index.html`:

- `og:image` and `twitter:image` → `https://YOUR-URL.vercel.app/og.jpg?v=2`
- add `<meta property="og:url" content="https://YOUR-URL.vercel.app/">`

Commit, and Vercel redeploys on its own.

---

Fan-made · Lenium accounts are simulated evaluation accounts · [lenium.capital](https://www.lenium.capital/)
made by [@iamlogtun](https://x.com/iamlogtun) · not official
