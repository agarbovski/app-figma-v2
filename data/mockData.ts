import { Transaction, BudgetData } from '../types';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'existing-1',
    date: '2025-07-28',
    amount: -850,
    description: 'Продукты в Магните',
    category: 'Еда',
    merchant: 'Магнит'
  },
  {
    id: 'existing-2',
    date: '2025-07-27',
    amount: -320,
    description: 'Метро',
    category: 'Транспорт',
    merchant: 'Московский метрополитен'
  },
  {
    id: 'existing-3',
    date: '2025-07-26',
    amount: -1500,
    description: 'Кино в ТЦ Европейский',
    category: 'Развлечения',
    merchant: 'Каро Фильм'
  },
  {
    id: 'existing-4',
    date: '2025-07-25',
    amount: -2100,
    description: 'Ужин в ресторане',
    category: 'Еда',
    merchant: 'Белое Солнце'
  },
  {
    id: 'existing-5',
    date: '2025-07-24',
    amount: -450,
    description: 'Такси',
    category: 'Транспорт',
    merchant: 'Яндекс.Такси'
  },
  {
    id: 'existing-6',
    date: '2025-07-23',
    amount: -750,
    description: 'Продукты',
    category: 'Еда',
    merchant: 'Пятёрочка'
  },
  {
    id: 'existing-7',
    date: '2025-07-22',
    amount: -1200,
    description: 'Лекарства',
    category: 'Здоровье',
    merchant: 'Аптека 36.6'
  },
  {
    id: 'existing-8',
    date: '2025-07-21',
    amount: -980,
    description: 'Бытовая химия',
    category: 'Дом',
    merchant: 'Лента'
  },
  {
    id: 'existing-9',
    date: '2025-07-20',
    amount: -650,
    description: 'Заправка',
    category: 'Транспорт',
    merchant: 'Лукойл'
  },
  {
    id: 'existing-10',
    date: '2025-07-19',
    amount: -1800,
    description: 'Спортзал',
    category: 'Здоровье',
    merchant: 'Фитнес Тайм'
  }
];

export const INITIAL_BUDGET_DATA: BudgetData = {
  monthlyGoal: 50000,
  totalSpent: 23720,
  budgetStartDay: 1, // По умолчанию с 1 числа месяца
  categorySpending: {
    'Еда': { spent: 8500, limit: 15000 },
    'Транспорт': { spent: 3200, limit: 5000 },
    'Развлечения': { spent: 6800, limit: 8000 },
    'Дом': { spent: 2400, limit: 10000 },
    'Здоровье': { spent: 2820, limit: 5000 }
  }
};