import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';

import { Separator } from './ui/separator';
import { Settings, TrendingUp, TrendingDown, AlertTriangle, Target, Edit, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

import { BudgetData } from '../types';

interface BudgetOverviewProps {
  budgetData: BudgetData;
  onUpdateBudget: (updates: Partial<BudgetData>) => void;
}

export function BudgetOverview({ budgetData, onUpdateBudget }: BudgetOverviewProps) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(budgetData.monthlyGoal);
  const [tempStartDay, setTempStartDay] = useState(budgetData.budgetStartDay);
  const [originalStartDay, setOriginalStartDay] = useState(budgetData.budgetStartDay);
  const [showCategoryExpenses, setShowCategoryExpenses] = useState(false);

  const { monthlyGoal, totalSpent, budgetStartDay, categorySpending } = budgetData;
  const remaining = monthlyGoal - totalSpent;
  const percentSpent = (totalSpent / monthlyGoal) * 100;
  const isOverBudget = totalSpent > monthlyGoal;

  const saveGoal = () => {
    onUpdateBudget({ 
      monthlyGoal: tempGoal,
      budgetStartDay: tempStartDay
    });
    setIsEditingGoal(false);
  };

  // Функция для получения максимального количества дней в текущем месяце
  const getMaxDaysInCurrentMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    // Получаем последний день месяца (0 день следующего месяца)
    return new Date(year, month + 1, 0).getDate();
  };

  // Обработчик изменения дня начала периода с валидацией
  const handleStartDayChange = (value: string) => {
    const numValue = parseInt(value);
    const maxDaysInMonth = getMaxDaysInCurrentMonth();
    
    // Если пустое значение или не число, устанавливаем 1
    if (value === '' || isNaN(numValue)) {
      setTempStartDay(1);
      return;
    }
    
    // Если значение больше 31, сбрасываем к максимальному дню текущего месяца
    if (numValue > 31) {
      setTempStartDay(maxDaysInMonth);
      return;
    }
    
    // Если значение меньше 1, устанавливаем 1
    if (numValue < 1) {
      setTempStartDay(1);
      return;
    }
    
    // Иначе устанавливаем корректное значение
    setTempStartDay(numValue);
  };

  // Вычисляем текущий бюджетный период
  const getCurrentBudgetPeriod = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    
    let periodStart: Date;
    let periodEnd: Date;
    
    if (currentDay >= budgetStartDay) {
      // Текущий период: с budgetStartDay текущего месяца до (budgetStartDay-1) следующего месяца
      periodStart = new Date(currentYear, currentMonth, budgetStartDay);
      periodEnd = new Date(currentYear, currentMonth + 1, budgetStartDay - 1);
    } else {
      // Текущий период: с budgetStartDay прошлого месяца до (budgetStartDay-1) текущего месяца
      periodStart = new Date(currentYear, currentMonth - 1, budgetStartDay);
      periodEnd = new Date(currentYear, currentMonth, budgetStartDay - 1);
    }
    
    return { periodStart, periodEnd };
  };

  const { periodStart, periodEnd } = getCurrentBudgetPeriod();
  
  const formatPeriodDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short'
    }).format(date);
  };

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold">Бюджет на период</h2>
          <p className="text-sm text-muted-foreground">
            {formatPeriodDate(periodStart)} — {formatPeriodDate(periodEnd)}
          </p>
        </div>
        <Dialog open={isEditingGoal} onOpenChange={(open) => {
          setIsEditingGoal(open);
          if (open) {
            setTempGoal(budgetData.monthlyGoal);
            setTempStartDay(budgetData.budgetStartDay);
            setOriginalStartDay(budgetData.budgetStartDay);
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
              Настройки
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Настройки бюджета</DialogTitle>
              <DialogDescription>
                Настройте месячный лимит бюджета и выберите день начала бюджетного периода для точного отслеживания ваших расходов.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label htmlFor="goal">Сумма бюджета (zł)</Label>
                <Input
                  id="goal"
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(Number(e.target.value))}
                  placeholder="Введите сумму"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startDay" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Начало бюджетного периода
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="startDay"
                    type="number"
                    min="1"
                    max="31"
                    value={tempStartDay}
                    onChange={(e) => handleStartDayChange(e.target.value)}
                    className="w-20 text-center"
                    placeholder="1"
                  />
                  <span className="text-sm text-muted-foreground">число каждого месяца</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Укажите день месяца (1-31), с которого начинается ваш бюджетный период. 
                  Обычно это день получения зарплаты.
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditingGoal(false)}>
                  Отмена
                </Button>
                <Button onClick={saveGoal}>
                  Сохранить
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold">
              {Math.round(percentSpent)}%
            </span>
            <span className={`text-sm ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
              {isOverBudget ? 'Превышение' : 'Осталось'}: {Math.abs(remaining).toLocaleString()} zł
            </span>
          </div>
          
          <Progress 
            value={Math.min(percentSpent, 100)} 
            className={`h-3 ${isOverBudget ? '[&>div]:bg-destructive' : ''}`} 
          />
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{totalSpent.toLocaleString()} zł / {monthlyGoal.toLocaleString()} zł</span>
            <span>потрачено</span>
          </div>
        </div>

        {isOverBudget && (
          <Alert className="border-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Вы превысили месячный бюджет на {Math.abs(remaining).toLocaleString()} zł
            </AlertDescription>
          </Alert>
        )}

        {!isOverBudget && percentSpent > 80 && (
          <Alert className="border-yellow-500">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Вы близки к достижению месячного лимита. Осталось {remaining.toLocaleString()} zł
            </AlertDescription>
          </Alert>
        )}

        <Separator className="my-4" />

        <button
          onClick={() => setShowCategoryExpenses(!showCategoryExpenses)}
          className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm">Расходы по категориям</span>
          {showCategoryExpenses ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showCategoryExpenses && (
          <div className="space-y-3 pt-2">
            {Object.entries(categorySpending).map(([category, data]) => {
              const percentage = (data.spent / data.limit) * 100;
              const isOverLimit = data.spent > data.limit;
              
              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{category}</span>
                    <span className="text-sm text-muted-foreground">
                      {data.spent.toLocaleString()} zł / {data.limit.toLocaleString()} zł
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className={`h-2 ${isOverLimit ? '[&>div]:bg-destructive' : ''}`} 
                  />
                  {isOverLimit && (
                    <p className="text-xs text-destructive">
                      Превышение на {(data.spent - data.limit).toLocaleString()} zł
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}