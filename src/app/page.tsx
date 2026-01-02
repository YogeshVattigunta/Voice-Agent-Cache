"use client";

import { useState } from "react";
import { DocumentUpload } from "@/components/DocumentUpload";
import { VoiceAgent } from "@/components/VoiceAgent";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, FileText, MessageSquareText, Mic2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [documentContent, setDocumentContent] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const isReady = documentContent.length > 0 && systemPrompt.trim().length > 0;

  const handleDocumentProcessed = (content: string, fileName: string) => {
    setDocumentContent(content);
    setDocumentName(fileName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-200/20 dark:bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-200/20 dark:bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Voice Assistant
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Document Voice Agent
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Upload your documents, configure a custom persona, and have natural voice conversations with your content
          </p>
        </motion.header>

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Upload Document</CardTitle>
                    <CardDescription>Add your PDF or text file</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <DocumentUpload
                  onDocumentProcessed={handleDocumentProcessed}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                />
                {documentContent && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-medium text-slate-800 dark:text-slate-200">Loaded:</span>{" "}
                      {documentName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {documentContent.length.toLocaleString()} characters extracted
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-900/30">
                    <MessageSquareText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">System Prompt</CardTitle>
                    <CardDescription>Define the agent&apos;s personality</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="e.g., You are a friendly customer support agent for our company. Be helpful, concise, and professional when answering questions about our products and services."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="min-h-[140px] resize-none bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500"
                />
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This will shape how the voice agent responds
                  </p>
                  <span className="text-xs text-slate-400">
                    {systemPrompt.length} chars
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                    <Mic2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Voice Conversation</CardTitle>
                    <CardDescription>
                      {isReady 
                        ? "Click the mic to start talking" 
                        : "Complete setup to enable voice"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <VoiceAgent
                  documentContent={documentContent}
                  systemPrompt={systemPrompt}
                  isReady={isReady}
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>


      </div>
    </div>
  );
}
