import { defineEval } from "eve/evals";
import { includes } from "eve/evals/expect";

export default defineEval({
  description: "Extracts a software ASP deal, scores the delivery, and gives an escrow recommendation.",
  tags: ["a2a", "self-learning", "software"],
  async test(t) {
    await t.send(`
I am an OKX.AI buyer. I asked an ASP to build a Next.js landing page.
The ASP promised: GitHub repo, deployed URL, mobile screenshots, and test logs.

Delivery:
Here is the GitHub repo https://github.com/example/proof-demo and deployed URL https://proof-demo.example.com.
I included README.md and build-log.txt. Mobile screenshots are missing.

Should I release escrow?
`);
    t.completed();
    t.calledTool("extract_agent_deal");
    t.calledTool("score_submission");
    t.messageIncludes(/escrow|release|revision/i);
    t.check(t.reply, includes("mobile")).soft();
  },
});
