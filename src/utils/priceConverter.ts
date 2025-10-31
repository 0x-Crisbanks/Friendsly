// Utility for converting between USD and cryptocurrency prices
export interface PriceData {
  usd: number;
  crypto: number;
  cryptoSymbol: string;
}

// Fallback exchange rates (used if API fails)
const FALLBACK_EXCHANGE_RATES = {
  ETH: 3200, // 1 ETH = $3200 USD
  BTC: 45000, // 1 BTC = $45000 USD
  USDT: 1, // 1 USDT = $1 USD
  SOL: 180, // 1 SOL = $180 USD
};

export type SupportedCrypto = keyof typeof FALLBACK_EXCHANGE_RATES;

// CoinGecko API mapping
const COINGECKO_IDS: Record<SupportedCrypto, string> = {
  ETH: 'ethereum',
  BTC: 'bitcoin',
  USDT: 'tether',
  SOL: 'solana',
};

// Cryptocurrency icons - using CoinGecko API (reliable and CORS-friendly)
export const CRYPTO_ICONS = {
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
};

// Fallback text symbols if images fail to load
export const CRYPTO_SYMBOLS = {
  ETH: '⟠',
  BTC: '₿',
  USDT: '₮',
  SOL: '◎',
};

export class PriceConverter {
  private static exchangeRates = { ...FALLBACK_EXCHANGE_RATES };
  private static lastUpdateTime: number = 0;
  private static updateInterval: number = 60000; // Update every 60 seconds
  private static isUpdating: boolean = false;

  // Get user's preferred cryptocurrency from settings
  static getPreferredCrypto(): SupportedCrypto {
    try {
      const savedCrypto = localStorage.getItem('preferred_crypto');
      if (savedCrypto && savedCrypto in FALLBACK_EXCHANGE_RATES) {
        return savedCrypto as SupportedCrypto;
      }
    } catch (error) {
      console.error('Error getting preferred crypto:', error);
    }
    return 'ETH'; // Default fallback
  }

  // Get crypto icon URL
  static getCryptoIcon(cryptoSymbol: SupportedCrypto): string {
    return CRYPTO_ICONS[cryptoSymbol];
  }

  // Get crypto symbol fallback
  static getCryptoSymbol(cryptoSymbol: SupportedCrypto): string {
    return CRYPTO_SYMBOLS[cryptoSymbol];
  }

  // Convert USD to crypto
  static usdToCrypto(usdAmount: number, cryptoSymbol: SupportedCrypto): number {
    const rate = this.exchangeRates[cryptoSymbol];
    if (!rate) throw new Error(`Unsupported cryptocurrency: ${cryptoSymbol}`);
    
    return usdAmount / rate;
  }

  // Convert crypto to USD
  static cryptoToUsd(cryptoAmount: number, cryptoSymbol: SupportedCrypto): number {
    const rate = this.exchangeRates[cryptoSymbol];
    if (!rate) throw new Error(`Unsupported cryptocurrency: ${cryptoSymbol}`);
    
    return cryptoAmount * rate;
  }

  // Get current exchange rate
  static getExchangeRate(cryptoSymbol: SupportedCrypto): number {
    return this.exchangeRates[cryptoSymbol];
  }

  // Format USD amount
  static formatUSD(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // Format crypto amount
  static formatCrypto(amount: number, symbol: SupportedCrypto): string {
    const decimals = symbol === 'BTC' ? 6 : symbol === 'ETH' ? 4 : symbol === 'SOL' ? 3 : 2;
    return `${amount.toFixed(decimals)} ${symbol}`;
  }

  // Format price with USD primary and crypto secondary
  static formatPriceWithConversion(usdAmount: number, cryptoSymbol?: SupportedCrypto): string {
    const crypto = cryptoSymbol || this.getPreferredCrypto();
    const cryptoAmount = this.usdToCrypto(usdAmount, crypto);
    return `${this.formatUSD(usdAmount)} (${this.formatCrypto(cryptoAmount, crypto)})`;
  }

  // Create price data object
  static createPriceData(usdAmount: number, cryptoSymbol: SupportedCrypto): PriceData {
    return {
      usd: usdAmount,
      crypto: this.usdToCrypto(usdAmount, cryptoSymbol),
      cryptoSymbol,
    };
  }

  // Update exchange rates from CoinGecko API
  static async updateExchangeRates(): Promise<void> {
    // Check if enough time has passed since last update
    const now = Date.now();
    if (this.isUpdating) {
      // Update already in progress, skipping silently
      return;
    }
    
    if (now - this.lastUpdateTime < this.updateInterval) {
      // Exchange rates are fresh, skipping update silently
      return;
    }

    this.isUpdating = true;

    try {
      // Fetching real-time crypto prices from CoinGecko silently
      
      // Build the CoinGecko API URL
      const ids = Object.values(COINGECKO_IDS).join(',');
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      // Received data from CoinGecko silently
      
      // Update exchange rates
      this.exchangeRates.ETH = data.ethereum?.usd || FALLBACK_EXCHANGE_RATES.ETH;
      this.exchangeRates.BTC = data.bitcoin?.usd || FALLBACK_EXCHANGE_RATES.BTC;
      this.exchangeRates.USDT = data.tether?.usd || FALLBACK_EXCHANGE_RATES.USDT;
      this.exchangeRates.SOL = data.solana?.usd || FALLBACK_EXCHANGE_RATES.SOL;
      
      this.lastUpdateTime = now;
      
      // Exchange rates updated successfully (silently)
    } catch (error) {
      console.error('❌ Failed to update exchange rates from CoinGecko:', error);
      // Using fallback exchange rates (silently)
      
      // Use fallback rates if API fails
      this.exchangeRates = { ...FALLBACK_EXCHANGE_RATES };
    } finally {
      this.isUpdating = false;
    }
  }

  // Get the last update time (for UI display)
  static getLastUpdateTime(): Date | null {
    return this.lastUpdateTime > 0 ? new Date(this.lastUpdateTime) : null;
  }

  // Force update (bypass time check)
  static async forceUpdateExchangeRates(): Promise<void> {
    this.lastUpdateTime = 0;
    await this.updateExchangeRates();
  }
}

// Quick amounts in USD for tips and subscriptions
export const QUICK_TIP_AMOUNTS_USD = [5, 10, 25, 50, 100, 200];
export const SUBSCRIPTION_PRICES_USD = {
  basic: 9.99,
  premium: 19.99,
  vip: 49.99,
};