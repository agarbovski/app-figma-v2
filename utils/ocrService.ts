import { createWorker } from 'tesseract.js';
import { Transaction } from '../types';
import { TransactionParser } from './transactionParser';

interface OCRProgress {
  status: string;
  progress: number;
}

class OCRService {
  private worker: any = null;
  private isInitialized = false;

  async initializeWorker() {
    if (this.isInitialized) return;

    this.worker = await createWorker('pol+eng+rus', 1, {
      logger: m => {
        // Можно использовать для отслеживания прогресса
        console.log('OCR:', m);
      }
    });

    await this.worker.setParameters({
      tessedit_page_seg_mode: '4', // Single column of text of variable sizes
      preserve_interword_spaces: '1',
      // Добавляем специальные символы для банковских приложений
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюяąćęłńóśźżĄĆĘŁŃÓŚŹŻ.,:-+/()[]{}|$€£¥₽zł ',
    });

    this.isInitialized = true;
  }

  async processImage(imageFile: File, onProgress?: (progress: OCRProgress) => void): Promise<string> {
    try {
      await this.initializeWorker();
      
      if (onProgress) {
        onProgress({ status: 'Анализ изображения...', progress: 10 });
      }

      const { data: { text } } = await this.worker.recognize(imageFile);
      
      if (onProgress) {
        onProgress({ status: 'Текст распознан', progress: 100 });
      }

      return text;
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('Ошибка распознавания текста');
    }
  }

  parseTransactionsFromText(text: string): Transaction[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    console.log('OCR Text for parsing:', text);

    // Используем новый улучшенный парсер списка транзакций
    const transactions = TransactionParser.parseTransactionsList(text);
    
    if (transactions.length > 0) {
      console.log(`Successfully parsed ${transactions.length} transactions:`, transactions);
      return transactions;
    }

    // Fallback: разбиваем текст на блоки и пытаемся парсить каждый отдельно
    const blocks = text.split(/\n\s*\n/).filter(block => block.trim().length > 0);
    
    if (blocks.length === 0) {
      blocks.push(text);
    }

    const fallbackTransactions: Transaction[] = [];
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i].trim();
      const parsedTransaction = TransactionParser.smartParseTransaction(block, i);
      
      if (parsedTransaction) {
        fallbackTransactions.push(parsedTransaction);
      }
    }

    if (fallbackTransactions.length > 0) {
      console.log(`Fallback parsed ${fallbackTransactions.length} transactions:`, fallbackTransactions);
      return fallbackTransactions;
    }

    // Последний fallback - построчный анализ
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const lineTransactions: Transaction[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const amount = TransactionParser.parseAmount(line);
      
      if (amount && Math.abs(amount) > 0) {
        const contextLines = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 2));
        const contextText = contextLines.join(' ');
        
        lineTransactions.push({
          id: `ocr-line-${i + 1}`,
          date: TransactionParser.parseDate(contextText),
          amount,
          description: line.substring(0, 100),
          category: TransactionParser.parseCategory('', line),
          merchant: TransactionParser.parseMerchant(line)
        });
      }
    }

    if (lineTransactions.length > 0) {
      console.log(`Line-by-line parsed ${lineTransactions.length} transactions:`, lineTransactions);
      return lineTransactions;
    }

    // Финальный fallback - ручное редактирование
    console.log('No transactions found, creating manual edit transaction');
    return [{
      id: 'ocr-manual-edit',
      date: new Date().toISOString().split('T')[0],
      amount: -100,
      description: text.substring(0, 100) + ' [требует редактирования]',
      category: 'Другое',
      merchant: 'Распознано из изображения'
    }];
  }



  async terminate() {
    if (this.worker && this.isInitialized) {
      await this.worker.terminate();
      this.isInitialized = false;
      this.worker = null;
    }
  }
}

export const ocrService = new OCRService();