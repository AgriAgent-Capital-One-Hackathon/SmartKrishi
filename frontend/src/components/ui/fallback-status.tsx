import { useState, useEffect } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { Alert, AlertDescription } from './alert.tsx';
import { 
  Wifi, 
  WifiOff, 
  Phone, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Settings,
  Smartphone
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface FallbackStatusProps {
  onOpenSettings?: () => void;
  className?: string;
}

interface FallbackHealth {
  auto_fallback_enabled: boolean;
  fallback_active: boolean;
  network_quality: 'good' | 'fair' | 'poor' | 'unknown';
  last_network_check: string;
}

export function FallbackStatus({ onOpenSettings, className }: FallbackStatusProps) {
  const [health, setHealth] = useState<FallbackHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHealth();
    // Poll health status every 30 seconds
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/fallback/health`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHealth(data);
        setError(null);
      } else {
        throw new Error('Failed to load fallback health');
      }
    } catch (error) {
      // Error handling
      setError('Failed to load status');
    } finally {
      setLoading(false);
    }
  };

  const deactivateFallback = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/fallback/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadHealth(); // Refresh status
      }
    } catch (error) {
      // Error handling
    }
  };

  const getNetworkIcon = (quality: string) => {
    switch (quality) {
      case 'good':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'fair':
        return <Wifi className="h-4 w-4 text-yellow-500" />;
      case 'poor':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getNetworkText = (quality: string) => {
    switch (quality) {
      case 'good':
        return 'Good connection';
      case 'fair':
        return 'Fair connection';
      case 'poor':
        return 'Poor connection';
      default:
        return 'Unknown status';
    }
  };

  const getNetworkColor = (quality: string) => {
    switch (quality) {
      case 'good':
        return 'text-green-600';
      case 'fair':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className={cn("w-full", className)}>
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="animate-pulse flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className={cn("w-full", className)}>
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error || 'Failed to load fallback status'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If fallback is active, show prominent alert
  if (health.fallback_active) {
    return (
      <div className={cn("w-full", className)}>
        <Alert className="border-orange-200 bg-orange-50">
          <Phone className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-orange-800 mb-1">SMS Fallback Active</div>
                <div className="text-sm text-orange-700">
                  You're receiving farming assistance via SMS due to poor connection.
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  onClick={deactivateFallback}
                  size="sm"
                  variant="outline"
                  className="text-orange-700 border-orange-300 hover:bg-orange-100"
                >
                  <X className="h-4 w-4 mr-1" />
                  Stop SMS
                </Button>
                {onOpenSettings && (
                  <Button
                    onClick={onOpenSettings}
                    size="sm"
                    variant="outline"
                    className="text-orange-700 border-orange-300 hover:bg-orange-100"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Normal status display
  return (
    <div className={cn("w-full", className)}>
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getNetworkIcon(health.network_quality)}
              <div>
                <div className={`text-sm font-medium ${getNetworkColor(health.network_quality)}`}>
                  {getNetworkText(health.network_quality)}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Smartphone className="h-3 w-3" />
                  {health.auto_fallback_enabled ? 'Auto fallback enabled' : 'Auto fallback disabled'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge 
                variant={health.auto_fallback_enabled ? "default" : "secondary"}
                className={cn(
                  "text-xs",
                  health.auto_fallback_enabled 
                    ? "bg-green-100 text-green-700 border-green-200" 
                    : "bg-gray-100 text-gray-600"
                )}
              >
                {health.auto_fallback_enabled ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Auto SMS
                  </>
                ) : (
                  'Manual Only'
                )}
              </Badge>

              {onOpenSettings && (
                <Button
                  onClick={onOpenSettings}
                  size="sm"
                  variant="ghost"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Show warning if auto fallback is disabled */}
          {!health.auto_fallback_enabled && health.network_quality === 'poor' && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Poor connection detected. Consider enabling auto SMS fallback.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
