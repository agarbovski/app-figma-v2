import React, { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/dialog';
import { Toaster } from './components/ui/sonner';
import { FileUpload } from './components/FileUpload';
import { TransactionsList } from './components/TransactionsList';
import { BudgetOverview } from './components/BudgetOverview';
import { TransactionHistory } from './components/TransactionHistory';
import { FloatingActionButton } from './components/FloatingActionButton';
import { Upload, Wallet, Bell, Settings, AlertCircle, Loader2, Download, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Transaction, BudgetData } from './types';
import { INITIAL_TRANSACTIONS, INITIAL_BUDGET_DATA } from './data/mockData';
import { updateBudgetWithTransactions, updateTransactionInList } from './utils/transactionHelpers';
import { supabaseService } from './utils/supabaseService';

export default function App() {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [confirmedTransactions, setConfirmedTransactions] = useState<Transaction[]>([]);
  const [budgetData, setBudgetData] = useState<BudgetData>(INITIAL_BUDGET_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // PWA Install prompt handling
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show install prompt if not already installed and not on iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
      
      if (!isInstalled && !isIOS) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Load data from Supabase on app start
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Check if server is available
        const healthCheck = await supabaseService.healthCheck();
        setIsOnline(healthCheck);

        if (healthCheck) {
          // Load transactions and budget from Supabase
          const [transactions, budget] = await Promise.all([
            supabaseService.getTransactions(),
            supabaseService.getBudget()
          ]);

          setConfirmedTransactions(transactions);
          setBudgetData(budget);
          
          toast.success('Данные загружены из облака');
        } else {
          // Fallback to local data if server is unavailable
          setConfirmedTransactions(INITIAL_TRANSACTIONS);
          setBudgetData(INITIAL_BUDGET_DATA);
          
          toast.error('Сервер недоступен, используются локальные данные');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setIsOnline(false);
        
        // Fallback to local data
        setConfirmedTransactions(INITIAL_TRANSACTIONS);
        setBudgetData(INITIAL_BUDGET_DATA);
        
        toast.error('Ошибка загрузки данных, используются локальные данные');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFilesProcessed = (transactions: Transaction[]) => {
    setPendingTransactions(transactions);
    setShowFileUpload(false);
    setShowProcessing(true);
    toast.success(`Распознано ${transactions.length} операций`);
  };

  const handleUpdateTransaction = (id: string, updates: Partial<Transaction>) => {
    setPendingTransactions(prev => updateTransactionInList(prev, id, updates));
  };

  const handleConfirmTransactions = async (transactions: Transaction[]) => {
    try {
      if (isOnline) {
        // Save to Supabase
        await supabaseService.addTransactions(transactions);
        const updatedBudget = await supabaseService.recalculateBudget(transactions);
        
        setBudgetData(updatedBudget);
        setConfirmedTransactions(prev => [...prev, ...transactions]);
        
        toast.success(`Добавлено ${transactions.length} операций в облачную историю`);
      } else {
        // Fallback to local state
        setConfirmedTransactions(prev => [...prev, ...transactions]);
        setBudgetData(prev => updateBudgetWithTransactions(prev, transactions));
        
        toast.success(`Добавлено ${transactions.length} операций (только локально)`);
      }
    } catch (error) {
      console.error('Error confirming transactions:', error);
      
      // Fallback to local state on error
      setConfirmedTransactions(prev => [...prev, ...transactions]);
      setBudgetData(prev => updateBudgetWithTransactions(prev, transactions));
      
      toast.error('Ошибка сохранения в облако, данные сохранены локально');
    } finally {
      setPendingTransactions([]);
      setShowProcessing(false);
    }
  };

  const handleRejectTransactions = () => {
    setPendingTransactions([]);
    setShowProcessing(false);
    toast.info('Обработка операций отменена');
  };

  const handleUpdateBudget = async (updates: Partial<BudgetData>) => {
    try {
      if (isOnline) {
        const updatedBudget = await supabaseService.updateBudget(updates);
        setBudgetData(updatedBudget);
        toast.success('Настройки бюджета обновлены и сохранены в облаке');
      } else {
        setBudgetData(prev => ({ ...prev, ...updates }));
        toast.success('Настройки бюджета обновлены (только локально)');
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      setBudgetData(prev => ({ ...prev, ...updates }));
      toast.error('Ошибка сохранения в облако, настройки сохранены локально');
    }
  };

  const syncData = async () => {
    try {
      setIsLoading(true);
      const healthCheck = await supabaseService.healthCheck();
      setIsOnline(healthCheck);

      if (healthCheck) {
        const [transactions, budget] = await Promise.all([
          supabaseService.getTransactions(),
          supabaseService.getBudget()
        ]);

        setConfirmedTransactions(transactions);
        setBudgetData(budget);
        
        toast.success('Данные синхронизированы');
      } else {
        toast.error('Сервер недоступен');
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      setIsOnline(false);
      toast.error('Ошибка синхронизации данных');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success('Приложение установлено!');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground p-3 shadow-lg">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <div>
                <p className="text-sm font-medium">Установить приложение</p>
                <p className="text-xs opacity-90">Для удобного доступа с главного экрана</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="secondary"
                onClick={handleInstallApp}
                className="text-xs"
              >
                Установить
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={dismissInstallPrompt}
                className="p-1 h-auto text-primary-foreground hover:bg-primary-foreground/10"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className={`max-w-7xl mx-auto p-4 pb-24 ${showInstallPrompt ? 'pt-20' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
              <Wallet className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">BudgetTracker</h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Умное планирование финансов</p>
                {!isOnline && (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-orange-500" />
                    <span className="text-xs text-orange-500">Оффлайн</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {pendingTransactions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 animate-pulse border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setShowProcessing(true)}
              >
                <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {pendingTransactions.length}
                </Badge>
                Обработать операции
              </Button>
            )}
            <Button 
              variant="outline" 
              size="icon"
              onClick={syncData}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-3">
          {/* Budget Overview */}
          <BudgetOverview 
            budgetData={budgetData} 
            onUpdateBudget={handleUpdateBudget}
          />

          {/* Transaction History */}
          <TransactionHistory transactions={confirmedTransactions} />
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton 
        onUploadClick={() => setShowFileUpload(true)}
        pendingCount={pendingTransactions.length}
      />

      {/* File Upload Dialog */}
      <Dialog open={showFileUpload} onOpenChange={setShowFileUpload}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Загрузить операции
            </DialogTitle>
            <DialogDescription>
              Загрузите скриншоты банковских операций для автоматического распознавания транзакций и добавления в ваш бюджет.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <FileUpload onFilesProcessed={handleFilesProcessed} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Processing Dialog */}
      <Dialog open={showProcessing} onOpenChange={setShowProcessing}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Обработка операций</DialogTitle>
            <DialogDescription>
              Проверьте и отредактируйте распознанные транзакции перед добавлением в историю операций.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            {pendingTransactions.length > 0 && (
              <TransactionsList
                transactions={pendingTransactions}
                onUpdateTransaction={handleUpdateTransaction}
                onConfirmTransactions={handleConfirmTransactions}
                onReject={handleRejectTransactions}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <Toaster position="bottom-right" />
    </div>
  );
}