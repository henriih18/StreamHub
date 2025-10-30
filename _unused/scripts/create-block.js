const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function createBlock() {
  try {
    // Buscar usuario
    const user = await db.user.findUnique({
      where: { email: 'user2@example.com' }
    });
    
    if (!user) {
      console.log('Usuario no encontrado');
      return;
    }
    
    console.log('Usuario encontrado:', user.id);
    
    // Crear bloqueo
    const block = await db.userBlock.create({
      data: {
        userId: user.id,
        reason: 'Prueba de sistema de restricción - usuario no puede comprar',
        blockType: 'temporary',
        duration: '24',
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      }
    });
    
    console.log('Bloqueo creado:', {
      id: block.id,
      reason: block.reason,
      blockType: block.blockType,
      duration: block.duration,
      isActive: block.isActive,
      expiresAt: block.expiresAt
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.$disconnect();
  }
}

createBlock();