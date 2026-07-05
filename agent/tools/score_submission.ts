import { defineTool } from "eve/tools";
import { z } from "zod";
import { scoreSubmission, submissionSchema } from "@/lib/proofarena/evaluator";

export default defineTool({
  description: "Score one ASP submission against acceptance criteria.",
  inputSchema: z.object({
    submission: submissionSchema,
    acceptanceCriteria: z.array(z.string()),
  }),
  async execute(input) {
    return scoreSubmission(input.submission, input.acceptanceCriteria);
  },
});
