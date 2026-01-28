import prisma from "./prisma";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

async function seedAdmin(){
    const email = process.env.ADMIN_EMAIL!;
    const password = process.env.ADMIN_PASSWORD!;

    const exist = await prisma.users.findUnique({ where: { email } });

    if(exist){
        console.log("Admin ya existe, no se creó uno nuevo.");
        return;
    }

    const hashed = await bcrypt.hash(password, 12);

    await prisma.users.create({
        data: {
            name: "Admin",
            email,
            password: hashed,
            role: "ADMIN"
        }
    }); 
    console.log("Admin creado exitosamente.");
}

seedAdmin()
    .catch(console.error)
    .finally(() => prisma.$disconnect());