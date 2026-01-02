"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  onDocumentProcessed: (content: string, fileName: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export function DocumentUpload({
  onDocumentProcessed,
  isProcessing,
  setIsProcessing,
}: DocumentUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/process-document", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process document");
      }

      const data = await response.json();
      onDocumentProcessed(data.content, file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process document");
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setUploadedFile(file);
        processFile(file);
      }
    },
    [onDocumentProcessed]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  const removeFile = () => {
    setUploadedFile(null);
    setError(null);
    onDocumentProcessed("", "");
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer",
          "bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/50",
          isDragActive && "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 scale-[1.02]",
          !isDragActive && "border-slate-300 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10",
          isProcessing && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4 text-center">
          {isProcessing ? (
            <>
              <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  Processing document...
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Extracting text content
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors">
                <Upload className="w-8 h-8 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  {isDragActive ? "Drop your document here" : "Upload your document"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  PDF, TXT, MD, DOC, or DOCX files supported
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {uploadedFile && !isProcessing && !error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-800">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
              {uploadedFile.name}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {(uploadedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              removeFile();
            }}
            className="text-slate-400 hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
