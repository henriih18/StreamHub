"use client";

import { useState } from "react";
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  User,
  LogIn,
  LogOut,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthModal } from "@/components/auth-modal";

interface HeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  onSearch: (query: string) => void;
  user?: any;
  onLogin: (user: any) => void;
  onLogout: () => void;
  isAdmin?: boolean;
}

export function Header({
  cartItemsCount,
  onCartClick,
  onSearch,
  user,
  onLogin,
  onLogout,
  isAdmin,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleLogin = (userData: any) => {
    onLogin(userData);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="bg-gray-900/95 backdrop-blur-sm border-b border-green-800/50 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                StreamHub
              </h1>
            </div>

            {/* Search Bar - Desktop */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-md mx-8"
            >
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar cuentas de streaming..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 w-full bg-white/50 backdrop-blur-sm border-white/20 focus:border-green-400 focus:ring-green-400"
                />
              </div>
            </form>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <a
                href="#accounts"
                className="text-gray-300 hover:text-green-400 transition-colors font-medium"
              >
                Cuentas
              </a>
              <a
                href="#features"
                className="text-gray-300 hover:text-green-400 transition-colors font-medium"
              >
                Características
              </a>

              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-300 font-medium">
                    Hola, {user.name || user.email}
                  </span>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => (window.location.href = "/admin")}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Salir
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Iniciar Sesión
                </Button>
              )}

              <Button
                onClick={onCartClick}
                variant="outline"
                size="sm"
                className="relative bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/70"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartItemsCount}
                  </span>
                )}
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <Button
                onClick={onCartClick}
                variant="outline"
                size="sm"
                className="relative bg-white/50 backdrop-blur-sm border-white/20"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartItemsCount}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700"
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-white/20 glass-effect">
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Buscar cuentas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 w-full bg-white/50 backdrop-blur-sm border-white/20"
                  />
                </div>
              </form>
              <nav className="flex flex-col space-y-2">
                <a
                  href="#accounts"
                  className="text-gray-700 hover:text-green-600 py-2 font-medium"
                >
                  Cuentas
                </a>
                <a
                  href="#features"
                  className="text-gray-700 hover:text-green-600 py-2 font-medium"
                >
                  Características
                </a>

                {user ? (
                  <>
                    <div className="text-sm text-gray-600 py-2 font-medium">
                      Hola, {user.name || user.email}
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start text-green-600"
                        onClick={() => (window.location.href = "/admin")}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Admin
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-gray-600"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Salir
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-green-600"
                    onClick={() => setIsAuthModalOpen(true)}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Iniciar Sesión
                  </Button>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
      />
    </>
  );
}
