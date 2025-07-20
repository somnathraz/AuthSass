import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  TrendingUp,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import {
  useAuditAnalytics,
  formatRelativeTime,
  getEventTypeIcon,
} from "@/services/audit.service";

interface AuditAnalyticsDashboardProps {
  customerId: string;
  applicationId?: string;
  timeRange?: string;
  onTimeRangeChange?: (timeRange: string) => void;
}

export const AuditAnalyticsDashboard: React.FC<
  AuditAnalyticsDashboardProps
> = ({ customerId, applicationId, timeRange = "7d", onTimeRangeChange }) => {
  const { data, loading, error } = useAuditAnalytics(
    customerId,
    applicationId,
    timeRange
  );
  const analytics = data?.auditAnalytics;

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-red-600">
          <p>Failed to load analytics: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const timeRangeOptions = [
    { value: "1h", label: "Last Hour" },
    { value: "24h", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "90d", label: "Last 90 Days" },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Audit Analytics</h2>
        <Select value={timeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeRangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Events"
          value={analytics?.totalEvents || 0}
          icon={<Activity className="h-5 w-5" />}
          loading={loading}
        />
        <MetricCard
          title="Success Rate"
          value={`${analytics?.successRate || 0}%`}
          icon={<CheckCircle className="h-5 w-5" />}
          loading={loading}
          valueColor={
            (analytics?.successRate || 0) >= 95
              ? "text-green-600"
              : (analytics?.successRate || 0) >= 90
              ? "text-yellow-600"
              : "text-red-600"
          }
        />
        <MetricCard
          title="Unique Actors"
          value={analytics?.topActors?.length || 0}
          icon={<Users className="h-5 w-5" />}
          loading={loading}
        />
        <MetricCard
          title="Security Events"
          value={
            analytics?.eventsByCategory?.find((cat) =>
              ["SECURITY", "AUTHORIZATION", "AUTHENTICATION"].includes(
                cat.category
              )
            )?.count || 0
          }
          icon={<Shield className="h-5 w-5" />}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Events by Category</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {analytics?.eventsByCategory?.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{category.category}</span>
                      <span className="text-gray-500">{category.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            (category.count / (analytics?.totalEvents || 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Events by Tier */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Events by Tier</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {analytics?.eventsByTier?.map((tier) => (
                  <div
                    key={tier.tier}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          tier.tier === "PLATFORM"
                            ? "destructive"
                            : tier.tier === "CUSTOMER"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {tier.tier}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{tier.count}</div>
                      <div className="text-xs text-gray-500">
                        {(
                          (tier.count / (analytics?.totalEvents || 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {analytics?.recentActivity?.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <span className="text-lg">
                        {getEventTypeIcon(activity.eventType)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium truncate">
                          {activity.description}
                        </span>
                        {activity.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>
                          {activity.actor.email || activity.actor.type}
                        </span>
                        <span>•</span>
                        <span>{formatRelativeTime(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!analytics?.recentActivity ||
                  analytics.recentActivity.length === 0) && (
                  <p className="text-center text-gray-500 py-4">
                    No recent activity found.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Actors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Most Active Users</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-8"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {analytics?.topActors?.slice(0, 10).map((actor, index) => (
                  <div
                    key={actor.actorId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium truncate max-w-32">
                          {actor.actorEmail ||
                            `Actor ${actor.actorId.slice(-6)}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatRelativeTime(actor.lastActivity)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">{actor.eventCount}</Badge>
                  </div>
                ))}
                {(!analytics?.topActors ||
                  analytics.topActors.length === 0) && (
                  <p className="text-center text-gray-500 py-4">
                    No user activity found.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  loading: boolean;
  valueColor?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  loading,
  valueColor = "text-gray-900",
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {loading ? (
              <div className="h-8 bg-gray-200 rounded w-16 mt-2 animate-pulse"></div>
            ) : (
              <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
            )}
          </div>
          <div className="text-gray-400">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditAnalyticsDashboard;
