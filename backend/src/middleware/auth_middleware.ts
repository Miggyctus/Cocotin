import { Request, Response, NextFunction } from "express";
import { verifyToken} from "../utils/jwt";

export function requireAuth(req: any, res: Response, next: NextFunction) 
{
    const header = req.headers.authorization;
    if (!header) {
        return res.status(401).json({ error: "No se proporcionó token de autorización" });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch{
        return res.status(401).json({ error: "Token inválido o expirado" });
    }
}

export function requireAdmin(req: any, res: Response, next: NextFunction)
{
    if(req.user?.role !== "ADMIN")
    {
        return res.status(403).json({ error: "Acceso denegado: rol requerido ADMIN" });
    }
    next();
}