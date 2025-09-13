"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  Send,
  FileText,
  MessageCircle,
  Loader2,
  Bot,
  User,
} from "lucide-react";

type Message = {
  type: "apiMessage" | "userMessage";
  message: string;
  //   timestamp: string;
};

export default function PDFReader() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [namespace, setNamespace] = useState<string | null>(null);

  // ✅ Handle PDF Upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    console.log(file);
    if (!file || file.type !== "application/pdf") return;

    setPdfFile(file);
    setMessages([]);
    setIsLoading(true);

    const formData = new FormData();
    formData.append("files", file);

    try {
      const res = await fetch("http://localhost:8080/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setNamespace(data.namespace);
        alert("PDF uploaded and ingested successfully!");
      } else {
        alert(data.error || "Failed to upload PDF");
      }
    } catch (error) {
      console.error(error);
      alert("Error uploading PDF");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Send Question to Backend
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !namespace) return;

    const userMsg: Message = {
      type: "userMessage",
      message: inputValue,
      //   timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: inputValue,
          namespace,
        }),
      });
      const data = await res.json();
      console.log(data, "data");
      const botMsg: Message = {
        type: "apiMessage",
        message: data || "No answer found.",
        // timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      alert("Error querying PDF");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 w-full max-w-none sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0 shadow-lg backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/50 dark:border-slate-700/50">
        <CardContent className="p-3 sm:p-4 md:p-6 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            PDF Reader
          </h1>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="ml-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            {pdfFile ? "Change" : "Upload PDF"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full w-full p-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.type === "userMessage" ? "justify-end" : "justify-start"
              } mb-4`}
            >
              <div
                className={`flex gap-3 max-w-[80%] ${
                  msg.type === "userMessage" ? "flex-row-reverse" : ""
                }`}
              >
                <Avatar>
                  <AvatarFallback
                    className={`${
                      msg.type === "userMessage"
                        ? "bg-blue-500 text-white"
                        : "bg-green-500 text-white"
                    }`}
                  >
                    {msg.type === "userMessage" ? <User /> : <Bot />}
                  </AvatarFallback>
                </Avatar>
                <Card
                  className={`p-3 ${
                    msg.type === "userMessage"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-slate-800"
                  }`}
                >
                  <p>{msg.message}</p>
                  <Separator className="my-2" />
                </Card>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Input */}
      <Card className="border-t border-slate-200 dark:border-slate-700">
        <CardContent className="flex items-center gap-2 p-4">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              pdfFile
                ? "Ask something about your PDF..."
                : "Upload a PDF first..."
            }
            disabled={!pdfFile || isLoading}
            className="flex-1"
            rows={1}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || !pdfFile || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
