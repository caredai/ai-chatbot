"use server";

import { createServerFn } from "@tanstack/react-start";
import { generateText, type UIMessage } from "ai";
import type { VisibilityType } from "@/components/visibility-selector";
import { myProvider } from "@/lib/ai/providers";
import { setChatModelFromCookie } from "@/lib/cookie";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from "@/lib/db/queries";

export async function saveChatModelAsCookie(model: string) {
  await setChatModelFromCookie({ data: { model } });
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel("title-model"),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export const deleteTrailingMessagesFromServer = createServerFn()
  .inputValidator((data: { id: string }) => data)
  .handler(({ data: { id } }) => deleteTrailingMessages({ id }));

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}

export const updateChatVisibilityFromServer = createServerFn()
  .inputValidator(
    (data: { chatId: string; visibility: VisibilityType }) => data
  )
  .handler(({ data: { chatId, visibility } }) =>
    updateChatVisibility({ chatId, visibility })
  );
