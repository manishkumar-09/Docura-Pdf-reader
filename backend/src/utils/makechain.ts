//prompt templates
import { Document } from "langchain/document";
import { BaseRetriever } from "@langchain/core/retrievers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { configs } from "../config/env";
import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

const CONDENSE_TEMPLATE = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.
<chat_history>
{chat_history}
</chat_history>

Follow Up Input: {question}
Standalone Question (strictly based on the chat history above):`;

//Prompt for answering with context

const QA_TEMPLATE = `You are a highly precise expert researcher on Generative AI. Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say you don't know. DO NOT try to make up an answer.
If the question is not related to the context or chat history, politely respond that you are tuned to only answer questions that are related to the context.

<context>
  {context}
</context>

<chat_history>
  {chat_history}
</chat_history>

Question: {question}
Answer clearly, concisely, and ONLY using the information provided above:`;

//Combine multiple docs into one string
const combineDocumentsFn = (docs: Document[], separator = "\n\n") => {
  const serializedDocs = docs.map((doc) => doc.pageContent).join(separator);
  return serializedDocs;
};

// Main makechain function
export const makeChain = (retriever: BaseRetriever) => {
  //setup the gemini model
  const model = new ChatGoogleGenerativeAI({
    apiKey: configs.GEMINI_API_KEY,
    model: "gemini-2.5-flash",
    temperature: 0.2,
  });

  //Prompts
  const condenseQuestionPrompt =
    ChatPromptTemplate.fromTemplate(CONDENSE_TEMPLATE);
  const answerPrompt = ChatPromptTemplate.fromTemplate(QA_TEMPLATE);

  // Chain to rewrite follow-up into standalone question
  const standaloneQuestionChain = RunnableSequence.from([
    condenseQuestionPrompt,
    model,
    new StringOutputParser(),
  ]);

  // chain to retrive relevant docs
  const retriveValChain = retriever.pipe(
    RunnableLambda.from((docs: Document[]) => combineDocumentsFn(docs))
  );

  // Chain to generate answer based on context & history
  const answerChain = RunnableSequence.from([
    {
      context: RunnableSequence.from([
        (input) => input.question,
        retriveValChain,
      ]),
      chat_history: (input) => input.chat_history,
      question: (input) => input.question,
    },
    answerPrompt,
    model,
    new StringOutputParser(),
  ]);

  // Final conversational QA flow

  const conversationalRetrievalQAChain = RunnableSequence.from([
    {
      question: standaloneQuestionChain,
      chat_history: (input) => input.chat_history,
    },
    answerChain,
  ]);
  return conversationalRetrievalQAChain;
};
