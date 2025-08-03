export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  merchant: string;
}

export interface BudgetData {
  monthlyGoal: number;
  totalSpent: number;
  budgetStartDay: number; // День месяца, с которого начинается бюджетный период (1-31)
  categorySpending: {
    [key: string]: { spent: number; limit: number };
  };
}