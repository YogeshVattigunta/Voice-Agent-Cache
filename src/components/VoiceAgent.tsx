"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX, Loader2, MessageSquare, StopCircle, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface VoiceAgentProps {
  documentContent: string;
  systemPrompt: string;
  isReady: boolean;
}

interface VoiceOption {
  name: string;
  lang: string;
  voiceURI: string;
}

export function VoiceAgent({ documentContent, systemPrompt, isReady }: VoiceAgentProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      const englishVoices = voices
        .filter(v => v.lang.startsWith("en"))
        .map(v => ({
          name: v.name,
          lang: v.lang,
          voiceURI: v.voiceURI,
        }));
      
      const preferredVoices = englishVoices.filter(v => 
        v.name.includes("Google") || 
        v.name.includes("Microsoft") || 
        v.name.includes("Samantha") ||
        v.name.includes("Daniel") ||
        v.name.includes("Karen") ||
        v.name.includes("Moira")
      );
      
      const sortedVoices = [...preferredVoices, ...englishVoices.filter(v => !preferredVoices.includes(v))];
      setAvailableVoices(sortedVoices.slice(0, 12));
      
      if (sortedVoices.length > 0 && !selectedVoiceURI) {
        setSelectedVoiceURI(sortedVoices[0].voiceURI);
      }
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoiceURI]);

  const speakResponse = useCallback((text: string) => {
    if (isMuted || !text) return;
    
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    const voices = speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    speechSynthesis.speak(utterance);
  }, [isMuted, selectedVoiceURI]);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;

    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          documentContent,
          systemPrompt,
        }),
      });

      if (!response.ok) throw new Error("Chat failed");

      const data = await response.json();
      const assistantMessage = data.response;

      setMessages([...newMessages, { role: "assistant", content: assistantMessage }]);
      speakResponse(assistantMessage);
    } catch (err) {
      setError("Failed to get response. Please try again.");
      console.error("Chat error:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [messages, documentContent, systemPrompt, speakResponse]);

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setError("Speech recognition not supported in this browser");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setCurrentTranscript(interimTranscript || finalTranscript);

      if (finalTranscript) {
        setCurrentTranscript("");
        sendMessage(finalTranscript);
        recognition.stop();
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [sendMessage]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setCurrentTranscript("");
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && isSpeaking) {
      stopSpeaking();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-3 h-3 rounded-full transition-colors",
            isReady ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
          )} />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {isReady ? "Voice Agent Ready" : "Upload a document to start"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowVoiceSelector(!showVoiceSelector)}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <Settings2 className="w-4 h-4" />
            </Button>
            <AnimatePresence>
              {showVoiceSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-2 z-50 max-h-80 overflow-y-auto"
                >
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 pb-2">Voice</p>
                  {availableVoices.length === 0 ? (
                    <p className="text-xs text-slate-400 px-2 py-2">Loading voices...</p>
                  ) : (
                    availableVoices.map((voice) => (
                      <button
                        key={voice.voiceURI}
                        onClick={() => {
                          setSelectedVoiceURI(voice.voiceURI);
                          setShowVoiceSelector(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                          selectedVoiceURI === voice.voiceURI
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                            : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <span className="font-medium block truncate">{voice.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {voice.lang}
                        </span>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[300px] max-h-[400px]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs">
              {isReady 
                ? "Press the microphone button and start speaking to interact with your document"
                : "Upload a document and add a system prompt to begin"}
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] px-4 py-3 rounded-2xl",
                  message.role === "user"
                    ? "bg-emerald-600 text-white rounded-br-md"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md"
                )}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </motion.div>
          ))
        )}
        {currentTranscript && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-end"
          >
            <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-br-md">
              <p className="text-sm italic">{currentTranscript}...</p>
            </div>
          </motion.div>
        )}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 rounded-bl-md">
              <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        {isSpeaking && (
          <Button
            variant="outline"
            size="lg"
            onClick={stopSpeaking}
            className="rounded-full"
          >
            <StopCircle className="w-5 h-5 mr-2" />
            Stop
          </Button>
        )}
        
        <motion.button
          whileHover={{ scale: isReady ? 1.05 : 1 }}
          whileTap={{ scale: isReady ? 0.95 : 1 }}
          onClick={isListening ? stopListening : startListening}
          disabled={!isReady || isProcessing || isSpeaking}
          className={cn(
            "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
            "shadow-lg hover:shadow-xl",
            !isReady && "opacity-50 cursor-not-allowed",
            isListening 
              ? "bg-red-500 hover:bg-red-600" 
              : "bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
            (isProcessing || isSpeaking) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isListening && (
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ opacity: 0.3 }}
            />
          )}
          {isListening ? (
            <MicOff className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </motion.button>
      </div>

      <p className="text-center text-xs text-slate-400 mt-3">
        {isListening 
          ? "Listening... Click to stop" 
          : isProcessing 
            ? "Processing..." 
            : isSpeaking 
              ? "Speaking..." 
              : "Click microphone to speak"}
      </p>
    </div>
  );
}
