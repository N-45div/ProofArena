-- CreateTable
CREATE TABLE "Arena" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "buyer" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "acceptanceCriteria" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Arena_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "arenaId" TEXT NOT NULL,
    "aspName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sources" TEXT NOT NULL,
    "artifacts" TEXT NOT NULL,
    "claims" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifierRun" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "verdict" TEXT NOT NULL,
    "checks" TEXT NOT NULL,
    "risks" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerifierRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofCard" (
    "id" TEXT NOT NULL,
    "arenaId" TEXT,
    "aspName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "verdict" TEXT NOT NULL,
    "taskHash" TEXT NOT NULL,
    "deliveryHash" TEXT NOT NULL,
    "artifactHashesJson" TEXT NOT NULL,
    "sourceHashesJson" TEXT NOT NULL,
    "verifierVersion" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "signatureAlgorithm" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "acceptanceCriteria" TEXT NOT NULL,
    "checksJson" TEXT NOT NULL,
    "risksJson" TEXT NOT NULL,
    "buyerMessage" TEXT NOT NULL,
    "proofPackJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProofCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluatorVote" (
    "id" TEXT NOT NULL,
    "arenaId" TEXT NOT NULL,
    "evaluator" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluatorVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningEvent" (
    "id" TEXT NOT NULL,
    "aspName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "taskHash" TEXT NOT NULL,
    "deliveryHash" TEXT NOT NULL,
    "verifierVersion" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "buyerOutcome" TEXT,
    "disputeOutcome" TEXT,
    "lessons" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenchmarkRun" (
    "id" TEXT NOT NULL,
    "suite" TEXT NOT NULL,
    "verifierVersion" TEXT NOT NULL,
    "passed" INTEGER NOT NULL,
    "failed" INTEGER NOT NULL,
    "summaryJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BenchmarkRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerifierRun_submissionId_key" ON "VerifierRun"("submissionId");

-- CreateIndex
CREATE INDEX "ProofCard_aspName_idx" ON "ProofCard"("aspName");

-- CreateIndex
CREATE INDEX "ProofCard_category_idx" ON "ProofCard"("category");

-- CreateIndex
CREATE INDEX "ProofCard_verdict_idx" ON "ProofCard"("verdict");

-- CreateIndex
CREATE INDEX "ProofCard_issuedAt_idx" ON "ProofCard"("issuedAt");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_arenaId_fkey" FOREIGN KEY ("arenaId") REFERENCES "Arena"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifierRun" ADD CONSTRAINT "VerifierRun_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofCard" ADD CONSTRAINT "ProofCard_arenaId_fkey" FOREIGN KEY ("arenaId") REFERENCES "Arena"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluatorVote" ADD CONSTRAINT "EvaluatorVote_arenaId_fkey" FOREIGN KEY ("arenaId") REFERENCES "Arena"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
