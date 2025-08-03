import React, { useState } from 'react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Badge } from './ui/badge';
import { Upload, Plus, Image, FileText, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingActionButtonProps {
  onUploadClick: () => void;
  pendingCount?: number;
}

export function FloatingActionButton({ onUploadClick, pendingCount = 0 }: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      icon: Upload,
      label: 'Загрузить скриншоты',
      onClick: onUploadClick,
      primary: true
    },
    {
      icon: Camera,
      label: 'Сделать фото',
      onClick: () => {
        // Будущая функциональность для камеры
        console.log('Camera functionality');
      }
    },
    {
      icon: FileText,
      label: 'Импорт CSV',
      onClick: () => {
        // Будущая функциональность для CSV
        console.log('CSV import functionality');
      }
    }
  ];

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3 mb-3"
            >
              {actions.slice(1).map((action, index) => {
                const Icon = action.icon;
                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <Button
                        size="lg"
                        variant="secondary"
                        className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                        onClick={action.onClick}
                      >
                        <Icon className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>{action.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                className="h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 relative"
                onClick={() => {
                  if (isExpanded) {
                    setIsExpanded(false);
                    onUploadClick();
                  } else {
                    onUploadClick();
                  }
                }}
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 45 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Plus className="h-7 w-7" />
                </motion.div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Добавить операции</p>
            </TooltipContent>
          </Tooltip>

          {pendingCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2"
            >
              <Badge 
                variant="destructive" 
                className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
              >
                {pendingCount}
              </Badge>
            </motion.div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}