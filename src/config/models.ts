import { ModelOption } from "@/types/chat";

export const modelOptions: ModelOption[] = [
  {
    id: "ollama-llama",
    name: "Llama 3.2 (3b)",
    provider: "ollama",
    modelId: "llama3.2",
    description: "Powered by Ollama running on Google Cloud",
  },
  {
    id: "vertex-llama",
    name: "Llama 3.2 (80b)",
    provider: "vertex-ai",
    modelId: "meta/llama-3.2-90b-vision-instruct-maas",
    description: "Powered by Google Cloud Vertex AI",
  },
];
