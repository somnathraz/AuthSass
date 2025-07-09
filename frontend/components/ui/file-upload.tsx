import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  X, 
  Image, 
  File, 
  CheckCircle,
  AlertCircle,
  Camera
} from "lucide-react";

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "avatar" | "compact";
  preview?: boolean;
}

export function FileUpload({
  onFileSelect,
  accept = {
    "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"]
  },
  maxSize = 5 * 1024 * 1024, // 5MB
  maxFiles = 1,
  disabled = false,
  className,
  variant = "default",
  preview = true
}: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors?.[0]?.code === "file-too-large") {
        setError(`File too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
      } else if (rejection.errors?.[0]?.code === "file-invalid-type") {
        setError("Invalid file type. Please select a valid image file.");
      } else {
        setError("Invalid file selected.");
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Create preview for images
      if (preview && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }

      // Simulate upload progress
      setUploadStatus("uploading");
      setUploadProgress(0);
      
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setUploadStatus("success");
            onFileSelect(acceptedFiles);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
  }, [maxSize, onFileSelect, preview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    disabled: disabled || uploadStatus === "uploading"
  });

  const clearFile = () => {
    setPreviewUrl(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setError(null);
  };

  if (variant === "avatar") {
    return (
      <div className={cn("relative", className)}>
        <div
          {...getRootProps()}
          className={cn(
            "relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer group",
            isDragActive && "border-primary bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Avatar preview"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <Camera className="h-8 w-8 text-gray-400 group-hover:text-gray-500" />
            </div>
          )}
          
          {/* Upload overlay */}
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="h-6 w-6 text-white" />
          </div>
          
          {/* Status indicator */}
          {uploadStatus === "uploading" && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <div className="text-white text-xs font-medium">{uploadProgress}%</div>
            </div>
          )}
          
          {uploadStatus === "success" && (
            <div className="absolute -top-1 -right-1">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Clear button */}
        {previewUrl && (
          <Button
            size="sm"
            variant="destructive"
            onClick={clearFile}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}

        {error && (
          <p className="text-xs text-destructive mt-2">{error}</p>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("space-y-2", className)}>
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer",
            isDragActive && "border-primary bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          
          <div className="flex items-center justify-center space-x-2">
            <Upload className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {isDragActive ? "Drop file here" : "Click to upload"}
            </span>
          </div>
        </div>

        {uploadStatus === "uploading" && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-xs text-gray-500">Uploading... {uploadProgress}%</p>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p className="text-xs">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer",
            isDragActive && "border-primary bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          
          {previewUrl ? (
            <div className="space-y-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="mx-auto max-h-48 rounded-lg"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                {accept["image/*"] ? (
                  <Image className="h-6 w-6 text-gray-400" />
                ) : (
                  <File className="h-6 w-6 text-gray-400" />
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">
                  {isDragActive ? "Drop files here" : "Upload files"}
                </h3>
                <p className="text-sm text-gray-500">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-xs text-gray-400">
                  Maximum file size: {(maxSize / 1024 / 1024).toFixed(1)}MB
                </p>
              </div>
            </div>
          )}
        </div>

        {uploadStatus === "uploading" && (
          <div className="mt-4 space-y-2">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-gray-500">Uploading... {uploadProgress}%</p>
          </div>
        )}

        {uploadStatus === "success" && (
          <div className="mt-4 flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <p className="text-sm">File uploaded successfully!</p>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Avatar upload component specifically for profile pictures
export function AvatarUpload({
  currentAvatar,
  onAvatarChange,
  className
}: {
  currentAvatar?: string;
  onAvatarChange: (file: File) => void;
  className?: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar || null);

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      onAvatarChange(files[0]);
    }
  };

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <FileUpload
        variant="avatar"
        onFileSelect={handleFileSelect}
        accept={{ "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] }}
        maxSize={2 * 1024 * 1024} // 2MB for avatars
        maxFiles={1}
        preview={true}
      />
      <div className="text-center">
        <p className="text-sm font-medium">Profile Picture</p>
        <p className="text-xs text-muted-foreground">
          Click to upload a new picture (max 2MB)
        </p>
      </div>
    </div>
  );
} 