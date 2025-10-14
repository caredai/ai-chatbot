import type {
  EmbeddingModelInfo,
  ImageModelInfo,
  LanguageModelInfo,
  SpeechModelInfo,
  TranscriptionModelInfo,
} from "@cared/sdk";
import { zuji } from "zuji";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function LanguageModelItemView({ model }: { model: LanguageModelInfo }) {
  if (
    !(
      model.contextWindow ||
      model.maxOutputTokens ||
      model.inputTokenPrice ||
      model.outputTokenPrice ||
      model.cachedInputTokenPrice ||
      model.cacheInputTokenPrice
    )
  ) {
    return null;
  }

  return (
    <div className="space-y-1 text-muted-foreground text-sm">
      {Boolean(model.contextWindow || model.maxOutputTokens) && (
        <div className="flex flex-wrap gap-x-4">
          {model.contextWindow && (
            <div>
              Context length:{" "}
              <span className="font-medium font-mono text-foreground">
                {zuji(model.contextWindow, "compact-decimal")}
              </span>
            </div>
          )}
          {model.maxOutputTokens && (
            <div>
              Max output length:{" "}
              <span className="font-medium font-mono text-foreground">
                {zuji(model.maxOutputTokens, "compact-decimal")}
              </span>
            </div>
          )}
        </div>
      )}
      {Boolean(model.inputTokenPrice || model.outputTokenPrice) && (
        <div className="flex flex-wrap gap-x-4">
          {model.inputTokenPrice && (
            <div>
              Input:{" "}
              <span className="font-medium font-mono text-foreground">
                {zuji(model.inputTokenPrice, "standard-currency-usd")}/M
              </span>{" "}
              tokens
            </div>
          )}
          {model.outputTokenPrice && (
            <div>
              Output:{" "}
              <span className="font-medium font-mono text-foreground">
                {zuji(model.outputTokenPrice, "standard-currency-usd")}/M
              </span>{" "}
              tokens
            </div>
          )}
        </div>
      )}
      {Boolean(
        model.cachedInputTokenPrice ||
          (model.cacheInputTokenPrice &&
            typeof model.cacheInputTokenPrice === "string")
      ) && (
        <div className="flex flex-wrap gap-x-4">
          {model.cachedInputTokenPrice && (
            <div>
              {model.cacheInputTokenPrice ? "Cache read" : "Cache"}:{" "}
              <span className="font-medium font-mono text-foreground">
                {zuji(model.cachedInputTokenPrice, "standard-currency-usd")}/M
              </span>{" "}
              tokens
            </div>
          )}
          {model.cacheInputTokenPrice &&
            typeof model.cacheInputTokenPrice === "string" && (
              <div>
                Cache write:{" "}
                <span className="font-medium font-mono text-foreground">
                  {zuji(model.cacheInputTokenPrice, "standard-currency-usd")}/M
                </span>{" "}
                tokens
              </div>
            )}
        </div>
      )}
      {!!(
        model.cacheInputTokenPrice &&
        typeof model.cacheInputTokenPrice !== "string"
      ) && (
        <div>
          Cache write:
          <CacheInputTokenPriceTable
            cacheInputTokenPrice={model.cacheInputTokenPrice}
          />
        </div>
      )}
    </div>
  );
}

