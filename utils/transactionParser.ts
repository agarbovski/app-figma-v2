import { Transaction } from '../types';

export interface ParsedData {
  amount?: number;
  date?: string;
  merchant?: string;
  description?: string;
  category?: string;
}

export class TransactionParser {
  private static readonly CURRENCY_PATTERNS = [
    // Польские злотые - точный формат как в скриншоте: 29,99 PLN
    /(\d{1,3}(?:,\d{2})?)\s*PLN/gi,
    // Альтернативные форматы
    /[-−]?\s*(\d{1,3}(?:\s\d{3})*[,.]?\d{0,2})\s*(?:zł|PLN)/gi,
    /[-−]?\s*(\d{1,3}(?:[,.\s]\d{3})*[,.]\d{2})\s*(?:zł|PLN)/gi,
    // Другие валюты
    /[-−]?\s*(\d{1,3}(?:\s\d{3})*[,.]?\d{0,2})\s*(?:₽|руб|RUB|EUR|€|USD|\$)/gi,
    // Числа с минусом (расходы)
    /[-−]\s*(\d{1,3}(?:[,.\s]\d{3})*[,.]?\d{0,2})/g
  ];

  private static readonly DATE_PATTERNS = [
    // Русские дни недели + дата: "пятница, 1 августа"
    /(понедельник|вторник|среда|четверг|пятница|суббота|воскресенье),?\s*(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/gi,
    // Английские дни недели
    /(monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s*(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)/gi,
    // Польские дни недели
    /(poniedziałek|wtorek|środa|czwartek|piątek|sobota|niedziela),?\s*(\d{1,2})\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)/gi,
    // DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
    /(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{2,4})/g,
    // YYYY-MM-DD
    /(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/g
  ];

  private static readonly MERCHANT_PATTERNS = [
    // Из скриншота: Duży Ben, ROSSMANN, Żabka
    /(?:Duży Ben|ROSSMANN|Żabka)/gi,
    // Польские сети
    /(?:Biedronka|Carrefour|Tesco|Lidl|Auchan|Kaufland|Netto|Dino|Polomarket)/gi,
    // Рестораны и кафе
    /(?:McDonald'?s|KFC|Burger King|Pizza Hut|Subway|Starbucks|Costa Coffee|Green Caffè Nero)/gi,
    // Транспорт
    /(?:ZTM|MPK|Jakdojade|Uber|Bolt|mytaxi|Taxi)/gi,
    // Аптеки
    /(?:Apteka|DOZ|Gemini|Melissa|Ziko)/gi,
    // Банки
    /(?:PKO|Pekao|mBank|ING|Santander|Millennium|Alior|Getin|BNP Paribas)/gi,
    // Заправки
    /(?:BP|Shell|Orlen|Lotos|Circle K|Esso)/gi,
    // Магазины одежды
    /(?:H&M|Zara|Reserved|Cropp|House|Mohito)/gi
  ];

  private static readonly MONTH_MAP = {
    'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04',
    'мая': '05', 'июня': '06', 'июля': '07', 'августа': '08',
    'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12',
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12',
    'stycznia': '01', 'lutego': '02', 'marca': '03', 'kwietnia': '04',
    'maja': '05', 'czerwca': '06', 'lipca': '07', 'sierpnia': '08',
    'września': '09', 'października': '10', 'listopada': '11', 'grudnia': '12'
  };

  private static readonly CATEGORY_RULES = [
    // Еда и продукты
    {
      category: 'Еда',
      patterns: [
        /(?:Biedronka|Żabka|Carrefour|Tesco|Lidl|Auchan|Kaufland|Netto|Dino|Polomarket)/gi,
        /(?:McDonald|KFC|Burger|Pizza|Restaurant|Restauracja|Kawiarnia|Cafe|Coffee)/gi,
        /(?:sklep|market|grocery|food|jedzenie|żywność)/gi
      ]
    },
    // Здоровье
    {
      category: 'Здоровье',
      patterns: [
        /(?:ROSSMANN|Apteka|DOZ|Gemini|Melissa|Ziko|Pharmacy)/gi,
        /(?:lekarz|dentysta|doctor|clinic|przychodnia|szpital|hospital)/gi,
        /(?:zdrowie|health|medical|medyczny)/gi
      ]
    },
    // Транспорт
    {
      category: 'Транспорт',
      patterns: [
        /(?:ZTM|MPK|Jakdojade|Uber|Bolt|Taxi|Bus|Autobus|Tramwaj|Metro)/gi,
        /(?:BP|Shell|Orlen|Lotos|Circle K|Esso|Benzyna|Diesel|Paliwo)/gi,
        /(?:transport|przewóz|przejazd|bilet)/gi
      ]
    },
    // Развлечения
    {
      category: 'Развлечения',
      patterns: [
        /(?:Duży Ben|Cinema|Kino|Theater|Teatr|Club|Klub|Bar|Pub)/gi,
        /(?:Sport|Gym|Fitness|Siłownia|Basen|Pool)/gi,
        /(?:rozrywka|entertainment|zabawa|impreza)/gi
      ]
    },
    // Дом
    {
      category: 'Дом',
      patterns: [
        /(?:IKEA|Castorama|Leroy Merlin|OBI|Bricomarché)/gi,
        /(?:dom|house|mieszkanie|apartment|czynsz|rent)/gi,
        /(?:prąd|electricity|gaz|gas|woda|water|internet|telefon|phone)/gi
      ]
    }
  ];

  static parseAmount(text: string): number | null {
    for (const pattern of this.CURRENCY_PATTERNS) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        const amountStr = matches[0][1] || matches[0][0];
        // Обрабатываем польский формат: 29,99 -> 29.99
        const cleanAmount = amountStr
          .replace(/\s/g, '')
          .replace(',', '.');
        
        const amount = parseFloat(cleanAmount);
        if (!isNaN(amount) && amount > 0) {
          // Все транзакции в банковском приложении - это расходы
          return -Math.abs(amount);
        }
      }
    }
    return null;
  }

  static parseDate(text: string, currentYear: number = new Date().getFullYear()): string {
    const today = new Date();
    
    // Проверяем относительные даты
    if (/(?:dzisiaj|today|сегодня)/gi.test(text)) {
      return today.toISOString().split('T')[0];
    }
    
    if (/(?:wczoraj|yesterday|вчера)/gi.test(text)) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }

    // Ищем даты в формате "день недели, день месяц"
    for (const pattern of this.DATE_PATTERNS) {
      pattern.lastIndex = 0; // Сброс для глобальных regex
      const match = pattern.exec(text.toLowerCase());
      if (match) {
        try {
          if (match[2] && match[3]) {
            // Формат: "пятница, 1 августа"
            const day = match[2].padStart(2, '0');
            const monthName = match[3].toLowerCase();
            const month = this.MONTH_MAP[monthName];
            
            if (month) {
              // Используем текущий год, но если дата в будущем, используем прошлый год
              let year = currentYear;
              const testDate = new Date(`${year}-${month}-${day}`);
              if (testDate > today) {
                year = currentYear - 1;
              }
              
              return `${year}-${month}-${day}`;
            }
          } else if (match[0].includes('-') && match[1].length === 4) {
            // YYYY-MM-DD format
            return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
          } else {
            // DD.MM.YYYY format
            const day = match[1].padStart(2, '0');
            const month = match[2].padStart(2, '0');
            let year = match[3];
            
            if (year.length === 2) {
              year = '20' + year;
            }
            
            return `${year}-${month}-${day}`;
          }
        } catch (e) {
          console.error('Date parsing error:', e);
        }
      }
    }

    // Возвращаем сегодняшнюю дату по умолчанию
    return today.toISOString().split('T')[0];
  }

