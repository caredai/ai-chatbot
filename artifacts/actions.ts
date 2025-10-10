"use server";

import { createServerFn } from "@tanstack/react-start";
import { getSuggestionsByDocumentId } from "@/lib/db/queries";

export async function getSuggestions({ documentId }: { documentId: string }) {
  const suggestions = await getSuggestionsByDocumentId({ documentId });
  return suggestions ?? [];
}

export const getSuggestionsFromServer = createServerFn()
  .inputValidator((data: { documentId: string }) => data)
  .handler(({ data: { documentId } }) => getSuggestions({ documentId }));
