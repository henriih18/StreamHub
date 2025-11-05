"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/toast-custom";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = () => {
    try {
      const cart = localStorage.getItem("cart");
      const cartData = cart ? JSON.parse(cart) : [];
      setCartItems(cartData);
    } catch (error) {
      //console.error('Error loading cart:', error)
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const updatedCart = cartItems.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      );
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      setCartItems(updatedCart);

      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      toast.error("Error al actualizar cantidad");
    }
  };

  const removeItem = (id: string) => {
    try {
      const updatedCart = cartItems.filter((item) => item.id !== id);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      setCartItems(updatedCart);

      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event("cartUpdated"));
      toast.success("Producto eliminado del carrito");
    } catch (error) {
      toast.error("Error al eliminar producto");
    }
  };

  const clearCart = () => {
    try {
      localStorage.removeItem("cart");
      setCartItems([]);

      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event("cartUpdated"));
      toast.success("Carrito vaciado");
    } catch (error) {
      toast.error("Error al vaciar carrito");
    }
  };

  const getTotalItems = () => {
    return (cartItems || []).reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return (cartItems || []).reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-3">
                <ShoppingCart className="w-8 h-8 text-emerald-500" />
                <span>Mi Carrito</span>
              </h1>
              <p className="text-slate-400 mt-1">
                {getTotalItems()}{" "}
                {getTotalItems() === 1 ? "producto" : "productos"}
              </p>
            </div>
          </div>

          {(cartItems || []).length > 0 && (
            <Button
              variant="outline"
              onClick={clearCart}
              className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Vaciar Carrito
            </Button>
          )}
        </div>

        {(cartItems || []).length === 0 ? (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-12 text-center">
              <ShoppingCart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-slate-300 mb-2">
                Tu carrito está vacío
              </h2>
              <p className="text-slate-400 mb-6">
                Parece que aún no has añadido ningún producto a tu carrito
              </p>
              <Link href="/">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Explorar Productos
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="bg-slate-900 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-slate-800 rounded-lg flex items-center justify-center">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ShoppingCart className="w-8 h-8 text-slate-600" />
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-sm text-slate-400 mb-2">
                            {item.description}
                          </p>
                        )}
                        <p className="text-emerald-400 font-semibold">
                          $
                          {item.price.toLocaleString("es-CO", {
                            maximumFractionDigits: 0,
                          })}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="text-slate-400 border-slate-600 hover:bg-slate-800"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="text-slate-400 border-slate-600 hover:bg-slate-800"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:bg-red-400/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-slate-900 border-slate-700 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-white">
                    Resumen del Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal</span>
                    <span>
                      $
                      {getTotalPrice().toLocaleString("es-CO", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Envío</span>
                    <span className="text-emerald-400">Gratis</span>
                  </div>
                  <Separator className="bg-slate-700" />
                  <div className="flex justify-between text-lg font-semibold text-white">
                    <span>Total</span>
                    <span className="text-emerald-400">
                      ${getTotalPrice().toFixed(2)}
                    </span>
                  </div>

                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3">
                    Proceder al Pago
                  </Button>

                  <Link href="/">
                    <Button
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      Continuar Comprando
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
