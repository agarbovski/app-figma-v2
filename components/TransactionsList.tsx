import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ShoppingCart, Car, Gamepad2, Home, Heart, MoreHorizontal, Check, X } from 'lucide-react';

import { Transaction } from '../types';

interface TransactionsListProps {
  transactions: Transaction[];
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  onConfirmTransactions: (transactions: Transaction[]) => void;
  onReject: () => void;
}

const categories = [
  { value: 'Еда', label: 'Еда', icon: ShoppingCart, color: 'bg-orange-100 text-orange-800' },
  { value: 'Транспорт', label: 'Транспорт', icon: Car, color: 'bg-blue-100 text-blue-800' },
  { value: 'Развлечения', label: 'Развлечения', icon: Gamepad2, color: 'bg-purple-100 text-purple-800' },
  { value: 'Дом', label: 'Дом', icon: Home, color: 'bg-green-100 text-green-800' },
  { value: 'Здоровье', label: 'Здоровье', icon: Heart, color: 'bg-red-100 text-red-800' },
  { value: 'Другое', label: 'Другое', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-800' }
];

export function TransactionsList({ transactions, onUpdateTransaction, onConfirmTransactions, onReject }: TransactionsListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const getCategoryInfo = (category: string) => {
    return categories.find(cat => cat.value === category) || categories[categories.length - 1];
  };

  const formatAmount = (amount: number) => {
    const isNegative = amount < 0;
    const abs = Math.abs(amount);
    return (
      <span className={isNegative ? 'text-red-600' : 'text-green-600'}>
        {isNegative ? '-' : '+'}{abs.toLocaleString()} zł
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short'
    }).format(date);
  };

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl mb-1">Распознанные операции</h2>
          <p className="text-sm text-muted-foreground">
            Проверьте корректность данных и при необходимости исправьте категории
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {transactions.length} транзакций
        </Badge>
      </div>

      <div className="space-y-2 mb-3">
        {transactions.map((transaction) => {
          const categoryInfo = getCategoryInfo(transaction.category);
          const Icon = categoryInfo.icon;

          return (
            <Card key={transaction.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${categoryInfo.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="truncate pr-2">{transaction.description}</p>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(transaction.date)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{transaction.merchant}</p>
                      <div className="font-semibold">
                        {formatAmount(transaction.amount)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="ml-4">
                  <Select
                    value={transaction.category}
                    onValueChange={(value) => onUpdateTransaction(transaction.id, { category: value })}
                  >
                    <SelectTrigger className="w-[130px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => {
                        const CategoryIcon = cat.icon;
                        return (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="h-3 w-3" />
                              <span className="text-sm">{cat.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Separator className="mb-2" />

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onReject} className="gap-2">
          <X className="h-4 w-4" />
          Отменить
        </Button>
        <Button onClick={() => onConfirmTransactions(transactions)} className="gap-2">
          <Check className="h-4 w-4" />
          Подтвердить все ({transactions.length})
        </Button>
      </div>
    </Card>
  );
}