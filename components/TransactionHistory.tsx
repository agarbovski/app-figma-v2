import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Download, Calendar as CalendarIcon, Search, X, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import { Transaction } from '../types';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const categories = ['Все', 'Еда', 'Транспорт', 'Развлечения', 'Дом', 'Здоровье', 'Другое'];

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.merchant.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Все' || transaction.category === selectedCategory;
      
      let matchesDate = true;
      if (dateRange.from && dateRange.to) {
        const transactionDate = new Date(transaction.date);
        matchesDate = transactionDate >= dateRange.from && transactionDate <= dateRange.to;
      }
      
      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [transactions, searchTerm, selectedCategory, dateRange]);

  // Группировка транзакций по дате
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    
    filteredTransactions.forEach(transaction => {
      const date = format(new Date(transaction.date), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });

    // Сортируем группы по дате (новые сверху)
    const sortedGroups = Object.entries(groups).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    return sortedGroups;
  }, [filteredTransactions]);

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const hasActiveFilters = searchTerm !== '' || selectedCategory !== 'Все' || (dateRange.from && dateRange.to);

  const exportToCsv = () => {
    const csvContent = [
      ['Дата', 'Сумма', 'Описание', 'Категория', 'Продавец'],
      ...filteredTransactions.map(t => [
        t.date,
        t.amount.toString(),
        t.description,
        t.category,
        t.merchant
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'transactions.csv';
    link.click();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('Все');
    setDateRange({});
    setIsSearchExpanded(false);
  };

  const handleSearchToggle = () => {
    if (isSearchExpanded && searchTerm === '') {
      setIsSearchExpanded(false);
    } else if (!isSearchExpanded) {
      setIsSearchExpanded(true);
    }
  };

  const formatDateGroup = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'сегодня';
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'вчера';
    } else {
      return format(date, 'EEEE, d MMMM', { locale: ru }).toLowerCase();
    }
  };

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-2">
          <div>
            <h2 className="text-xl mb-1 font-bold">История операций</h2>
            <p className="text-sm text-muted-foreground">
              Найдено {filteredTransactions.length} операций на общую сумму {totalAmount.toLocaleString()} zł
            </p>
          </div>
        </div>

        {/* Combined Search and Filter Row */}
        <div className="space-y-3 mb-3">
          {/* First Row: Search and Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            {isSearchExpanded ? (
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                  autoFocus
                  onBlur={() => {
                    if (searchTerm === '') {
                      setIsSearchExpanded(false);
                    }
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setIsSearchExpanded(false);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={handleSearchToggle}
                className="gap-2 px-3 h-9"
              >
                <Search className="h-4 w-4" />
                Поиск
              </Button>
            )}

            {/* Filter Buttons - Show in same row when search is collapsed */}
            {!isSearchExpanded && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2 px-3 h-9">
                      <Tag className="h-4 w-4" />
                      {selectedCategory === 'Все' ? 'Категория' : selectedCategory}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-1" align="start">
                    <div className="space-y-1">
                      {categories.map(category => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground ${
                            selectedCategory === category ? 'bg-accent text-accent-foreground' : ''
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2 px-3 h-9">
                      <CalendarIcon className="h-4 w-4" />
                      Даты
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      locale={ru}
                    />
                  </PopoverContent>
                </Popover>

                <Button variant="outline" onClick={exportToCsv} className="gap-2 px-3 h-9">
                  <Download className="h-4 w-4" />
                  CSV
                </Button>

                {hasActiveFilters && (
                  <>
                    <div className="w-px h-8 bg-border self-center" />
                    <Button 
                      variant="outline" 
                      onClick={resetFilters} 
                      className="gap-2 px-3 h-9 bg-red-500/20 border-red-300 hover:bg-red-500/30 hover:border-red-400"
                    >
                      <X className="h-4 w-4 text-red-600" />
                      Сброс
                    </Button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Second Row: Filter Buttons when search is expanded */}
          {isSearchExpanded && (
            <div className="flex flex-wrap gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2 px-3 h-9">
                    <Tag className="h-4 w-4" />
                    {selectedCategory === 'Все' ? 'Категория' : selectedCategory}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="start">
                  <div className="space-y-1">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground ${
                          selectedCategory === category ? 'bg-accent text-accent-foreground' : ''
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2 px-3 h-9">
                    <CalendarIcon className="h-4 w-4" />
                    Даты
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    locale={ru}
                  />
                </PopoverContent>
              </Popover>

              <Button variant="outline" onClick={exportToCsv} className="gap-2 px-3 h-9">
                <Download className="h-4 w-4" />
                CSV
              </Button>

              {hasActiveFilters && (
                <>
                  <div className="w-px h-8 bg-border self-center" />
                  <Button 
                    variant="outline" 
                    onClick={resetFilters} 
                    className="gap-2 px-3 h-9 bg-red-500/20 border-red-300 hover:bg-red-500/30 hover:border-red-400"
                  >
                    <X className="h-4 w-4 text-red-600" />
                    Сброс
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {groupedTransactions.length > 0 ? (
          <div className="space-y-4">
            {groupedTransactions.map(([dateKey, transactions]) => (
              <div key={dateKey}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
                  {formatDateGroup(dateKey)}
                </h3>
                <div className="space-y-1">
                  {transactions.map(transaction => (
                    <div 
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {transaction.merchant}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {transaction.description}
                            </p>
                          </div>
                          <div className="text-right ml-3">
                            <p className="text-sm font-medium">
                              {Math.abs(transaction.amount).toLocaleString()} zł
                            </p>
                          </div>
                        </div>
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {transaction.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Search className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">Операции не найдены</p>
              <p className="text-sm text-muted-foreground">
                Попробуйте изменить фильтры или добавить новые операции
              </p>
            </div>
          </div>
        )}

        {filteredTransactions.length > 50 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Показаны все {filteredTransactions.length} операций.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}