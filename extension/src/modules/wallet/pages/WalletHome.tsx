import { useState, useEffect } from 'react';
import { EyeClosedIcon, EyeIcon, MoveUpRight, MoveDownLeft, Search, Settings2 } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useWallet } from '@/lib/walletContext';
import TopLeft from '../../../assets/top_left.svg';
import TopRight from '../../../assets/top_right.svg';

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  icon: string;
}

function WalletHome() {
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const { principal } = useAuth();
  const { 
    userWallet, 
    isLoading, 
    hideBalance, 
    setHideBalance, 
    getNetworkValue,
    networkValues
  } = useWallet();

  const toggleVisibility = () => setHideBalance(!hideBalance);


  useEffect(() => {
    // Load wallet data from the wallet context
    const loadWalletData = async () => {
      if (!userWallet || !userWallet.addresses) {
        setTokens([]);
        return;
      }
      
      console.log("WalletHome: Loading wallet data for addresses:", userWallet.addresses);
      
      // Create token balances based on wallet addresses
      const walletTokens: TokenBalance[] = [];
      
      userWallet.addresses.forEach(addr => {
        let symbol = '';
        let name = '';
        let icon = '';
        
        if ('Bitcoin' in addr.token_type) {
          symbol = 'BTC';
          name = 'Bitcoin';
          icon = '/assets/bitcoin-dark.svg';
        } else if ('Ethereum' in addr.token_type) {
          symbol = 'ETH';
          name = 'Ethereum';
          icon = '/assets/ethereum-dark.svg';
        } else if ('Solana' in addr.token_type) {
          symbol = 'SOL';
          name = 'Solana';
          icon = '/assets/solana-dark.svg';
        } else if ('Fradium' in addr.token_type) {
          symbol = 'FUM';
          name = 'Fradium';
          icon = '/assets/fradium-dark.svg';
        }
        
        if (symbol) {
          const networkKey = name as keyof typeof networkValues;
          walletTokens.push({
            symbol,
            name,
            balance: '0.00', // In real implementation, you'd fetch actual balances
            usdValue: networkValues[networkKey] ? networkValues[networkKey].toFixed(2) : '0.00',
            icon
          });
        }
      });
      
      setTokens(walletTokens);
    };

    if (userWallet && !isLoading) {
      loadWalletData();
    }
  }, [userWallet, isLoading, networkValues]);

  if (isLoading) {
    return (
      <div className="w-[375px] h-[600px] bg-[#25262B] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#9BE4A0] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white/70">Loading your wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md overflow-y-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#1F2025]">
        <div className="text-white font-semibold">Fradium Wallet</div>
        <div className="text-xs text-white/50">
          {principal ? `${principal.slice(0, 8)}...` : 'Not connected'}
        </div>
      </div>

      <div className="flex flex-col items-center space-y-4 px-4">
        {/* Balance Card */}
        <div className="w-full bg-[#1F2025] rounded-lg p-4">
          <div className="flex flex-row justify-between mb-4">
            <img src={TopLeft} alt="Top Left" className="w-8 h-8" />
            <img src={TopRight} alt="Top Right" className="w-8 h-8" />
          </div>
          
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-white text-3xl font-bold">
                {getNetworkValue("All Networks")}
              </span>
              <button
                onClick={toggleVisibility}
                className="ml-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Toggle balance visibility"
              >
                {hideBalance ? <EyeClosedIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
            
            <p className="text-[#9BE4A0] text-sm">+$12.44 (+2.1%)</p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mt-6">
            <div className="flex-1 bg-white/10 rounded-lg p-3 flex items-center justify-between">
              <span className="text-white font-medium">Send</span>
              <button className="w-10 h-10 bg-[#9BE4A0] rounded-lg flex items-center justify-center hover:bg-[#8AD48F] transition-colors">
                <MoveUpRight className="text-black" size={18} />
              </button>
            </div>
            
            <div className="flex-1 bg-white/10 rounded-lg p-3 flex items-center justify-between">
              <span className="text-white font-medium">Receive</span>
              <button className="w-10 h-10 bg-[#9BE4A0] rounded-lg flex items-center justify-center hover:bg-[#8AD48F] transition-colors">
                <MoveDownLeft className="text-black" size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Tokens Section */}
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-lg font-semibold">Tokens</h2>
            <div className="flex space-x-2">
              <Search className="text-white/50 cursor-pointer hover:text-white" size={20} />
              <Settings2 className="text-white/50 cursor-pointer hover:text-white" size={20} />
            </div>
          </div>

          {/* Token List */}
          <div className="space-y-2">
            {tokens.map((token) => (
              <div
                key={token.symbol}
                className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <img src={token.icon} alt={token.name} className="w-8 h-8 rounded-full" />
                  <div>
                    <div className="text-white font-medium">{token.symbol}</div>
                    <div className="text-white/50 text-sm">{token.name}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-white font-medium">{token.balance}</div>
                  <div className="text-white/50 text-sm">${token.usdValue}</div>
                </div>
              </div>
            ))}
          </div>

          {tokens.length === 0 && (
            <div className="text-center py-8 text-white/50">
              <p>No tokens found</p>
              <p className="text-sm mt-1">Your tokens will appear here</p>
            </div>
          )}
          
          {/* Debug: Show wallet addresses */}
          {userWallet && userWallet.addresses && (
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
              <div className="text-xs text-white/70 mb-2">Wallet Addresses:</div>
              {userWallet.addresses.map((addr, index) => (
                <div key={index} className="text-xs text-white/50 mb-1 font-mono">
                  <div className="text-white/70">
                    {Object.keys(addr.token_type)[0]}: 
                  </div>
                  <div className="break-all pl-2">
                    {addr.address.length > 30 
                      ? `${addr.address.slice(0, 15)}...${addr.address.slice(-15)}`
                      : addr.address
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WalletHome;
