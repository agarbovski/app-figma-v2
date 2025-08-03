// Тестовый файл для проверки OCR парсера
// Этот файл можно использовать для тестирования в консоли браузера

import { TransactionParser } from './transactionParser';

// Пример текста, который может быть получен из скриншота
const mockOCRText = `
Операции

пятница, 1 августа

Duży Ben                    29,99 PLN

ROSSMANN                     8,99 PLN

четверг, 31 июля

Duży Ben                    19,99 PLN

среда, 30 июля

Żabka                       25,29 PLN

Żabka                        3,40 PLN

воскресенье, 27 июля

Żabka                       18,08 PLN
`;

// Функция для тестирования
export function testTransactionParser() {
  console.log('Testing OCR Parser with mock data:');
  console.log('Input text:', mockOCRText);
  
  const transactions = TransactionParser.parseTransactionsList(mockOCRText);
  
  console.log('Parsed transactions:', transactions);
  console.log(`Found ${transactions.length} transactions`);
  
  transactions.forEach((t, index) => {
    console.log(`Transaction ${index + 1}:`, {
      merchant: t.merchant,
      amount: t.amount,
      date: t.date,
      category: t.category
    });
  });
  
  return transactions;
}

// Экспорт для использования в консоли
if (typeof window !== 'undefined') {
  (window as any).testOCR = testTransactionParser;
}