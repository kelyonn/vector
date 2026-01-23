import { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

import { haptics } from '@/lib/haptics';
import { useVectorStore } from '@/store/useVectorStore';

export function Ledger() {
  const { wallet, updateWallet } = useVectorStore();
  const [amount, setAmount] = useState('');

  const handleTransaction = (isIncome: boolean) => {
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0) {
        updateWallet(isIncome ? val : -val);
        haptics.medium();
        setAmount('');
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-4">
            <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Liquid Assets</span>
                <div className="text-2xl font-mono font-bold text-primary flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    {wallet.toLocaleString()}
                </div>
            </div>
        </div>

        <div className="space-y-2">
            <input 
                type="number" 
                placeholder="Amount..." 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded p-2 text-sm font-mono focus:outline-none focus:border-primary"
            />
            <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={() => handleTransaction(true)}
                    className="flex items-center justify-center gap-1 bg-green-500/10 text-green-500 border border-green-500/20 p-2 rounded hover:bg-green-500/20 transition-colors"
                >
                    <TrendingUp className="w-4 h-4" /> <span className="text-xs font-bold">IN</span>
                </button>
                <button 
                    onClick={() => handleTransaction(false)}
                    className="flex items-center justify-center gap-1 bg-red-500/10 text-red-500 border border-red-500/20 p-2 rounded hover:bg-red-500/20 transition-colors"
                >
                    <TrendingDown className="w-4 h-4" /> <span className="text-xs font-bold">OUT</span>
                </button>
            </div>
        </div>
    </div>
  );
}