import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-79360757/health", (c) => {
  return c.json({ status: "ok" });
});

// Get all transactions
app.get("/make-server-79360757/transactions", async (c) => {
  try {
    const transactions = await kv.getByPrefix("transaction:");
    return c.json({ transactions: transactions || [] });
  } catch (error) {
    console.log("Error fetching transactions:", error);
    return c.json({ error: "Failed to fetch transactions", details: error.message }, 500);
  }
});

// Add new transactions
app.post("/make-server-79360757/transactions", async (c) => {
  try {
    const { transactions } = await c.req.json();
    
    if (!transactions || !Array.isArray(transactions)) {
      return c.json({ error: "Invalid transactions data" }, 400);
    }

    // Store each transaction with a unique key
    const transactionPromises = transactions.map(transaction => {
      const key = `transaction:${transaction.id}`;
      return kv.set(key, transaction);
    });

    await Promise.all(transactionPromises);
    
    return c.json({ 
      message: "Transactions added successfully", 
      count: transactions.length 
    });
  } catch (error) {
    console.log("Error adding transactions:", error);
    return c.json({ error: "Failed to add transactions", details: error.message }, 500);
  }
});

// Update a transaction
app.put("/make-server-79360757/transactions/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    
    const key = `transaction:${id}`;
    const existingTransaction = await kv.get(key);
    
    if (!existingTransaction) {
      return c.json({ error: "Transaction not found" }, 404);
    }
    
    const updatedTransaction = { ...existingTransaction, ...updates };
    await kv.set(key, updatedTransaction);
    
    return c.json({ transaction: updatedTransaction });
  } catch (error) {
    console.log("Error updating transaction:", error);
    return c.json({ error: "Failed to update transaction", details: error.message }, 500);
  }
});

// Delete a transaction
app.delete("/make-server-79360757/transactions/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const key = `transaction:${id}`;
    
    const existingTransaction = await kv.get(key);
    if (!existingTransaction) {
      return c.json({ error: "Transaction not found" }, 404);
    }
    
    await kv.del(key);
    
    return c.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.log("Error deleting transaction:", error);
    return c.json({ error: "Failed to delete transaction", details: error.message }, 500);
  }
});

// Get budget data
app.get("/make-server-79360757/budget", async (c) => {
  try {
    const budgetData = await kv.get("budget:data");
    
    if (!budgetData) {
      // Return default budget data if none exists
      const defaultBudget = {
        monthlyGoal: 5000,
        totalSpent: 0,
        budgetStartDay: 1,
        categorySpending: {
          "Еда": { spent: 0, limit: 1500 },
          "Транспорт": { spent: 0, limit: 800 },
          "Развлечения": { spent: 0, limit: 600 },
          "Дом": { spent: 0, limit: 1000 },
          "Здоровье": { spent: 0, limit: 500 },
          "Другое": { spent: 0, limit: 600 }
        }
      };
      
      await kv.set("budget:data", defaultBudget);
      return c.json({ budget: defaultBudget });
    }
    
    return c.json({ budget: budgetData });
  } catch (error) {
    console.log("Error fetching budget:", error);
    return c.json({ error: "Failed to fetch budget", details: error.message }, 500);
  }
});

// Update budget data
app.put("/make-server-79360757/budget", async (c) => {
  try {
    const updates = await c.req.json();
    
    const existingBudget = await kv.get("budget:data");
    const updatedBudget = { ...existingBudget, ...updates };
    
    await kv.set("budget:data", updatedBudget);
    
    return c.json({ budget: updatedBudget });
  } catch (error) {
    console.log("Error updating budget:", error);
    return c.json({ error: "Failed to update budget", details: error.message }, 500);
  }
});

// Bulk update budget with new transactions (recalculate spending)
app.post("/make-server-79360757/budget/recalculate", async (c) => {
  try {
    const { transactions } = await c.req.json();
    
    if (!transactions || !Array.isArray(transactions)) {
      return c.json({ error: "Invalid transactions data" }, 400);
    }

    const existingBudget = await kv.get("budget:data");
    if (!existingBudget) {
      return c.json({ error: "Budget not found" }, 404);
    }

    // Calculate new totals
    const categoryTotals = { ...existingBudget.categorySpending };
    let totalSpent = existingBudget.totalSpent;

    transactions.forEach(transaction => {
      const amount = Math.abs(transaction.amount);
      const category = transaction.category;
      
      totalSpent += amount;
      
      if (categoryTotals[category]) {
        categoryTotals[category].spent += amount;
      }
    });

    const updatedBudget = {
      ...existingBudget,
      totalSpent,
      categorySpending: categoryTotals
    };

    await kv.set("budget:data", updatedBudget);
    
    return c.json({ budget: updatedBudget });
  } catch (error) {
    console.log("Error recalculating budget:", error);
    return c.json({ error: "Failed to recalculate budget", details: error.message }, 500);
  }
});

Deno.serve(app.fetch);