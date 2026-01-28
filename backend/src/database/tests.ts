import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Crear categoría
  const category = await prisma.category.create({
    data: {
      name: "Snacks",
    },
  });

  console.log("Category creada:", category);

  // Crear producto
  const product = await prisma.product.create({
    data: {
      name: "Galletitas",
      description: "Galletitas dulces",
      price: 12.5,
      stock: 100,
      categoryId: category.id,
    },
  });

  console.log("Producto creado:", product);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
