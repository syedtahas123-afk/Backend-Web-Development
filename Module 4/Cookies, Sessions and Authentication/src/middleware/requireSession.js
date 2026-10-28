const sessionStore = require('../session/sessionStore');
const userRepository = require('../repositories/userRepository');

module.exports = async function requireSession(req, res, next) {
  try {
    const sessionId = req.signedCookies?.sid;

    // cookie-parser returns false when a signed cookie fails verification.
    if (typeof sessionId !== 'string' || !sessionId) {
      return res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
      });
    }

    const session = await sessionStore.get(sessionId);
    if (!session) {
      return res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
      });
    }

    const user = await userRepository.findById(session.userId);
    if (!user) {
      await sessionStore.destroy(sessionId);
      return res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
      });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
    return next();
  } catch (error) {
    return next(error);
  }
};