// Image Model Item View
export function ImageModelItemView({ model }: { model: ImageModelInfo }) {
  if (
    !(
      model.imageInputTokenPrice ||
      model.imageOutputTokenPrice ||
      model.textInputTokenPrice ||
      model.textCachedInputTokenPrice ||
      model.imageCachedInputTokenPrice ||
      model.pricePerImage
    )
  ) {
    return null;
  }

  return (
    <div className="space-y-1 text-muted-foreground text-sm">
      {Boolean(model.imageInputTokenPrice || model.imageOutputTokenPrice) && (
        <div className="flex flex-wrap gap-x-4">
          {model.imageInputTokenPrice && (
            <div>
              Image input:{" "}
              <span className="font-medium font-mono text-foreground">
                {zuji(model.imageInputTokenPrice, "standard-currency-usd")}/M
              </span>{" "}
              tokens
            </div>
          )}
          {model.imageOutputTokenPrice && (
            <div>
              Image output:{" "}
              <span className="font-medium font-mono text-foreground">
                {zuji(model.imageOutputTokenPrice, "standard-currency-usd")}/M
              </span>{" "}
              tokens
            </div>
          )}
        </div>
      )}
      {model.textInputTokenPrice && (
        <div>
          Text input:{" "}
          <span className="font-medium font-mono text-foreground">
            {zuji(model.textInputTokenPrice, "standard-currency-usd")}/M
          </span>{" "}
          tokens
        </div>
      )}
      {Boolean(
        model.textCachedInputTokenPrice || model.imageCachedInputTokenPrice
      ) && (
        <div className="flex flex-wrap gap-x-4">
          {model.textCachedInputTokenPrice && (
            <div>
              Text cache:{" "}
              <span className="font-medium font-mono text-foreground">
                {zuji(model.textCachedInputTokenPrice, "standard-currency-usd")}
                /M
              </span>{" "}
              tokens
            </div>
          )}
          {model.imageCachedInputTokenPrice && (
            <div>
              Image cache:{" "}
              <span className="font-medium font-mono text-foreground">
                {zuji(
                  model.imageCachedInputTokenPrice,
                  "standard-currency-usd"
                )}
                /M
              </span>{" "}
              tokens
            </div>
          )}
        </div>
      )}
      {model.pricePerImage && (
        <div
          className={cn(
            (model.imageInputTokenPrice ||
              model.imageOutputTokenPrice ||
              model.textInputTokenPrice ||
              model.textCachedInputTokenPrice ||
              model.imageCachedInputTokenPrice) &&
              typeof model.pricePerImage !== "string" &&
              "mt-2"
          )}
        >
          Price per image:{" "}
          {typeof model.pricePerImage === "string" ? (
            <span className="font-medium font-mono text-foreground">
              {zuji(model.pricePerImage, "standard-currency-usd")}
            </span>
          ) : (
            <PricePerImageTable pricePerImage={model.pricePerImage} />
          )}
        </div>
      )}
    </div>
  );
}

