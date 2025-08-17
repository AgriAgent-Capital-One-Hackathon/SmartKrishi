import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { 
  ChevronDown, 
  ChevronRight, 
  Brain, 
  Settings, 
  Code, 
  Globe, 
  BarChart3,
  MessageSquare,
  Lightbulb,
  Search
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible.tsx';
import type { ReasoningStep } from '../../services/chatService';

interface AIReasoningPanelProps {
  reasoningSteps: ReasoningStep[];
  isVisible: boolean;
  onToggle: () => void;
  isLoading?: boolean;
}

const getStepIcon = (stepType: string) => {
  switch (stepType) {
    case 'log':
      return <Settings className="w-4 h-4" />;
    case 'plan':
      return <Brain className="w-4 h-4" />;
    case 'thinking':
      return <Lightbulb className="w-4 h-4" />;
    case 'tool_call':
      return <Settings className="w-4 h-4" />;
    case 'code_execution':
      return <Code className="w-4 h-4" />;
    case 'url_context':
      return <Globe className="w-4 h-4" />;
    case 'visualization':
      return <BarChart3 className="w-4 h-4" />;
    case 'grounding_web_search_queries':
      return <Search className="w-4 h-4" />;
    case 'grounding_chunks':
      return <Globe className="w-4 h-4" />;
    default:
      return <MessageSquare className="w-4 h-4" />;
  }
};

const getStepColor = (stepType: string) => {
  switch (stepType) {
    case 'log':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'plan':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'thinking':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'tool_call':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'code_execution':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'url_context':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'visualization':
      return 'bg-pink-100 text-pink-800 border-pink-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

const formatStepType = (stepType: string) => {
  return stepType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const ReasoningStepCard: React.FC<{ step: ReasoningStep; isExpanded: boolean; onToggle: () => void }> = ({ 
  step, 
  isExpanded, 
  onToggle 
}) => {
  const hasContent = step.content || step.tool_result || step.step_metadata;
  
  return (
    <Card className="mb-3 border-l-4 border-l-green-400">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStepIcon(step.step_type)}
                <CardTitle className="text-sm font-medium">
                  {formatStepType(step.step_type)}
                </CardTitle>
                {step.stage && (
                  <Badge variant="secondary" className="text-xs">
                    {step.stage}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={`text-xs ${getStepColor(step.step_type)}`}>
                  {step.step_order}
                </Badge>
                {hasContent && (
                  isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        {hasContent && (
          <CollapsibleContent>
            <CardContent className="pt-0">
              {step.content && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-600 mb-1">Content</h4>
                  <div className="bg-gray-50 p-2 rounded text-sm whitespace-pre-wrap">
                    {step.content}
                  </div>
                </div>
              )}
              
              {step.tool_name && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-600 mb-1">Tool</h4>
                  <Badge variant="outline" className="text-xs">
                    {step.tool_name}
                  </Badge>
                </div>
              )}
              
              {step.tool_args && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-600 mb-1">Arguments</h4>
                  <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                    {step.tool_args}
                  </div>
                </div>
              )}
              
              {step.tool_result && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-600 mb-1">Result</h4>
                  <div className="bg-green-50 p-2 rounded text-xs">
                    <pre className="whitespace-pre-wrap">
                      {typeof step.tool_result === 'string' 
                        ? step.tool_result 
                        : JSON.stringify(step.tool_result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              {step.step_metadata && Object.keys(step.step_metadata).length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-600 mb-1">Metadata</h4>
                  <details className="bg-gray-50 p-2 rounded">
                    <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800">
                      Show metadata
                    </summary>
                    <pre className="text-xs mt-2 whitespace-pre-wrap">
                      {JSON.stringify(step.step_metadata, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
              
              <div className="text-xs text-gray-400">
                {new Date(step.created_at).toLocaleTimeString()}
              </div>
            </CardContent>
          </CollapsibleContent>
        )}
      </Collapsible>
    </Card>
  );
};

export const AIReasoningPanel: React.FC<AIReasoningPanelProps> = ({
  reasoningSteps,
  isVisible,
  onToggle,
  isLoading = false
}) => {
  const [expandedSteps, setExpandedSteps] = React.useState<Set<string>>(new Set());
  
  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(stepId)) {
        newExpanded.delete(stepId);
      } else {
        newExpanded.add(stepId);
      }
      return newExpanded;
    });
  };

  const expandAll = () => {
    setExpandedSteps(new Set(reasoningSteps.map(step => step.id)));
  };

  const collapseAll = () => {
    setExpandedSteps(new Set());
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="w-96 border-l border-gray-200 bg-white flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-blue-500" />
            AI Reasoning
          </h3>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-200 rounded"
            title="Close reasoning panel"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        {reasoningSteps.length > 0 && (
          <div className="flex space-x-2">
            <button
              onClick={expandAll}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Expand All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={collapseAll}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Collapse All
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : reasoningSteps.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Brain className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No reasoning steps yet</p>
            <p className="text-xs mt-1">Steps will appear here as AI processes your message</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reasoningSteps
              .sort((a, b) => a.step_order - b.step_order)
              .map(step => (
                <ReasoningStepCard
                  key={step.id}
                  step={step}
                  isExpanded={expandedSteps.has(step.id)}
                  onToggle={() => toggleStep(step.id)}
                />
              ))}
          </div>
        )}
      </div>

      {reasoningSteps.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600 flex items-center justify-between">
            <span>{reasoningSteps.length} reasoning steps</span>
            <Badge variant="outline" className="text-xs">
              {reasoningSteps.filter(s => s.step_type === 'tool_call').length} tools used
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};
