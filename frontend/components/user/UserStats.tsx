"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  TrendingUp, 
  Activity,
  Shield,
  Eye,
  RefreshCw,
} from "lucide-react";

// Import user service hooks
import { useUserStats, useUserStatsSummary } from "@/services/user.service";

interface UserStatsProps {
  showDetailedStats?: boolean;
  refreshInterval?: number;
}

export function UserStats({ 
  showDetailedStats = true,
  refreshInterval = 30000 
}: UserStatsProps) {
  const { data, loading, error, refetch } = useUserStats();
  const { summary, fullStats } = useUserStatsSummary();

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading user statistics: {error.message}</p>
            <button 
              onClick={() => refetch()} 
              className="mt-2 flex items-center justify-center mx-auto text-blue-600 hover:text-blue-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading || !summary) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="w-16 h-8 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = fullStats!;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {summary.activeRate.toFixed(1)}% of total users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Today</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.newUsersToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {summary.growthRate > 0 ? '+' : ''}{summary.growthRate.toFixed(1)}% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.growthMetrics.dailyGrowth > 0 ? '+' : ''}
              {stats.growthMetrics.dailyGrowth.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Daily growth rate
            </p>
          </CardContent>
        </Card>
      </div>

      {showDetailedStats && (
        <>
          {/* Growth Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">New Users This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.newUsersThisWeek.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.growthMetrics.weeklyGrowth > 0 ? '+' : ''}
                  {stats.growthMetrics.weeklyGrowth.toFixed(1)}% from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">New Users This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.newUsersThisMonth.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.growthMetrics.monthlyGrowth > 0 ? '+' : ''}
                  {stats.growthMetrics.monthlyGrowth.toFixed(1)}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Activity Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((stats.activityMetrics.dailyActiveUsers / stats.totalUsers) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Daily active users
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User Distribution */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Users by Role */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Users by Role
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.usersByRole.map((roleData) => {
                  const percentage = (roleData.count / stats.totalUsers) * 100;
                  return (
                    <div key={roleData.role} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">{roleData.role.toLowerCase()}</span>
                        <span className="font-medium">{roleData.count}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}% of users
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Users by Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Users by Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.usersByStatus.map((statusData) => {
                  const percentage = (statusData.count / stats.totalUsers) * 100;
                  const getStatusColor = (status: string) => {
                    switch (status.toLowerCase()) {
                      case 'active': return 'bg-green-500';
                      case 'inactive': return 'bg-gray-500';
                      case 'suspended': return 'bg-red-500';
                      case 'pending': return 'bg-yellow-500';
                      default: return 'bg-gray-500';
                    }
                  };
                  
                  return (
                    <div key={statusData.status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">{statusData.status.toLowerCase()}</span>
                        <span className="font-medium">{statusData.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getStatusColor(statusData.status)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}% of users
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Users by Account Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Account Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.usersByAccountType.map((accountData) => {
                  const percentage = (accountData.count / stats.totalUsers) * 100;
                  return (
                    <div key={accountData.accountType} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">{accountData.accountType.toLowerCase()}</span>
                        <span className="font-medium">{accountData.count}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}% of users
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Activity Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                User Activity Metrics
              </CardTitle>
              <CardDescription>
                Active user engagement over different time periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.activityMetrics.dailyActiveUsers.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Daily Active Users</p>
                  <p className="text-xs text-muted-foreground">
                    {((stats.activityMetrics.dailyActiveUsers / stats.totalUsers) * 100).toFixed(1)}% of total
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.activityMetrics.weeklyActiveUsers.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Weekly Active Users</p>
                  <p className="text-xs text-muted-foreground">
                    {((stats.activityMetrics.weeklyActiveUsers / stats.totalUsers) * 100).toFixed(1)}% of total
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.activityMetrics.monthlyActiveUsers.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Monthly Active Users</p>
                  <p className="text-xs text-muted-foreground">
                    {((stats.activityMetrics.monthlyActiveUsers / stats.totalUsers) * 100).toFixed(1)}% of total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 