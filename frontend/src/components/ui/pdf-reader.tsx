"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
const backend_url = process.env.BACKEND_URL;
import {
  Upload,
  Send,
  FileText,
  MessageCircle,
  Loader2,
  Bot,
  User,
  CheckCircle,
  AlertCircle,
  X,
  File,
} from "lucide-react";

type Message = {
  type: "apiMessage" | "userMessage";
  message: string;
  timestamp: string;
};

export default function PDFReader() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [namespace, setNamespace] = useState<string | null>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear alerts after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const clearAlerts = () => {
    setError(null);
    setSuccess(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Handle PDF Upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please select a valid PDF file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      setError("File size must be less than 10MB.");
      return;
    }

    clearAlerts();
    setPdfFile(file);
    setMessages([]);
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("files", file);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      const res = await fetch(`http://localhost:8080/api/upload`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await res.json();

      if (res.ok) {
        setNamespace(data.namespace);
        setSuccess(
          "PDF uploaded and processed successfully! You can now ask questions."
        );
      } else {
        setError(data.error || "Failed to upload PDF. Please try again.");
        setPdfFile(null);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError("Network error. Please check your connection and try again.");
      setPdfFile(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Send Question to Backend
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !namespace || isLoading) return;

    const userMsg: Message = {
      type: "userMessage",
      message: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = inputValue.trim();
    setInputValue("");
    setIsLoading(true);
    clearAlerts();

    try {
      const res = await fetch(`http://localhost:8080/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentInput,
          namespace,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      const botMsg: Message = {
        type: "apiMessage",
        message:
          data.answer ||
          data ||
          "I couldn't find an answer to your question. Please try rephrasing it.",
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Query error:", error);
      setError("Failed to get response. Please try again.");

      // Add error message to chat
      const errorMsg: Message = {
        type: "apiMessage",
        message:
          "Sorry, I encountered an error while processing your question. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
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

  const removePDF = () => {
    setPdfFile(null);
    setNamespace(null);
    setMessages([]);
    clearAlerts();
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0 shadow-lg backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/50 dark:border-slate-700/50">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Docura
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Upload a PDF and ask questions about its content
              </p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              disabled={isUploading}
              className="hover:bg-blue-50 dark:hover:bg-slate-800"
            >
              <Upload className="h-4 w-4 mr-2" />
              {pdfFile ? "Change PDF" : "Upload PDF"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* File Status */}
          {pdfFile && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <File className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-blue-900 dark:text-blue-100 truncate">
                  {pdfFile.name}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {formatFileSize(pdfFile.size)}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Ready
              </Badge>
              <Button
                onClick={removePDF}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium">Processing PDF...</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Alerts */}
          {(error || success) && (
            <div className="mt-3">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-6 w-6 p-0"
                    onClick={() => setError(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Alert>
              )}
              {success && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {success}
                  </AlertDescription>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-6 w-6 p-0"
                    onClick={() => setSuccess(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messages.length === 0 && pdfFile && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Ready to chat!
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Your PDF has been processed. Ask any question about its
                  content below.
                </p>
              </div>
            )}

            {messages.length === 0 && !pdfFile && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <FileText className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  No PDF uploaded
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Upload a PDF document to start asking questions about its
                  content.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.type === "userMessage" ? "justify-end" : "justify-start"
                } gap-3`}
              >
                <div
                  className={`flex gap-3 max-w-[85%] ${
                    msg.type === "userMessage" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar className="flex-shrink-0">
                    <AvatarFallback
                      className={`${
                        msg.type === "userMessage"
                          ? "bg-blue-600 text-white"
                          : "bg-emerald-600 text-white"
                      }`}
                    >
                      {msg.type === "userMessage" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <Card
                      className={`p-3 shadow-sm ${
                        msg.type === "userMessage"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </Card>
                    <span
                      className={`text-xs text-slate-400 px-1 ${
                        msg.type === "userMessage" ? "text-right" : "text-left"
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start gap-3">
                <Avatar className="flex-shrink-0">
                  <AvatarFallback className="bg-emerald-600 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <Card className="p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                    <span className="text-sm text-slate-500">Thinking...</span>
                  </div>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <Card className="rounded-none border-x-0 border-b-0 shadow-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  pdfFile
                    ? "Ask anything about your PDF..."
                    : "Upload a PDF to start chatting..."
                }
                disabled={!pdfFile || isLoading || isUploading}
                className="min-h-[44px] max-h-32 resize-none border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400"
                rows={1}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={
                !inputValue.trim() || !pdfFile || isLoading || isUploading
              }
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 h-11 px-4"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {pdfFile && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
