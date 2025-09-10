import FirecrawlApp from "@mendable/firecrawl-js";
import { z } from "zod";

const app = new FirecrawlApp({
    apiKey: "fc-YOUR_API_KEY",
});

export const firecrawl = app;
