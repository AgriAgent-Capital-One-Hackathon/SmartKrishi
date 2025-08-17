import React, { createContext, useContext, useState } from 'react';

interface CollapsibleContextType {
  isOpen: boolean;
  toggle: () => void;
}

const CollapsibleContext = createContext<CollapsibleContextType | undefined>(undefined);

interface CollapsibleProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({ 
  open, 
  onOpenChange, 
  children, 
  className 
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  
  const toggle = () => {
    const newState = !isOpen;
    if (onOpenChange) {
      onOpenChange(newState);
    } else {
      setInternalOpen(newState);
    }
  };

  return (
    <CollapsibleContext.Provider value={{ isOpen, toggle }}>
      <div className={className}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
};

interface CollapsibleTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const CollapsibleTrigger: React.FC<CollapsibleTriggerProps> = ({ 
  asChild, 
  children, 
  className 
}) => {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error('CollapsibleTrigger must be used within a Collapsible');
  }

  const { toggle } = context;

  if (asChild && React.isValidElement(children)) {
    const childProps = children.props as any;
    return React.cloneElement(children, {
      ...childProps,
      onClick: (e: React.MouseEvent) => {
        if (childProps.onClick) {
          childProps.onClick(e);
        }
        toggle();
      },
      className: `${childProps.className || ''} ${className || ''}`.trim()
    });
  }

  return (
    <button onClick={toggle} className={className}>
      {children}
    </button>
  );
};

interface CollapsibleContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CollapsibleContent: React.FC<CollapsibleContentProps> = ({ 
  children, 
  className 
}) => {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error('CollapsibleContent must be used within a Collapsible');
  }

  const { isOpen } = context;

  if (!isOpen) return null;

  return (
    <div className={className}>
      {children}
    </div>
  );
};
