import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Users, TrendingUp, Calendar, Crown, Zap } from "lucide-react";
import { format, startOfMonth, subMonths } from "date-fns";
import { nl } from "date-fns/locale";

interface AiUsageStats {
  totalScansThisMonth: number;
  totalScansLastMonth: number;
  totalUsers: number;
  activeUsersThisMonth: number;
  usageByTier: {
    tier: string;
    count: number;
    users: number;
  }[];
  topUsers: {
    userId: string;
    email: string;
    naam: string | null;
    tier: string;
    scanCount: number;
  }[];
  dailyUsage: {
    date: string;
    count: number;
  }[];
}

const AiUsageAnalytics = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["ai-usage-analytics"],
    queryFn: async (): Promise<AiUsageStats> => {
      const now = new Date();
      const firstDayThisMonth = startOfMonth(now).toISOString();
      const firstDayLastMonth = startOfMonth(subMonths(now, 1)).toISOString();
      const lastDayLastMonth = startOfMonth(now).toISOString();

      // Get all AI usage records for this month
      const { data: thisMonthUsage, error: thisMonthError } = await supabase
        .from("ai_usage")
        .select("user_id, created_at")
        .gte("created_at", firstDayThisMonth)
        .eq("usage_type", "invoice_scan");

      if (thisMonthError) throw thisMonthError;

      // Get all AI usage records for last month
      const { data: lastMonthUsage, error: lastMonthError } = await supabase
        .from("ai_usage")
        .select("user_id")
        .gte("created_at", firstDayLastMonth)
        .lt("created_at", lastDayLastMonth)
        .eq("usage_type", "invoice_scan");

      if (lastMonthError) throw lastMonthError;

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, naam");

      if (profilesError) throw profilesError;

      // Get all subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from("subscriptions")
        .select("user_id, tier, status");

      if (subsError) throw subsError;

      // Create a map of user_id to subscription tier
      const userTierMap = new Map<string, string>();
      subscriptions?.forEach(sub => {
        if (sub.status === "active" || sub.status === "trialing") {
          userTierMap.set(sub.user_id, sub.tier);
        }
      });

      // Calculate stats
      const totalScansThisMonth = thisMonthUsage?.length || 0;
      const totalScansLastMonth = lastMonthUsage?.length || 0;
      const totalUsers = profiles?.length || 0;
      
      // Count unique users this month
      const activeUserIds = new Set(thisMonthUsage?.map(u => u.user_id) || []);
      const activeUsersThisMonth = activeUserIds.size;

      // Usage by tier
      const tierCounts: Record<string, { count: number; users: Set<string> }> = {
        free: { count: 0, users: new Set() },
        basis: { count: 0, users: new Set() },
        pro: { count: 0, users: new Set() },
      };

      thisMonthUsage?.forEach(usage => {
        const tier = userTierMap.get(usage.user_id) || "free";
        if (tierCounts[tier]) {
          tierCounts[tier].count++;
          tierCounts[tier].users.add(usage.user_id);
        }
      });

      const usageByTier = Object.entries(tierCounts).map(([tier, data]) => ({
        tier,
        count: data.count,
        users: data.users.size,
      }));

      // Top users
      const userScanCounts = new Map<string, number>();
      thisMonthUsage?.forEach(usage => {
        userScanCounts.set(usage.user_id, (userScanCounts.get(usage.user_id) || 0) + 1);
      });

      const topUsers = Array.from(userScanCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId, scanCount]) => {
          const profile = profiles?.find(p => p.id === userId);
          return {
            userId,
            email: profile?.email || "Onbekend",
            naam: profile?.naam || null,
            tier: userTierMap.get(userId) || "free",
            scanCount,
          };
        });

      // Daily usage for the current month
      const dailyUsageMap = new Map<string, number>();
      thisMonthUsage?.forEach(usage => {
        const date = format(new Date(usage.created_at), "yyyy-MM-dd");
        dailyUsageMap.set(date, (dailyUsageMap.get(date) || 0) + 1);
      });

      const dailyUsage = Array.from(dailyUsageMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalScansThisMonth,
        totalScansLastMonth,
        totalUsers,
        activeUsersThisMonth,
        usageByTier,
        topUsers,
        dailyUsage,
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case "free": return "Gratis";
      case "basis": return "Basis";
      case "pro": return "Pro";
      default: return tier;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "free": return "bg-muted text-muted-foreground";
      case "basis": return "bg-primary/10 text-primary";
      case "pro": return "bg-chart-1/20 text-chart-1";
      default: return "bg-muted";
    }
  };

  const getGrowthPercentage = () => {
    if (!stats) return 0;
    if (stats.totalScansLastMonth === 0) return stats.totalScansThisMonth > 0 ? 100 : 0;
    return Math.round(((stats.totalScansThisMonth - stats.totalScansLastMonth) / stats.totalScansLastMonth) * 100);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Fout bij laden van analytics: {(error as Error).message}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Scans deze maand
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stats?.totalScansThisMonth}</span>
                {getGrowthPercentage() !== 0 && (
                  <Badge variant={getGrowthPercentage() > 0 ? "default" : "secondary"} className="text-xs">
                    {getGrowthPercentage() > 0 ? "+" : ""}{getGrowthPercentage()}%
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Scans vorige maand
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <span className="text-2xl font-bold">{stats?.totalScansLastMonth}</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              Actieve AI gebruikers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stats?.activeUsersThisMonth}</span>
                <span className="text-sm text-muted-foreground">van {stats?.totalUsers}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Gem. per actieve gebruiker
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <span className="text-2xl font-bold">
                {stats?.activeUsersThisMonth 
                  ? (stats.totalScansThisMonth / stats.activeUsersThisMonth).toFixed(1) 
                  : 0}
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage by Tier */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Gebruik per Tier
            </CardTitle>
            <CardDescription>
              AI scans verdeeld over abonnementstypen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {stats?.usageByTier.map(tierData => {
                  const maxCount = Math.max(...(stats?.usageByTier.map(t => t.count) || [1]));
                  const percentage = maxCount > 0 ? (tierData.count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={tierData.tier} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getTierColor(tierData.tier)}>
                            {getTierLabel(tierData.tier)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {tierData.users} gebruiker{tierData.users !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="font-medium">{tierData.count} scans</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Top Gebruikers
            </CardTitle>
            <CardDescription>
              Meest actieve AI gebruikers deze maand
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : stats?.topUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nog geen AI gebruik deze maand
              </p>
            ) : (
              <div className="space-y-2">
                {stats?.topUsers.map((user, index) => (
                  <div 
                    key={user.userId}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {user.naam || user.email.split("@")[0]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getTierColor(user.tier)} variant="secondary">
                        {getTierLabel(user.tier)}
                      </Badge>
                      <span className="text-sm font-medium">
                        {user.scanCount} scan{user.scanCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Usage Chart (Simple) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Dagelijks Gebruik
          </CardTitle>
          <CardDescription>
            AI scans per dag deze maand ({format(new Date(), "MMMM yyyy", { locale: nl })})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : stats?.dailyUsage.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nog geen AI gebruik deze maand
            </p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {stats?.dailyUsage.map((day, index) => {
                const maxCount = Math.max(...(stats?.dailyUsage.map(d => d.count) || [1]));
                const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                const date = new Date(day.date);
                
                return (
                  <div 
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-1"
                    title={`${format(date, "d MMM", { locale: nl })}: ${day.count} scans`}
                  >
                    <div 
                      className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    {index % Math.ceil(stats.dailyUsage.length / 10) === 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {format(date, "d")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AiUsageAnalytics;
