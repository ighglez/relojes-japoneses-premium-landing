import { db } from '../index';
import { products } from '../schema';

const seikoProducts = [
  // SEIKO 5 SPORTS GMT Series
  {
    name: '5 Sports GMT',
    brand: 'Seiko',
    reference: 'SSK003K1',
    description: 'Reloj GMT con esfera negra y bisel bidireccional. Calibre automático 4R34 con función GMT.',
    imageUrl: '/images/products/seiko-ssk003k1.webp',
    price: 395.00,
    stock: 5,
    category: '5 Sports GMT',
    features: JSON.stringify({
      diameter: '42.5mm',
      movement: 'Automático 4R34',
      waterResistance: '100m',
      color: 'Negro'
    }),
    isFeatured: true
  },
  {
    name: '5 Sports GMT',
    brand: 'Seiko',
    reference: 'SSK001K1',
    description: 'GMT deportivo con esfera azul profundo y agujas luminosas. Resistencia 100m.',
    imageUrl: '/images/products/seiko-ssk001k1.webp',
    price: 395.00,
    stock: 4,
    category: '5 Sports GMT',
    features: JSON.stringify({
      diameter: '42.5mm',
      movement: 'Automático 4R34',
      waterResistance: '100m',
      color: 'Azul'
    }),
    isFeatured: false
  },
  {
    name: '5 Sports GMT',
    brand: 'Seiko',
    reference: 'SSK005K1',
    description: 'Modelo GMT con esfera verde militar y bisel giratorio. Estilo vintage contemporáneo.',
    imageUrl: '/images/products/seiko-ssk005k1.webp',
    price: 395.00,
    stock: 3,
    category: '5 Sports GMT',
    features: JSON.stringify({
      diameter: '42.5mm',
      movement: 'Automático 4R34',
      waterResistance: '100m',
      color: 'Verde'
    }),
    isFeatured: false
  },
  {
    name: '5 Sports GMT',
    brand: 'Seiko',
    reference: 'SSK021K1',
    description: 'GMT Special Edition con detalles en rojo y negro. Edición limitada de colección.',
    imageUrl: '/images/products/seiko-ssk021k1.webp',
    price: 425.00,
    stock: 2,
    category: '5 Sports GMT',
    features: JSON.stringify({
      diameter: '42.5mm',
      movement: 'Automático 4R34',
      waterResistance: '100m',
      color: 'Negro/Rojo'
    }),
    isFeatured: false
  },
  {
    name: '5 Sports GMT',
    brand: 'Seiko',
    reference: 'SSK035K1',
    description: 'Diseño urbano GMT con caja acero inoxidable y corona protegida.',
    imageUrl: '/images/products/seiko-ssk035k1.webp',
    price: 410.00,
    stock: 6,
    category: '5 Sports GMT',
    features: JSON.stringify({
      diameter: '42.5mm',
      movement: 'Automático 4R34',
      waterResistance: '100m',
      color: 'Gris'
    }),
    isFeatured: false
  },
  {
    name: '5 Sports GMT',
    brand: 'Seiko',
    reference: 'SSK033K1',
    description: 'GMT con esfera blanca y marcadores dorados. Elegancia deportiva.',
    imageUrl: '/images/products/seiko-ssk033k1.webp',
    price: 415.00,
    stock: 4,
    category: '5 Sports GMT',
    features: JSON.stringify({
      diameter: '42.5mm',
      movement: 'Automático 4R34',
      waterResistance: '100m',
      color: 'Blanco'
    }),
    isFeatured: false
  },
  {
    name: '5 Sports GMT',
    brand: 'Seiko',
    reference: 'SSK031K1',
    description: 'Edición GMT en tono champagne con bisel de acero pulido.',
    imageUrl: '/images/products/seiko-ssk031k1.webp',
    price: 420.00,
    stock: 3,
    category: '5 Sports GMT',
    features: JSON.stringify({
      diameter: '42.5mm',
      movement: 'Automático 4R34',
      waterResistance: '100m',
      color: 'Champagne'
    }),
    isFeatured: false
  },
  {
    name: '5 Sports GMT',
    brand: 'Seiko',
    reference: 'SSK029K1',
    description: 'GMT deportivo con esfera negra mate y acabados en DLC.',
    imageUrl: '/images/products/seiko-ssk029k1.webp',
    price: 445.00,
    stock: 2,
    category: '5 Sports GMT',
    features: JSON.stringify({
      diameter: '42.5mm',
      movement: 'Automático 4R34',
      waterResistance: '100m',
      color: 'Negro DLC'
    }),
    isFeatured: false
  },
  {
    name: '5 Sports GMT',
    brand: 'Seiko',
    reference: 'SSK043K1',
    description: 'GMT Multicolor con esfera degradada azul-roja. Diseño statement.',
    imageUrl: '/images/products/seiko-ssk043k1.webp',
    price: 430.00,
    stock: 5,
    category: '5 Sports GMT',
    features: JSON.stringify({
      diameter: '42.5mm',
      movement: 'Automático 4R34',
      waterResistance: '100m',
      color: 'Multicolor'
    }),
    isFeatured: true
  },
  {
    name: '5 Sports GMT',
    brand: 'Seiko',
    reference: 'SSK019K1',
    description: 'Modelo GMT con bisel Pepsi y esfera azul marino. Icono moderno.',
    imageUrl: '/images/products/seiko-ssk019k1.webp',
    price: 405.00,
    stock: 7,
    category: '5 Sports GMT',
    features: JSON.stringify({
      diameter: '42.5mm',
      movement: 'Automático 4R34',
      waterResistance: '100m',
      color: 'Azul/Rojo'
    }),
    isFeatured: false
  },
  {
    name: '5 Sports GMT',
    brand: 'Seiko',
    reference: 'SSK017K1',
    description: 'GMT con bisel Batman en azul y negro. Contraste elegante.',
    imageUrl: '/images/products/seiko-ssk017k1.webp',
    price: 410.00,
    stock: 6,
    category: '5 Sports GMT',
    features: JSON.stringify({
      diameter: '42.5mm',
      movement: 'Automático 4R34',
      waterResistance: '100m',
      color: 'Azul/Negro'
    }),
    isFeatured: false
  },
  {
    name: '5 Sports GMT',
    brand: 'Seiko',
    reference: 'SSK027K1',
    description: 'Edición especial GMT con acabado brushed y pulido alternado.',
    imageUrl: '/images/products/seiko-ssk027k1.webp',
    price: 425.00,
    stock: 3,
    category: '5 Sports GMT',
    features: JSON.stringify({
      diameter: '42.5mm',
      movement: 'Automático 4R34',
      waterResistance: '100m',
      color: 'Acero'
    }),
    isFeatured: false
  },
  {
    name: '5 Sports GMT',
    brand: 'Seiko',
    reference: 'SSK044K1',
    description: 'GMT aventurero con correa NATO y caja robusta de acero.',
    imageUrl: '/images/products/seiko-ssk044k1.webp',
    price: 385.00,
    stock: 8,
    category: '5 Sports GMT',
    features: JSON.stringify({
      diameter: '42.5mm',
      movement: 'Automático 4R34',
      waterResistance: '100m',
      color: 'Verde militar'
    }),
    isFeatured: false
  },

  // SEIKO PROSPEX SSC Speedtimer Series
  {
    name: 'Prospex Speedtimer Chronograph',
    brand: 'Seiko',
    reference: 'SSC911P1',
    description: 'Cronógrafo solar Speedtimer con movimiento V192. Inspiración racing clásica.',
    imageUrl: '/images/products/seiko-ssc911p1.webp',
    price: 595.00,
    stock: 4,
    category: 'Prospex SSC',
    features: JSON.stringify({
      diameter: '41mm',
      movement: 'Solar V192',
      waterResistance: '100m',
      color: 'Negro'
    }),
    isFeatured: true
  },
  {
    name: 'Prospex Speedtimer Chronograph',
    brand: 'Seiko',
    reference: 'SSC927P1',
    description: 'Speedtimer solar con esfera azul sunburst y subesferas contrastantes.',
    imageUrl: '/images/products/seiko-ssc927p1.webp',
    price: 595.00,
    stock: 3,
    category: 'Prospex SSC',
    features: JSON.stringify({
      diameter: '41mm',
      movement: 'Solar V192',
      waterResistance: '100m',
      color: 'Azul'
    }),
    isFeatured: false
  },
  {
    name: 'Prospex Speedtimer Chronograph',
    brand: 'Seiko',
    reference: 'SSC935P1',
    description: 'Cronógrafo solar Speedtimer con esfera verde y correa piel café.',
    imageUrl: '/images/products/seiko-ssc935p1.webp',
    price: 615.00,
    stock: 2,
    category: 'Prospex SSC',
    features: JSON.stringify({
      diameter: '41mm',
      movement: 'Solar V192',
      waterResistance: '100m',
      color: 'Verde'
    }),
    isFeatured: false
  },
  {
    name: 'Prospex Speedtimer Chronograph',
    brand: 'Seiko',
    reference: 'SSC947P1',
    description: 'Edición especial Speedtimer con esfera panda y detalles vintage.',
    imageUrl: '/images/products/seiko-ssc947p1.webp',
    price: 625.00,
    stock: 1,
    category: 'Prospex SSC',
    features: JSON.stringify({
      diameter: '41mm',
      movement: 'Solar V192',
      waterResistance: '100m',
      color: 'Blanco/Negro'
    }),
    isFeatured: true
  },

  // SEIKO PROSPEX SPB GMT Series
  {
    name: 'Prospex Diver GMT',
    brand: 'Seiko',
    reference: 'SPB149J1',
    description: 'Diver GMT profesional 200m con calibre 6R54 fabricado en Japón.',
    imageUrl: '/images/products/seiko-spb149j1.webp',
    price: 1195.00,
    stock: 2,
    category: 'Prospex SPB GMT',
    features: JSON.stringify({
      diameter: '44mm',
      movement: 'Automático 6R54',
      waterResistance: '200m',
      color: 'Azul'
    }),
    isFeatured: true
  },
  {
    name: 'Prospex Diver GMT',
    brand: 'Seiko',
    reference: 'SPB143J1',
    description: 'Modelo GMT con bisel Pepsi y corona a las 4. Resistencia profesional.',
    imageUrl: '/images/products/seiko-spb143j1.webp',
    price: 1150.00,
    stock: 3,
    category: 'Prospex SPB GMT',
    features: JSON.stringify({
      diameter: '44mm',
      movement: 'Automático 6R54',
      waterResistance: '200m',
      color: 'Rojo/Azul'
    }),
    isFeatured: false
  },
  {
    name: 'Prospex Diver GMT',
    brand: 'Seiko',
    reference: 'SPB213J1',
    description: 'GMT Diver con esfera negra mate y lume Lumibrite de alto contraste.',
    imageUrl: '/images/products/seiko-spb213j1.webp',
    price: 1175.00,
    stock: 2,
    category: 'Prospex SPB GMT',
    features: JSON.stringify({
      diameter: '44mm',
      movement: 'Automático 6R54',
      waterResistance: '200m',
      color: 'Negro'
    }),
    isFeatured: false
  },
  {
    name: 'Prospex Diver GMT',
    brand: 'Seiko',
    reference: 'SPB187J1',
    description: 'Diver GMT edición especial con esfera verde bosque profundo.',
    imageUrl: '/images/products/seiko-spb187j1.webp',
    price: 1225.00,
    stock: 1,
    category: 'Prospex SPB GMT',
    features: JSON.stringify({
      diameter: '44mm',
      movement: 'Automático 6R54',
      waterResistance: '200m',
      color: 'Verde'
    }),
    isFeatured: false
  },
  {
    name: 'Prospex Diver GMT',
    brand: 'Seiko',
    reference: 'SPB207J1',
    description: 'GMT profesional con acabado Zaratsu y cristal de zafiro curvo.',
    imageUrl: '/images/products/seiko-spb207j1.webp',
    price: 1295.00,
    stock: 2,
    category: 'Prospex SPB GMT',
    features: JSON.stringify({
      diameter: '44mm',
      movement: 'Automático 6R54',
      waterResistance: '200m',
      color: 'Azul profundo'
    }),
    isFeatured: true
  },
  {
    name: 'Prospex Diver GMT',
    brand: 'Seiko',
    reference: 'SPB299J1',
    description: 'Modelo GMT con caja compacta y bisel de cerámica negro.',
    imageUrl: '/images/products/seiko-spb299j1.webp',
    price: 1165.00,
    stock: 3,
    category: 'Prospex SPB GMT',
    features: JSON.stringify({
      diameter: '42mm',
      movement: 'Automático 6R54',
      waterResistance: '200m',
      color: 'Negro'
    }),
    isFeatured: false
  },
  {
    name: 'Prospex Diver GMT',
    brand: 'Seiko',
    reference: 'SPB451J1',
    description: 'GMT Diver de edición limitada con esfera degradada y caja DLC.',
    imageUrl: '/images/products/seiko-spb451j1.webp',
    price: 1350.00,
    stock: 1,
    category: 'Prospex SPB GMT',
    features: JSON.stringify({
      diameter: '44mm',
      movement: 'Automático 6R54',
      waterResistance: '200m',
      color: 'Negro DLC'
    }),
    isFeatured: false
  },
  {
    name: 'Prospex Diver GMT',
    brand: 'Seiko',
    reference: 'SPB297J1',
    description: 'Diver GMT con esfera gris y correa silicona profesional.',
    imageUrl: '/images/products/seiko-spb297j1.webp',
    price: 1185.00,
    stock: 4,
    category: 'Prospex SPB GMT',
    features: JSON.stringify({
      diameter: '44mm',
      movement: 'Automático 6R54',
      waterResistance: '200m',
      color: 'Gris'
    }),
    isFeatured: false
  },
  {
    name: 'Prospex Diver GMT',
    brand: 'Seiko',
    reference: 'SPB453J1',
    description: 'GMT profesional con bisel root beer y esfera marrón cálido.',
    imageUrl: '/images/products/seiko-spb453j1.webp',
    price: 1245.00,
    stock: 2,
    category: 'Prospex SPB GMT',
    features: JSON.stringify({
      diameter: '44mm',
      movement: 'Automático 6R54',
      waterResistance: '200m',
      color: 'Marrón'
    }),
    isFeatured: false
  },
  {
    name: 'Prospex Diver GMT',
    brand: 'Seiko',
    reference: 'SPB383J1',
    description: 'Modelo GMT con acabado pulido espejo y cristal anti-reflectante.',
    imageUrl: '/images/products/seiko-spb383j1.webp',
    price: 1315.00,
    stock: 2,
    category: 'Prospex SPB GMT',
    features: JSON.stringify({
      diameter: '44mm',
      movement: 'Automático 6R54',
      waterResistance: '200m',
      color: 'Azul cobalto'
    }),
    isFeatured: false
  },
  {
    name: 'Prospex Diver GMT',
    brand: 'Seiko',
    reference: 'SPB381J1',
    description: 'Diver GMT con esfera sunburst verde esmeralda y bisel cerámico.',
    imageUrl: '/images/products/seiko-spb381j1.webp',
    price: 1275.00,
    stock: 3,
    category: 'Prospex SPB GMT',
    features: JSON.stringify({
      diameter: '44mm',
      movement: 'Automático 6R54',
      waterResistance: '200m',
      color: 'Verde esmeralda'
    }),
    isFeatured: true
  },
  {
    name: 'Prospex Diver GMT',
    brand: 'Seiko',
    reference: 'SPB439J1',
    description: 'GMT edición especial con correa acero y cierre de seguridad.',
    imageUrl: '/images/products/seiko-spb439j1.webp',
    price: 1335.00,
    stock: 1,
    category: 'Prospex SPB GMT',
    features: JSON.stringify({
      diameter: '44mm',
      movement: 'Automático 6R54',
      waterResistance: '200m',
      color: 'Negro/Plata'
    }),
    isFeatured: false
  }
];

async function seedProducts() {
  console.log('🌱 Seeding products...');
  
  try {
    // Insert all products
    for (const product of seikoProducts) {
      await db.insert(products).values({
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    console.log(`✅ Successfully seeded ${seikoProducts.length} Seiko products`);
    console.log('📊 Breakdown:');
    console.log(`   - 5 Sports GMT: 13 models`);
    console.log(`   - Prospex SSC: 4 models`);
    console.log(`   - Prospex SPB GMT: 12 models`);
    console.log('');
    console.log('🎯 All products are now available in the catalog!');
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
}

seedProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
