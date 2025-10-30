const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function createAdmin() {
  try {
    // Verificar si el usuario ya existe
    const existingUser = await db.user.findUnique({
      where: { email: 'hernandezhenry58@gmail.com' }
    });
    
    if (existingUser) {
      console.log('El usuario ya existe:', {
        id: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
        isActive: existingUser.isActive
      });
      
      // Si no es admin, actualizarlo
      if (existingUser.role !== 'ADMIN') {
        await db.user.update({
          where: { id: existingUser.id },
          data: { role: 'ADMIN' }
        });
        console.log('Usuario actualizado a rol ADMIN');
      }
      
      return;
    }
    
    // Crear nuevo usuario admin
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('henriih0925', 10);
    
    const newAdmin = await db.user.create({
      data: {
        email: 'hernandezhenry58@gmail.com',
        name: 'Henry Hernandez',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        isBlocked: false,
        credits: 1000
      }
    });
    
    console.log('✅ Admin creado exitosamente:');
    console.log('📧 Email: hernandezhenry58@gmail.com');
    console.log('🔑 Contraseña: henriih0925');
    console.log('👤 Rol: ADMIN');
    console.log('🆔 ID:', newAdmin.id);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.$disconnect();
  }
}

createAdmin();