# Transak Fiat-to-Crypto Integration

## 🎯 Overview
Frontend-only integration menggunakan Transak Widget untuk buy crypto dengan fiat currency (bank card).

## 🔧 Configuration

### Environment Variables (.env di root project)
```env
VITE_TRANSAK_API_KEY=your_api_key_here
VITE_TRANSAK_API_SECRET=your_secret_here  
VITE_TRANSAK_ENV=STAGING  # atau PRODUCTION
```

### Supported Networks & Currencies
- **Ethereum**: ETH, USDT, USDC, DAI
- **Solana**: SOL
- **Bitcoin**: BTC

## 📁 Files

### 1. `/src/frontend/src/core/config/transak.js`
- Transak configuration
- URL generator
- Validation functions

### 2. `/src/frontend/src/core/components/modals/TransakModal.jsx`
- Modal component untuk Transak widget
- Network selection (Ethereum, Solana, Bitcoin)
- Crypto currency selection
- Amount input
- Opens Transak in popup window

### 3. `/src/frontend/src/pages/wallet/AssetPage.jsx`
- "Buy" button di wallet card
- Integration dengan TransakModal

## 🚀 How It Works

1. User klik tombol "Buy" di wallet page
2. Modal terbuka dengan pilihan:
   - Network (Ethereum/Solana/Bitcoin)
   - Cryptocurrency
   - Amount dalam USD
3. User klik "Open Test Widget" (STAGING) atau "Buy Now" (PRODUCTION)
4. Transak widget opens in popup window
5. User completes purchase in Transak
6. Crypto dikirim langsung ke wallet address user

## 🧪 Testing Mode (STAGING)

- Set `VITE_TRANSAK_ENV=STAGING`
- Widget akan menggunakan Transak staging environment
- **NO REAL MONEY CHARGED**
- Gunakan test credentials dari Transak docs

## 🌐 Production Mode

- Set `VITE_TRANSAK_ENV=PRODUCTION`
- Widget will use production Transak
- **REAL MONEY WILL BE CHARGED**
- Real bank cards required

## 📚 References

- Transak Docs: https://docs.transak.com/
- SDK Config: https://docs.transak.com/docs/configuring-the-sdk
- Test Credentials: https://docs.transak.com/docs/test-credentials

## ✅ Features

- ✅ Frontend-only (no backend required)
- ✅ Direct integration dengan user's wallet addresses
- ✅ Support multiple networks
- ✅ Staging mode untuk testing
- ✅ Beautiful UI matching Fradium design
- ✅ Real-time wallet address detection
- ✅ Opens in popup window

## 🎨 UI Features

- Consistent dengan Fradium design system
- Glassmorphism effect
- Smooth animations
- Mobile responsive
- Clear test mode indicator
- Validation untuk minimum amount ($10)

## 🔐 Security

- API keys hanya di environment variables
- Tidak ada API secret exposure ke browser
- Direct integration dengan Transak (trusted partner)
- User completes KYC di Transak side

