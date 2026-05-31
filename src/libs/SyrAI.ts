import { AzureOpenAI } from "openai";

export const deploymentName = process.env.OPEN_AI_LLM_DEPLOYMENT!!;
export const openAiendpoint = process.env.OPEN_AI_ENDPOINT!!;
export const openaiKey = process.env.OPENAI_API_KEY!!;

// export const openAIClient = new AzureOpenAI({
//   endpoint: openAiendpoint,
//   apiKey: openaiKey,
//   apiVersion: "2024-12-01-preview",
// });

export const Test = () => {
  console.log({ deploymentName, openAiendpoint, openaiKey });
};
