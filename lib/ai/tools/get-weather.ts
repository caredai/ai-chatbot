import { tool } from "ai";
import { z } from "zod";
import type { WeatherAtLocation } from "@/components/weather";

export const getWeather = tool({
  description: "Get the current weather at a location",
  inputSchema: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  execute: async ({ latitude, longitude }) => {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`
    );

    const weatherData = (await response.json()) as
      | (WeatherAtLocation & {
          error?: never;
        })
      | {
          error: true;
          reason: string;
        };
    return weatherData;
  },
});
