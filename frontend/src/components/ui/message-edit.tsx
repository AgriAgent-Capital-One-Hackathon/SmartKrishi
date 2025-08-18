import { useState } from 'react';
import { Button } from './button';
import { Textarea } from './textarea';
import { Card, CardContent } from './card';
import { AlertTriangle, Save, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MessageEditProps {
  messageId: string;
  originalContent: string;
  onSave: (messageId: string, newContent: string) => Promise<boolean>;
  onCancel: () => void;
  className?: string;
}

export function MessageEdit({ 
  messageId, 
  originalContent, 
  onSave, 
  onCancel, 
  className 
}: MessageEditProps) {
  const [content, setContent] = useState(originalContent);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (content.trim() === originalContent.trim()) {
      onCancel(); // No changes made
      return;
    }

    setSaving(true);
    try {
      const success = await onSave(messageId, content.trim());
      if (success) {
        // Success handled by parent component
      } else {
        // Handle error if needed
        // Error handling
      }
    } catch (error) {
      // Error handling
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = content.trim() !== originalContent.trim();

  return (
    <Card className={cn("border-blue-200 bg-blue-50/50", className)}>
      <CardContent className="p-4 space-y-4">
        {/* Warning about clearing responses */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Edit Message</p>
            <p className="text-xs mt-1">
              Editing this message will clear all AI responses below. The conversation will continue from this edited message.
            </p>
          </div>
        </div>

        {/* Edit textarea */}
        <div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-20 resize-none border-blue-200 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Edit your message..."
            autoFocus
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {hasChanges ? (
              <span className="text-blue-600">Unsaved changes</span>
            ) : (
              <span>No changes made</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !content.trim() || !hasChanges}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              {saving ? 'Saving...' : 'Send'}
            </Button>
          </div>
        </div>

        {/* Character count */}
        <div className="text-xs text-gray-400 text-right">
          {content.length} characters
        </div>
      </CardContent>
    </Card>
  );
}
