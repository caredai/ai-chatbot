import type {
  LanguageModelV2Middleware,
  LanguageModelV2StreamPart,
} from "@ai-sdk/provider";

export const languageModelLogMiddleware: LanguageModelV2Middleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    console.log("doGenerate called");
    console.log(`params: ${JSON.stringify(params, null, 2)}`);

    const result = await doGenerate();

    console.log("doGenerate finished");
    console.log(
      `generated text: ${result.content
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("\n")}`
    );

    return result;
  },

  wrapStream: async ({ doStream, params }) => {
    console.log("doStream called");
    console.log(`params: ${JSON.stringify(params)}`);

    const { stream, ...rest } = await doStream();

    let generatedText = "";
    const textBlocks = new Map<string, string>();

    const transformStream = new TransformStream<
      LanguageModelV2StreamPart,
      LanguageModelV2StreamPart
    >({
      transform(chunk, controller) {
        switch (chunk.type) {
          case "text-start": {
            textBlocks.set(chunk.id, "");
            break;
          }
          case "text-delta": {
            const existing = textBlocks.get(chunk.id) || "";
            textBlocks.set(chunk.id, existing + chunk.delta);
            generatedText += chunk.delta;
            break;
          }
          case "text-end": {
            console.log(
              `Text block ${chunk.id} completed:`,
              textBlocks.get(chunk.id)
            );
            break;
          }
          default:
            break;
        }

        controller.enqueue(chunk);
      },

      flush() {
        console.log("doStream finished");
        console.log(`generated text: ${generatedText}`);
      },
    });

    return {
      stream: stream.pipeThrough(transformStream),
      ...rest,
    };
  },
};
