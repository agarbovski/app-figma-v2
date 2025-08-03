import React, { useCallback, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Upload, Image, X, Eye, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { ocrService } from '../utils/ocrService';
import { Transaction } from '../types';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  processing: boolean;
  ocrText?: string;
  error?: string;
}

interface FileUploadProps {
  onFilesProcessed: (transactions: Transaction[]) => void;
}

export function FileUpload({ onFilesProcessed }: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessingFile, setCurrentProcessingFile] = useState<string>('');
  const [processingStatus, setProcessingStatus] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles
      .filter(file => {
        // Проверяем размер файла (макс 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`Файл ${file.name} слишком большой. Максимальный размер: 10MB`);
          return false;
        }
        return true;
      })
      .map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        processing: false
      }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeFile = (id: string) => {
    const file = files.find(f => f.id === id);
    if (file) {
      URL.revokeObjectURL(file.preview);
    }
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    const allTransactions: Transaction[] = [];
    let hasErrors = false;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentProcessingFile(file.file.name);
        setProcessingStatus('Инициализация OCR...');
        
        // Обновляем состояние файла
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, processing: true, error: undefined } : f
        ));

        try {
          // OCR обработка
          const ocrText = await ocrService.processImage(
            file.file,
            (progress) => {
              setProcessingStatus(progress.status);
              const fileProgress = (i / files.length) * 100 + (progress.progress / files.length);
              setProcessingProgress(Math.min(fileProgress, 95));
            }
          );

          // Парсинг транзакций из текста
          setProcessingStatus('Извлечение данных о транзакциях...');
          const transactions = ocrService.parseTransactionsFromText(ocrText);
          
          allTransactions.push(...transactions);

          // Обновляем файл с результатами
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, processing: false, ocrText, error: undefined }
              : f
          ));

        } catch (error) {
          console.error(`Ошибка обработки файла ${file.file.name}:`, error);
          hasErrors = true;
          
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, processing: false, error: 'Ошибка распознавания' }
              : f
          ));
        }

        // Обновляем общий прогресс
        const overallProgress = ((i + 1) / files.length) * 95;
        setProcessingProgress(overallProgress);
      }

      setProcessingStatus('Завершение обработки...');
      setProcessingProgress(100);

      // Небольшая задержка для показа 100%
      await new Promise(resolve => setTimeout(resolve, 500));

      if (allTransactions.length > 0) {
        onFilesProcessed(allTransactions);
        setFiles([]);
      } else if (!hasErrors) {
        // Если нет ошибок, но и транзакций не найдено
        alert('Не удалось извлечь данные о транзакциях из загруженных изображений. Проверьте качество изображений.');
      }

    } catch (error) {
      console.error('Общая ошибка обработки:', error);
      alert('Произошла ошибка при обработке файлов. Попробуйте еще раз.');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setCurrentProcessingFile('');
      setProcessingStatus('');
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    onDrop(selectedFiles);
  };

  const retryFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, processing: true, error: undefined } : f
    ));

    try {
      const ocrText = await ocrService.processImage(file.file);
      const transactions = ocrService.parseTransactionsFromText(ocrText);
      
      if (transactions.length > 0) {
        onFilesProcessed(transactions);
      }

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, processing: false, ocrText, error: undefined } : f
      ));

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, processing: false, error: 'Ошибка повторной обработки' } : f
      ));
    }
  };

  return (
    <div className="space-y-3">
      <Card className="p-3 border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <Upload className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg mb-1">Загрузить скриншоты банковских операций</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Поддерживаются файлы JPEG и PNG до 10MB. Текст будет распознан автоматически.
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  Выбрать файлы
                </label>
              </Button>
              {files.length > 0 && !isProcessing && (
                <Button 
                  onClick={processFiles} 
                  disabled={isProcessing}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Распознать текст ({files.length})
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {isProcessing && (
        <Card className="p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
              <span className="text-sm font-medium">Обработка изображений...</span>
            </div>
            <Progress value={processingProgress} className="w-full" />
            <div className="space-y-1">
              {currentProcessingFile && (
                <p className="text-xs text-muted-foreground">
                  Файл: {currentProcessingFile}
                </p>
              )}
              {processingStatus && (
                <p className="text-xs text-muted-foreground">
                  {processingStatus}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {files.length > 0 && !isProcessing && (
        <>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Совет:</strong> Для лучшего распознавания убедитесь, что текст на изображениях четкий и хорошо освещен.
              Поддерживаются польский, английский и русский языки.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {files.map((file) => (
              <Card key={file.id} className="relative overflow-hidden">
                <div className="aspect-[4/3]">
                  <img
                    src={file.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {file.processing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
                  </div>
                )}

                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={() => removeFile(file.id)}
                  disabled={file.processing}
                >
                  <X className="h-3 w-3" />
                </Button>

                <div className="p-2 bg-background/95">
                  <p className="text-xs truncate mb-1">{file.file.name}</p>
                  
                  {file.error && (
                    <div className="flex items-center gap-1 mb-1">
                      <AlertCircle className="h-3 w-3 text-destructive" />
                      <span className="text-xs text-destructive">{file.error}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-5 px-2 text-xs ml-auto"
                        onClick={() => retryFile(file.id)}
                      >
                        Повторить
                      </Button>
                    </div>
                  )}
                  
                  {file.ocrText && (
                    <div className="text-xs text-muted-foreground">
                      <p className="truncate">
                        Распознан текст: {file.ocrText.substring(0, 50)}...
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}