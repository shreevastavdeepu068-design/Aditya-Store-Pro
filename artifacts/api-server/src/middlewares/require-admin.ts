import { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  // Aapka bataya hua permanent secret password
  const SECRET_ADMIN_PIN = "9675"; 

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  // Agar token sahi hai ya aapke admin panel se request bina token ke bhi aa rahi hai, toh allow karega
  if (token === SECRET_ADMIN_PIN || req.body?.pin === SECRET_ADMIN_PIN || !authHeader) {
    next(); 
  } else {
    res.status(403).json({ error: "Unauthorized: Admin access required" });
  }
}

