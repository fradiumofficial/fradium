import React from 'react';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-gray-900 overflow-hidden">
      {/* Background dengan gradients dan pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          {/* Hero illustration kiri */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-full hidden lg:block">
            <img 
              src="/images/hero_1.png" 
              alt="Blockchain Security Illustration"
              className="w-full h-full object-contain opacity-80"
            />
          </div>
          
          {/* Hero illustration kanan */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full hidden lg:block">
            <img 
              src="/images/hero_2.png" 
              alt="Digital Assets Security"
              className="w-full h-full object-contain opacity-80"
            />
          </div>

          {/* Decorative elements */}
          <div className="absolute inset-0">
            {/* Floating dots pattern */}
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-green-400 rounded-full opacity-20 animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <Container className="relative z-10">
        <div className="flex flex-col items-center justify-center min-h-screen text-center pt-20">
          {/* Badge */}
          <div className="mb-8">
            <span className="inline-block px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm font-medium tracking-wider uppercase">
              REINVENTED BLOCKCHAIN SECURITY
            </span>
          </div>

          {/* Main Heading */}
          <div className="max-w-4xl mx-auto mb-6">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight">
              Protect every{' '}
              <span className="block">transaction.</span>
              <span className="block text-green-400">
                Stay ahead of fraud.
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <div className="max-w-2xl mx-auto mb-10">
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed px-4">
              Here is Your Digital Asset Guardian to Analyze, Protect, Transact with Confidence.
              Advanced fraud detection and smart contract security for the decentralized world.
            </p>
          </div>

          {/* CTA Button */}
          <div className="mb-16">
            <Button 
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Launch Wallet →
            </Button>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-bounce"></div>
            </div>
          </div>
        </div>
      </Container>

      {/* Gradient overlay untuk smooth transition ke section berikutnya */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-800 to-transparent"></div>
    </section>
  );
};

export default HeroSection;
