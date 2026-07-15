CREATE TABLE "bot_conversation" (
    "chat_id" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_conversation_pkey" PRIMARY KEY ("chat_id")
);
