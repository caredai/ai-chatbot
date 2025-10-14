import { gateway } from "@ai-sdk/gateway";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
// import { languageModelLogMiddleware } from "@/lib/ai";
import { caredClient } from "@/lib/cared";
import { isTestEnvironment } from "../constants";

export const _myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        "chat-model": gateway.languageModel("xai/grok-2-vision-1212"),
        "chat-model-reasoning": wrapLanguageModel({
          model: gateway.languageModel("xai/grok-3-mini"),
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        "title-model": gateway.languageModel("xai/grok-2-1212"),
        "artifact-model": gateway.languageModel("xai/grok-2-1212"),
      },
    });

export const myProvider = new Proxy(_myProvider, {
  get(target, prop, receiver) {
    if (prop === "languageModel") {
      return (modelId: string) => {
        let resolvedModelId = modelId;
        if (modelId === "title-model") {
          resolvedModelId = "openrouter:google/gemini-2.5-flash-lite";
        } else if (modelId === "artifact-model") {
          resolvedModelId = "openrouter:google/gemini-2.5-flash";
        }
        const model = caredClient.createLanguageModel(resolvedModelId);
        // return wrapLanguageModel({
        //   model,
        //   middleware: languageModelLogMiddleware,
        // });
        return model;
      };
    }

    return Reflect.get(target, prop, receiver);
  },
});
