import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";

import { z } from "zod/v4";

export const getChatModelFromCookie = createServerFn().handler(() =>
  getCookie("chat-model")
);

export const setChatModelFromCookie = createServerFn()
  .inputValidator(
    z.object({
      model: z.string(),
    })
  )
  .handler(({ data }) => setCookie("chat-model", data.model));

export const getSidebarStateFromCookie = createServerFn().handler(() =>
  getCookie("sidebar_state")
);
