// Kode 4.6 - Potongan Kode Middleware Autentikasi
// File: backend/src/middlewares/auth.middleware.ts

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const session = await auth.api.getSession({
      headers: normalizeHeaders(req.headers),
    });

    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (session.user.isActive === false) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    req.user = session.user;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
