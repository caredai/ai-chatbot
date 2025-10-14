import type { ModelFullId } from "@cared/sdk";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useMemo } from "react";
import { orpc } from "@/lib/cared";

export function useProviderModels() {
  const { data: providerModels } = useSuspenseQuery(
    // @ts-expect-error
    orpc.model.listProvidersModels.queryOptions()
  );

  return useMemo(() => {
    return {
      languageProviderModels: providerModels.models.language ?? [],
    };
  }, [providerModels]);
}

const selectedModelAtom = atomWithStorage<ModelFullId>(
  "chat:selectedModel",
  "openrouter:google/gemini-2.5-flash"
);

export function useSelectedModel() {
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom);
  return {
    selectedModel,
    setSelectedModel,
  };
}
