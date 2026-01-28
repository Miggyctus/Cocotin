import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../database/prisma";
import { signToken } from "../utils/jwt";

export async function login(req: Request, res: Response) {
    const { email, password } = req.body;
    
    const user = await prisma.users.findUnique({ where: { email } });

    if(!user || user.role !== "ADMIN")
    {
        return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if(!valid)
    {
        return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = signToken({ id: user.id, role: user.role });

    res.json({ token });
}

export async function me(req: any, res: Response) {
    res.json(req.user);
}