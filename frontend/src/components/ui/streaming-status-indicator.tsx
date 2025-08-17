import React from 'react';
import { Badge } from './badge';
import { 
  Loader2, 
  Brain, 
  MessageSquare, 
  CheckCircle, 
  XCircle 
} from 'lucide-react';
import type { StreamingStatus } from '../../services/chatService';

interface StreamingStatusIndicatorProps {
  status: StreamingStatus;
  className?: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'initializing':
      return <Loader2 className="w-4 h-4 animate-spin" />;
    case 'thinking':
      return <Brain className="w-4 h-4 animate-pulse" />;
    case 'responding':
      return <MessageSquare className="w-4 h-4 animate-pulse" />;
    case 'complete':
      return <CheckCircle className="w-4 h-4" />;
    case 'error':
      return <XCircle className="w-4 h-4" />;
    default:
      return <Loader2 className="w-4 h-4 animate-spin" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'initializing':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'thinking':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'responding':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'complete':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'error':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusText = (status: string, currentStep?: string) => {
  if (currentStep) {
    const formattedStep = currentStep
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return `${status.charAt(0).toUpperCase() + status.slice(1)} • ${formattedStep}`;
  }
  
  switch (status) {
    case 'initializing':
      return 'Initializing...';
    case 'thinking':
      return 'Thinking...';
    case 'responding':
      return 'Responding...';
    case 'complete':
      return 'Complete';
    case 'error':
      return 'Error';
    default:
      return 'Processing...';
  }
};

export const StreamingStatusIndicator: React.FC<StreamingStatusIndicatorProps> = ({
  status,
  className = ''
}) => {
  if (status.status === 'complete') {
    return null; // Don't show when complete
  }

  return (
    <div className={`flex items-center justify-center py-2 ${className}`}>
      <Badge 
        variant="outline" 
        className={`flex items-center space-x-1 text-xs px-2 py-1 ${getStatusColor(status.status)}`}
      >
        {getStatusIcon(status.status)}
        <span className="ml-1">
          {getStatusText(status.status, status.current_step)}
        </span>
      </Badge>
    </div>
  );
};
