import { projectId, publicAnonKey } from './supabase/info';
import { Transaction, BudgetData } from '../types';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-79360757`;

class SupabaseService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`API Error (${response.status}):`, data);
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`Network error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    try {
      const data = await this.makeRequest('/transactions');
      return data.transactions || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  async addTransactions(transactions: Transaction[]): Promise<void> {
    await this.makeRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify({ transactions }),
    });
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const data = await this.makeRequest(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.transaction;
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.makeRequest(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Budget methods
  async getBudget(): Promise<BudgetData> {
    const data = await this.makeRequest('/budget');
    return data.budget;
  }

  async updateBudget(updates: Partial<BudgetData>): Promise<BudgetData> {
    const data = await this.makeRequest('/budget', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.budget;
  }

  async recalculateBudget(transactions: Transaction[]): Promise<BudgetData> {
    const data = await this.makeRequest('/budget/recalculate', {
      method: 'POST',
      body: JSON.stringify({ transactions }),
    });
    return data.budget;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const data = await this.makeRequest('/health');
      return data.status === 'ok';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export const supabaseService = new SupabaseService();