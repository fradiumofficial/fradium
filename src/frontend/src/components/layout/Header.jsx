import React, { useState } from 'react';
import { Link } from 'react-router';
import { Menu, X } from 'lucide-react';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const navigationItems = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Whitepaper', href: '/whitepaper' },
    { label: 'Docs', href: '/docs' },
    { label: 'View Reports', href: '/reports' },
  ];

  return (
    <header className="relative z-50 bg-transparent">
      <Container>
        <nav className="flex items-center justify-between py-6">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-white rounded flex items-center justify-center">
              <span className="text-primary-black font-bold text-lg">F</span>
            </div>
            <span className="text-primary-white font-semibold text-xl tracking-wide">Fradium</span>
          </Link>

          {/* Desktop Navigation Menu */}
          <div className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-primary-white hover:text-primary-green transition-colors duration-200 text-body font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Sign In Button */}
          <div className="hidden lg:block">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-transparent border-primary-green text-primary-green hover:bg-primary-green hover:text-primary-black"
            >
              Sign In →
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-primary-white p-2"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800">
            <div className="px-4 py-6 space-y-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="block text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full bg-transparent border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
                >
                  Sign In →
                </Button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
};

export default Header;
