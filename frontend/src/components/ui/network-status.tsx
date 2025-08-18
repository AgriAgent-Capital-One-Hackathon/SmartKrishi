import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Wifi, WifiOff, Activity, Zap } from 'lucide-react';

interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  downloadSpeed?: number;
  latency?: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
}

interface NetworkStatusProps {
  className?: string;
}

export function NetworkStatus({ className }: NetworkStatusProps) {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    quality: 'unknown' as any
  });

  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Initial check
    checkNetworkStatus();

    // Set up listeners
    const handleOnline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: true }));
      checkNetworkStatus();
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({ 
        ...prev, 
        isOnline: false, 
        quality: 'offline',
        latency: undefined,
        downloadSpeed: undefined
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic checks every 30 seconds when online
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkNetworkStatus();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const checkNetworkStatus = async () => {
    if (!navigator.onLine) {
      setNetworkStatus(prev => ({ 
        ...prev, 
        isOnline: false, 
        quality: 'offline',
        latency: undefined,
        downloadSpeed: undefined
      }));
      return;
    }

    setIsChecking(true);

    try {
      // Get connection info if available
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      const connectionType = connection?.effectiveType || connection?.type || 'unknown';

      // Measure latency
      const startTime = performance.now();
      
      // Use a lightweight endpoint or fallback to a small resource
      const testUrl = `${import.meta.env.VITE_API_BASE_URL}/api/v1/fallback/health`;
      const token = localStorage.getItem('auth_token');
      
      try {
        await fetch(testUrl, {
          method: 'GET', // Use GET to minimize data transfer
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          cache: 'no-cache'
        });
        
        const latency = Math.round(performance.now() - startTime);
        
        // Determine quality based on latency and connection type
        let quality: NetworkStatus['quality'];
        if (latency < 100) {
          quality = 'excellent';
        } else if (latency < 300) {
          quality = 'good';
        } else if (latency < 600) {
          quality = 'fair';
        } else {
          quality = 'poor';
        }

        // Estimate download speed based on connection type (rough estimates)
        let estimatedSpeed: number | undefined;
        switch (connectionType) {
          case '4g':
            estimatedSpeed = 25; // Mbps
            break;
          case '3g':
            estimatedSpeed = 3;
            break;
          case '2g':
            estimatedSpeed = 0.25;
            break;
          case 'slow-2g':
            estimatedSpeed = 0.05;
            break;
          default:
            estimatedSpeed = latency < 200 ? 20 : latency < 500 ? 5 : 1;
        }

        setNetworkStatus({
          isOnline: true,
          connectionType,
          latency,
          downloadSpeed: estimatedSpeed,
          quality
        });

      } catch (error) {
        // Fallback: test with a simple ping to a reliable service
        const fallbackStart = performance.now();
        try {
          await fetch('https://www.google.com/favicon.ico', { 
            mode: 'no-cors',
            cache: 'no-cache'
          });
          const fallbackLatency = Math.round(performance.now() - fallbackStart);
          
          setNetworkStatus({
            isOnline: true,
            connectionType,
            latency: fallbackLatency,
            downloadSpeed: fallbackLatency < 500 ? 5 : 1,
            quality: fallbackLatency < 300 ? 'good' : fallbackLatency < 600 ? 'fair' : 'poor'
          });
        } catch (fallbackError) {
          setNetworkStatus({
            isOnline: false,
            connectionType: 'none',
            quality: 'offline'
          });
        }
      }

    } catch (error) {
      // Error handling
      setNetworkStatus(prev => ({
        ...prev,
        quality: 'poor',
        latency: undefined,
        downloadSpeed: undefined
      }));
    } finally {
      setIsChecking(false);
    }
  };

  const getQualityColor = (quality: NetworkStatus['quality']) => {
    switch (quality) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSignalIcon = () => {
    if (!networkStatus.isOnline) return <WifiOff className="w-5 h-5 text-red-500" />;
    
    switch (networkStatus.quality) {
      case 'excellent':
        return <Wifi className="w-5 h-5 text-green-500" />;
      case 'good':
        return <Wifi className="w-5 h-5 text-blue-500" />;
      case 'fair':
        return <Wifi className="w-5 h-5 text-yellow-500" />;
      case 'poor':
        return <WifiOff className="w-5 h-5 text-orange-500" />;
      default:
        return <Wifi className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {getSignalIcon()}
          Network Status
          {isChecking && (
            <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Connection:</span>
          <Badge className={`text-xs ${getQualityColor(networkStatus.quality)}`}>
            {networkStatus.isOnline 
              ? networkStatus.quality.charAt(0).toUpperCase() + networkStatus.quality.slice(1)
              : 'Offline'
            }
          </Badge>
        </div>

        {networkStatus.isOnline && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Type:</span>
              <span className="text-sm font-medium">
                {networkStatus.connectionType.toUpperCase()}
              </span>
            </div>

            {networkStatus.latency && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Latency:
                </span>
                <span className="text-sm font-medium">
                  {networkStatus.latency}ms
                </span>
              </div>
            )}

            {networkStatus.downloadSpeed && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Est. Speed:
                </span>
                <span className="text-sm font-medium">
                  {networkStatus.downloadSpeed}Mbps
                </span>
              </div>
            )}
          </>
        )}

        <div className="pt-2 border-t">
          <button
            onClick={checkNetworkStatus}
            disabled={isChecking}
            className="w-full text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {isChecking ? 'Checking...' : 'Refresh Status'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