// Speech Model Item View
export function SpeechModelItemView({ model }: { model: SpeechModelInfo }) {
  if (
    !(model.maxInputTokens || model.textTokenPrice || model.audioTokenPrice)
  ) {
    return null;
  }

  return (
    <div className="space-y-1 text-muted-foreground text-sm">
      {!!model.maxInputTokens && (
        <div className="flex flex-wrap gap-x-4">
          {model.maxInputTokens && (
            <div>
              Max input length:{" "}
              <span className="font-medium font-mono text-foreground">
                {zuji(model.maxInputTokens, "compact-decimal")}
              </span>
            </div>
          )}
        </div>
      )}
      {!!(model.textTokenPrice || model.audioTokenPrice) && (
        <div className="flex flex-wrap gap-x-4">
          {model.textTokenPrice && (
            <div>
              Text tokens:{" "}
              <span className="font-medium font-mono text-foreground">
                {zuji(model.textTokenPrice, "standard-currency-usd")}/M
              </span>{" "}
              tokens
            </div>
          )}
          {model.audioTokenPrice && (
            <div>
              Audio tokens:{" "}
              <span className="font-medium font-mono text-foreground">
                {zuji(model.audioTokenPrice, "standard-currency-usd")}/M
              </span>{" "}
              tokens
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Transcription Model Item View
export function TranscriptionModelItemView({
  model,
}: {
  model: TranscriptionModelInfo;
}) {
  if (
    !(
      model.audioTokenPrice ||
      model.textInputTokenPrice ||
      model.textOutputTokenPrice
    )
  ) {
    return null;
  }

  return (
    <div className="space-y-1 text-muted-foreground text-sm">
      {!!model.audioTokenPrice && (
        <div className="flex flex-wrap gap-x-4">
          {model.audioTokenPrice && (
            <div>
              Audio tokens:{" "}
              <span className="font-medium font-mono text-foreground">
                {zuji(model.audioTokenPrice, "standard-currency-usd")}/M
              </span>{" "}
              tokens
            </div>
          )}
        </div>
      )}
      {!!(model.textInputTokenPrice || model.textOutputTokenPrice) && (
        <div className="flex flex-wrap gap-x-4">
          {model.textInputTokenPrice && (
            <div>
              Text input:{" "}
              <span className="font-medium font-mono text-foreground">
                {zuji(model.textInputTokenPrice, "standard-currency-usd")}/M
              </span>{" "}
              tokens
            </div>
          )}
          {model.textOutputTokenPrice && (
            <div>
              Text output:{" "}
              <span className="font-medium font-mono text-foreground">
                {zuji(model.textOutputTokenPrice, "standard-currency-usd")}/M
              </span>{" "}
              tokens
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Embedding Model Item View
export function EmbeddingModelItemView({
  model,
}: {
  model: EmbeddingModelInfo;
}) {
  if (!(model.tokenPrice || model.dimensions)) {
    return null;
  }

  return (
    <div className="space-y-1 text-muted-foreground text-sm">
      {(model.tokenPrice || model.dimensions) && (
        <div className="flex flex-wrap gap-x-4">
          {model.tokenPrice && (
            <div>
              Token price:{" "}
              <span className="font-medium font-mono text-foreground">
                {zuji(model.tokenPrice, "standard-currency-usd")}/M
              </span>{" "}
              tokens
            </div>
          )}
          {model.dimensions && (
            <div>
              Dimensions:{" "}
              {typeof model.dimensions === "number" ? (
                <span className="font-medium font-mono text-foreground">
                  {zuji(model.dimensions, "standard-integer")}
                </span>
              ) : (
                model.dimensions.map((dim, _index) => (
                  <span
                    className="mr-1 font-medium font-mono text-foreground last:mr-0"
                    key={dim}
                  >
                    {zuji(dim, "standard-integer")}{" "}
                  </span>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Price per image table component that handles both data structures
function PricePerImageTable({
  pricePerImage,
}: {
  pricePerImage: [string, string][] | [string, [string, string][]][];
}) {
  // Check if it's a nested structure (quality -> size -> price)
  const isNested = pricePerImage.some((item) => Array.isArray(item[1]));

  if (isNested) {
    // Handle nested structure: quality -> size -> price
    const nestedPricePerImage = pricePerImage as [string, [string, string][]][];

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quality</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nestedPricePerImage.map(([quality, sizePriceArray]) =>
            sizePriceArray.map(([size, price], index) => (
              <TableRow key={`${quality}-${size}`}>
                <TableCell
                  className={
                    index === 0 ? "font-medium" : "text-muted-foreground"
                  }
                >
                  {index === 0 ? quality : ""}
                </TableCell>
                <TableCell>{size}</TableCell>
                <TableCell className="font-medium font-mono text-foreground">
                  {zuji(price, "standard-currency-usd")}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  }
  // Handle simple structure: quality -> price
  const simplePricePerImage = pricePerImage as [string, string][];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Quality</TableHead>
          <TableHead>Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {simplePricePerImage.map(([quality, price]) => (
          <TableRow key={quality}>
            <TableCell>{quality}</TableCell>
            <TableCell className="font-medium font-mono text-foreground">
              {zuji(price, "standard-currency-usd")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Cache input token price table component for TTL to price mapping
function CacheInputTokenPriceTable({
  cacheInputTokenPrice,
}: {
  cacheInputTokenPrice: [string, string][];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>TTL</TableHead>
          <TableHead>Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cacheInputTokenPrice.map(([ttl, price]) => (
          <TableRow key={ttl}>
            <TableCell>{ttl}</TableCell>
            <TableCell>
              <span className="font-medium font-mono text-foreground">
                {zuji(price, "standard-currency-usd")}/M
              </span>{" "}
              tokens
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
