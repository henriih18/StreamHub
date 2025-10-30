import { db } from '@/lib/db'

async function main() {
  // Crear tipos de streaming
  const netflixType = await db.streamingType.upsert({
    where: { name: 'Netflix' },
    update: {},
    create: {
      name: 'Netflix',
      description: 'La plataforma de streaming más popular del mundo',
      icon: '🎬',
      color: '#E50914',
      isActive: true
    }
  })

  const disneyType = await db.streamingType.upsert({
    where: { name: 'Disney+' },
    update: {},
    create: {
      name: 'Disney+',
      description: 'Todo el contenido de Disney, Pixar, Marvel y Star Wars',
      icon: '🏰',
      color: '#113CCF',
      isActive: true
    }
  })

  const hboType = await db.streamingType.upsert({
    where: { name: 'HBO Max' },
    update: {},
    create: {
      name: 'HBO Max',
      description: 'Acceso a HBO, Warner Bros y contenido exclusivo',
      icon: '🎭',
      color: '#B535F6',
      isActive: true
    }
  })

  const amazonType = await db.streamingType.upsert({
    where: { name: 'Amazon Prime' },
    update: {},
    create: {
      name: 'Amazon Prime',
      description: 'Miles de películas y series con Prime Originals',
      icon: '📦',
      color: '#FF9900',
      isActive: true
    }
  })

  // Crear cuentas de streaming
  const streamingAccounts = [
    {
      name: 'Netflix Premium',
      description: 'Acceso completo a todo el catálogo de Netflix con calidad 4K',
      price: 15.99,
      type: 'Netflix',
      duration: '1 mes',
      quality: '4K HDR',
      screens: 4,
      saleType: 'FULL' as const,
      isActive: true,
      image: '/images/netflix-premium.jpg'
    },
    {
      name: 'Netflix Standard',
      description: 'Acceso a Netflix en calidad HD',
      price: 9.99,
      type: 'Netflix',
      duration: '1 mes',
      quality: 'HD',
      screens: 2,
      saleType: 'FULL' as const,
      isActive: true,
      image: '/images/netflix-standard.jpg'
    },
    {
      name: 'Netflix Perfiles',
      description: 'Vende perfiles individuales de Netflix',
      price: 3.99,
      type: 'Netflix',
      duration: '1 mes',
      quality: 'HD',
      screens: 1,
      saleType: 'PROFILES' as const,
      maxProfiles: 4,
      pricePerProfile: 3.99,
      isActive: true,
      image: '/images/netflix-profiles.jpg'
    },
    {
      name: 'Disney+ Premium',
      description: 'Todo el contenido de Disney, Pixar, Marvel y Star Wars en 4K',
      price: 12.99,
      type: 'Disney+',
      duration: '1 mes',
      quality: '4K',
      screens: 4,
      saleType: 'FULL' as const,
      isActive: true,
      image: '/images/disney-premium.jpg'
    },
    {
      name: 'Disney+ Perfiles',
      description: 'Vende perfiles individuales de Disney+',
      price: 2.99,
      type: 'Disney+',
      duration: '1 mes',
      quality: 'HD',
      screens: 1,
      saleType: 'PROFILES' as const,
      maxProfiles: 4,
      pricePerProfile: 2.99,
      isActive: true,
      image: '/images/disney-profiles.jpg'
    },
    {
      name: 'HBO Max Premium',
      description: 'Acceso a HBO, Warner Bros y contenido exclusivo en 4K',
      price: 14.99,
      type: 'HBO Max',
      duration: '1 mes',
      quality: '4K',
      screens: 3,
      saleType: 'FULL' as const,
      isActive: true,
      image: '/images/hbo-premium.jpg'
    },
    {
      name: 'Amazon Prime Video',
      description: 'Miles de películas y series con Prime Originals',
      price: 8.99,
      type: 'Amazon Prime',
      duration: '1 mes',
      quality: '4K',
      screens: 3,
      saleType: 'FULL' as const,
      isActive: true,
      image: '/images/amazon-prime.jpg'
    }
  ]

  for (const account of streamingAccounts) {
    await db.streamingAccount.upsert({
      where: { 
        name_type: {
          name: account.name,
          type: account.type
        }
      },
      update: account,
      create: account
    })
  }

  console.log('Base de datos inicializada con éxito')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })