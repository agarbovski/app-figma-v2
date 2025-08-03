import { Transaction, BudgetData } from '../types';

export const calculateNewSpending = (transactions: Transaction[]) => {
  return transactions.reduce((acc, t) => {
    const category = t.category;
    const amount = Math.abs(t.amount);
    acc[category] = (acc[category] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);
};

export const updateBudgetWithTransactions = (
  budgetData: BudgetData,
  transactions: Transaction[]
): BudgetData => {
  const newSpending = calculateNewSpending(transactions);
  const totalNewSpent = Object.values(newSpending).reduce((sum, val) => sum + val, 0);

  return {
    ...budgetData,
    totalSpent: budgetData.totalSpent + totalNewSpent,
    categorySpending: {
      ...budgetData.categorySpending,
      ...Object.entries(newSpending).reduce((acc, [category, amount]) => {
        acc[category] = {
          ...budgetData.categorySpending[category],
          spent: (budgetData.categorySpending[category]?.spent || 0) + amount
        };
        return acc;
      }, {} as typeof budgetData.categorySpending)
    }
  };
};

export const updateTransactionInList = (
  transactions: Transaction[],
  id: string,
  updates: Partial<Transaction>
): Transaction[] => {
  return transactions.map(t => t.id === id ? { ...t, ...updates } : t);
};