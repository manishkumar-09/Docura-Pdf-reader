import { config } from "dotenv";
import { z } from "zod";
config();

// Define schema for environment variables
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  PORT: z.coerce.number().default(8080),
  GEMINI_API_KEY: z.string().min(1, "COHERE_API_KEY is required"),
  PINECONE_API_KEY: z.string().min(1, "PINECONE_API_KEY is required"),
  PINECONE_ENVIRONMENT: z.string().min(1, "PINECONE_ENVIRONMENT is required"),
  PINECONE_INDEX_NAME: z.string().min(1, "PINECONE_INDEX_NAME is required"),
  PINECONE_NAMESPACE: z.string().default("my-docs"),
  VECTOR_EXPIRATION_DAYS: z.coerce.number().default(1),
});

// Validate and export typed config
export const configs = envSchema.parse(process.env);
