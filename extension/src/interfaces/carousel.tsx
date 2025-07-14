// --- Mock Data ---

interface CryptoData {
  name: string;
  icon: string | React.FC<React.SVGProps<SVGSVGElement>>;
  price: number;
  change: number;
}

const EthereumIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <path fill="#627eea" d="M16 31.9L1.5 16.7l14.5 15.2z"/>
    <path fill="#8a9ef6" d="M16 31.9l14.5-15.2L16 31.9z"/>
    <path fill="#627eea" d="M16 0L1.5 16.7 16 0z"/>
    <path fill="#8a9ef6" d="M16 0l14.5 16.7L16 0z"/>
    <path fill="#4557a4" d="M16 17.9l14.5-1.2-14.5 15.2z"/>
    <path fill="#627eea" d="M1.5 16.7L16 17.9 1.5 16.7z"/>
    <path fill="#8a9ef6" d="M16 17.9V31.9l-14.5-15.2z"/>
    <path fill="#627eea" d="M16 17.9V0L1.5 16.7z"/>
  </svg>
);

const BitcoinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="#f7931a" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.84 13.35c.4.4.4 1.04 0 1.44s-1.04.4-1.44 0l-1.4-1.4v1.31c0 .55-.45 1-1 1s-1-.45-1-1v-1.31l-1.4 1.4c-.4.4-1.04.4-1.44 0s-.4-1.04 0-1.44l1.4-1.4-1.4-1.4c-.4-.4-.4-1.04 0-1.44s1.04-.4 1.44 0l1.4 1.4V8.2c0-.55.45-1 1-1s1 .45 1 1v1.31l1.4-1.4c.4-.4 1.04-.4 1.44 0s.4 1.04 0 1.44l-1.4 1.4 1.4 1.4z"/>
        <path fill="#ffffff" d="M13.4 12l1.4-1.4c.4-.4.4-1.04 0-1.44s-1.04-.4-1.44 0l-1.4 1.4V8.2c0-.55-.45-1-1-1s-1 .45-1 1v1.31l-1.4-1.4c-.4-.4-1.04-.4-1.44 0s-.4 1.04 0 1.44l1.4 1.4-1.4 1.4c-.4.4-.4 1.04 0 1.44s1.04.4 1.44 0l1.4-1.4v1.31c0 .55.45 1 1 1s1-.45 1-1v-1.31l1.4 1.4c.4.4 1.04.4 1.44 0s.4-1.04 0-1.44l-1.4-1.4z"/>
    </svg>
);


const cryptoCards: CryptoData[] = [
  {
    name: 'Ethereum',
    icon: EthereumIcon,
    price: 404.18,
    change: 12.44,
  },
  {
    name: 'Bitcoin',
    icon: BitcoinIcon,
    price: 9802.31,
    change: -2.57,
  },
  {
    name: 'Ethereum',
    icon: EthereumIcon,
    price: 415.50,
    change: 3.11,
  },
];

export default cryptoCards;