-- CreateTable
CREATE TABLE "org_invites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "invited_by" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "token" UUID NOT NULL DEFAULT gen_random_uuid(),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "org_invites_token_key" ON "org_invites"("token");

-- AddForeignKey
ALTER TABLE "org_invites" ADD CONSTRAINT "org_invites_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
