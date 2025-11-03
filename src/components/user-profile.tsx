"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit,
  Save,
  X,
  Shield,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react";

interface UserProfileProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    memberSince: string;
    credits: number;
    avatar?: string;
    address?: string;
    bio?: string;
  };
  onUpdate?: (userData: Partial<UserProfileProps["user"]>) => void;
  onLogout?: () => void;
}

export function UserProfile({ user, onUpdate, onLogout }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  const handleSave = () => {
    onUpdate?.(editedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedUser((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Perfil de Usuario
          </h1>
          <p className="text-slate-400">
            Gestiona tu información personal y preferencias
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                {/* Avatar */}
                <div className="text-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    {user.name}
                  </h2>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {user.role === "ADMIN" ? "Administrador" : "Usuario"}
                  </Badge>
                </div>

                {/* Quick Stats */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Créditos</span>
                    <span className="text-emerald-400 font-semibold">
                      ${user.credits.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">
                      Miembro desde
                    </span>
                    <span className="text-white text-sm">
                      {user.memberSince}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Estado</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="text-emerald-400 text-sm">Activo</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Recargar Créditos
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configuración
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-red-500/50 text-red-300 hover:bg-red-500/10"
                    onClick={onLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Information */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    Información Personal
                  </h3>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Guardar
                      </Button>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Nombre Completo
                    </label>
                    {isEditing ? (
                      <Input
                        value={editedUser.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    ) : (
                      <p className="text-white">{user.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Correo Electrónico
                    </label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editedUser.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    ) : (
                      <p className="text-white">{user.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Teléfono
                    </label>
                    {isEditing ? (
                      <Input
                        value={editedUser.phone || ""}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Añadir teléfono"
                      />
                    ) : (
                      <p className="text-white">
                        {user.phone || "No especificado"}
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Dirección
                    </label>
                    {isEditing ? (
                      <Input
                        value={editedUser.address || ""}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Añadir dirección"
                      />
                    ) : (
                      <p className="text-white">
                        {user.address || "No especificada"}
                      </p>
                    )}
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Biografía
                    </label>
                    {isEditing ? (
                      <Textarea
                        value={editedUser.bio || ""}
                        onChange={(e) =>
                          handleInputChange("bio", e.target.value)
                        }
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Cuéntanos sobre ti..."
                        rows={4}
                      />
                    ) : (
                      <p className="text-white">
                        {user.bio || "No hay biografía disponible"}
                      </p>
                    )}
                  </div>

                  {/* Member Since */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Fecha de Registro
                    </label>
                    <p className="text-white">{user.memberSince}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Security Section */}
        <Card className="bg-slate-800/50 border-slate-700 mt-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Seguridad
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 justify-start"
              >
                Cambiar Contraseña
              </Button>
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 justify-start"
              >
                Autenticación de Dos Factores
              </Button>
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 justify-start"
              >
                Historial de Inicio de Sesión
              </Button>
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 justify-start"
              >
                Dispositivos Conectados
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
