import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, RefreshCw, Clock, Download } from "lucide-react";

// Basic Spinner Loader
export function SpinnerLoader({ 
  className, 
  size = "default",
  text 
}: { 
  className?: string;
  size?: "sm" | "default" | "lg";
  text?: string;
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// Profile Loading Skeleton
export function ProfileSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-20 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// Apps Grid Loading Skeleton
export function AppsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full mb-4" />
            <div className="flex justify-between">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Page Loading with Text
export function PageLoader({ 
  title = "Loading...",
  description,
  className 
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("fixed inset-0 flex flex-col items-center justify-center bg-background z-50", className)}>
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-muted"></div>
        <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
      <div className="text-center space-y-2 mt-4">
        <h3 className="font-medium text-lg">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        )}
      </div>
    </div>
  );
}

// Inline Loading State
export function InlineLoader({ 
  text = "Loading...",
  className 
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center space-x-2 py-2", className)}>
      <RefreshCw className="h-4 w-4 animate-spin" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}

// Button Loading State
export function ButtonLoader({ 
  children,
  loading = false,
  loadingText = "Loading...",
  className
}: {
  children: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      <span>{loading ? loadingText : children}</span>
    </div>
  );
}

// Data Table Loading
export function TableSkeleton({ 
  rows = 5,
  columns = 4 
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex space-x-4">
              {[...Array(columns)].map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Upload Progress Loader
export function UploadLoader({ 
  progress = 0,
  fileName,
  className 
}: {
  progress?: number;
  fileName?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center space-x-2">
        <Download className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          {fileName ? `Uploading ${fileName}...` : "Uploading..."}
        </span>
        <span className="text-xs text-muted-foreground">{progress}%</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}

// Empty State with Loading Option
export function EmptyStateLoader({
  title = "No data available",
  description = "Data will appear here once loaded",
  loading = false,
  icon: Icon = Clock,
  className
}: {
  title?: string;
  description?: string;
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 space-y-4", className)}>
      <div className="rounded-full bg-muted p-4">
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <Icon className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      </div>
    </div>
  );
}

// Full Screen Overlay Loader
export function OverlayLoader({
  title = "Processing...",
  description,
  className
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn(
      "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center",
      className
    )}>
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="h-8 w-8 rounded-full border-2 border-muted"></div>
              <div className="absolute top-0 left-0 h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-medium">{title}</h3>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 