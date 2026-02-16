//
// Middleware de autenticación simple para rutas admin
//

export function requireAdminAuth(req, res, next) {
    
    const authHeader = req.headers.authorization;
    const adminToken = process.env.ADMIN_TOKEN || "admin-secret-token-change-in-production";

    if (!authHeader) {
        return res.status(401).json({
            error: "Token de autenticación requerido"
        });
    }

    // Formato: "Bearer <token>"
    const token = authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : authHeader;

    if (token !== adminToken) {
        return res.status(403).json({
            error: "Token de autenticación inválido"
        });
    }

    next();
}
