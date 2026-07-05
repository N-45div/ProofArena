import type { ProofArena } from "./evaluator";

export const demoArena: ProofArena = {
  id: "arena-okx-btc-risk-001",
  title: "BTC 7-day market risk memo",
  buyer: "OKX.AI buyer demo",
  category: "finance",
  acceptanceCriteria: [
    "Use fresh market sources with timestamps",
    "Separate evidence from opinion",
    "Include downside and upside scenarios",
    "Avoid guaranteed financial advice",
  ],
  submissions: [
    {
      id: "sub-fundinghawk",
      aspName: "FundingHawk",
      category: "finance",
      title: "BTC risk memo with funding and options context",
      summary:
        "Uses market data, funding rate context, and timestamped source links to separate observed evidence from risk scenarios. Includes upside, downside, and invalidation levels without presenting advice as guaranteed.",
      sources: [
        "https://www.okx.com/markets/prices/bitcoin-btc",
        "https://www.coinglass.com/FundingRate",
        "https://www.tradingview.com/symbols/BTCUSDT/",
      ],
      artifacts: ["btc-risk-memo.md", "source-log.json"],
      claims: [
        "Funding conditions indicate elevated short-term volatility risk.",
        "Downside and upside scenarios depend on liquidity and macro catalysts.",
      ],
      submittedAt: "2026-07-05T09:20:00.000Z",
    },
    {
      id: "sub-alphaoracle",
      aspName: "AlphaOracle",
      category: "finance",
      title: "BTC will rally this week",
      summary:
        "A short directional BTC memo with a strong bullish call and one market chart. The delivery gives a target but does not separate claims from evidence or discuss invalidation.",
      sources: ["https://www.tradingview.com/symbols/BTCUSDT/"],
      artifacts: ["btc-call.pdf"],
      claims: ["BTC is guaranteed to rally because momentum is 100% confirmed."],
      submittedAt: "2026-07-05T09:31:00.000Z",
    },
    {
      id: "sub-riskdesk",
      aspName: "RiskDesk",
      category: "finance",
      title: "Scenario-based BTC risk brief",
      summary:
        "Presents source-backed market observations, scenario branches, and explicit uncertainty language. The report covers market risk and timestamped evidence but includes fewer machine-readable artifacts than requested.",
      sources: [
        "https://www.okx.com/markets/prices/bitcoin-btc",
        "https://www.coindesk.com/markets/",
      ],
      artifacts: ["risk-brief.md"],
      claims: [
        "The strongest conclusion is conditional: price risk is asymmetric if liquidity breaks.",
        "This is a decision-support memo, not investment advice.",
      ],
      submittedAt: "2026-07-05T09:25:00.000Z",
    },
  ],
};
