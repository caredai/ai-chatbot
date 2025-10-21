"use client";

import { type ComponentProps, memo } from "react";
import { defaultRemarkPlugins, Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

type ResponseProps = ComponentProps<typeof Streamdown>;

export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown
      // https://github.com/vercel/streamdown/issues/159#issuecomment-3392963958
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:whitespace-pre-wrap [&_code]:break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto",
        className
      )}
      remarkPlugins={[
        defaultRemarkPlugins.gfm,
        // @ts-expect-error
        [defaultRemarkPlugins.math[0], { singleDollarTextMath: true }],
      ]}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