  static parseMerchant(text: string): string {
    // Сначала ищем известные бренды
    for (const pattern of this.MERCHANT_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    // Специальная обработка для формата банковского приложения
    // Формат: "Merchant Name                    Amount PLN"
    const bankFormatMatch = text.match(/^([A-ZÀ-ȕ][a-zA-ZÀ-ȕąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s]+?)\s+\d+[,.]?\d*\s*PLN/i);
    if (bankFormatMatch) {
      return bankFormatMatch[1].trim();
    }

    // Альтернативный формат: ищем слово в начале строки до большого количества пробелов
    const spaceFormatMatch = text.match(/^([A-ZÀ-ȕ][a-zA-ZÀ-ȕąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s]+?)\s{5,}/i);
    if (spaceFormatMatch) {
      return spaceFormatMatch[1].trim();
    }

    // Если не нашли, извлекаем первые слова до суммы
    const cleanText = text
      .replace(/\d+[,.]?\d*\s*(?:PLN|zł|₽|руб|EUR|€|USD|\$)/gi, '')
      .replace(/\d+[.\-\/]\d+[.\-\/]\d+/g, '')
      .trim();
    
    const words = cleanText.split(/\s+/).filter(word => word.length > 1);
    if (words.length > 0) {
      // Берем слова, которые не являются днями недели или общими словами
      const filteredWords = words.filter(word => 
        !/(пятница|четверг|среда|воскресенье|понедельник|вторник|суббота|операции|операция|transaction|включая|скрытые)/gi.test(word)
      );
      if (filteredWords.length > 0) {
        // Возвращаем первые 1-2 слова как название merchant
        return filteredWords.slice(0, 2).join(' ');
      }
      return words[0];
    }

    return 'Неизвестно';
  }

  static parseCategory(merchant: string, description: string): string {
    const text = (merchant + ' ' + description).toLowerCase();
    
    for (const rule of this.CATEGORY_RULES) {
      for (const pattern of rule.patterns) {
        if (text.match(pattern)) {
          return rule.category;
        }
      }
    }
    
    return 'Другое';
  }

  static parseTransactionsList(text: string): Transaction[] {
    const transactions: Transaction[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentDate = '';
    let transactionId = 1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Проверяем, является ли строка заголовком даты
      let dateMatch = false;
      for (const pattern of this.DATE_PATTERNS) {
        pattern.lastIndex = 0; // Сброс для глобальных regex
        const match = pattern.exec(line.toLowerCase());
        if (match) {
          currentDate = this.parseDate(line);
          dateMatch = true;
          break;
        }
      }
      
      if (dateMatch) {
        continue; // Переходим к следующей строке
      }
      
      // Проверяем, содержит ли строка транзакцию (есть merchant и сумма)
      const amount = this.parseAmount(line);
      if (amount !== null) {
        const merchant = this.parseMerchant(line);
        
        // Проверяем, что merchant не пустой и не общие слова
        if (merchant && merchant !== 'Неизвестно' && merchant.length > 1) {
          const category = this.parseCategory(merchant, line);
          const date = currentDate || this.parseDate(line);
          
          transactions.push({
            id: `parsed-${Date.now()}-${transactionId++}`,
            date,
            amount,
            description: `${merchant}`,
            category,
            merchant
          });
        }
      }
    }
    
    return transactions;
  }

  static smartParseTransaction(text: string, index: number = 0): Transaction | null {
    // Сначала пытаемся парсить как список транзакций
    const transactions = this.parseTransactionsList(text);
    if (transactions.length > 0) {
      return transactions[0]; // Возвращаем первую найденную
    }

    // Fallback к старому методу для одиночных транзакций
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    let bestLine = '';
    let contextLines: string[] = [];

    // Находим линию с суммой
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (this.parseAmount(line) !== null) {
        bestLine = line;
        contextLines = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3));
        break;
      }
    }

    if (!bestLine && lines.length > 0) {
      bestLine = lines[0];
      contextLines = lines.slice(0, Math.min(3, lines.length));
    }

    const contextText = contextLines.join(' ');
    const amount = this.parseAmount(bestLine) || this.parseAmount(contextText);
    
    if (!amount) return null;

    const date = this.parseDate(contextText);
    const merchant = this.parseMerchant(contextText);
    const category = this.parseCategory(merchant, bestLine);

    return {
      id: `parsed-${Date.now()}-${index}`,
      date,
      amount,
      description: bestLine.substring(0, 100),
      category,
      merchant
    };
  }
}