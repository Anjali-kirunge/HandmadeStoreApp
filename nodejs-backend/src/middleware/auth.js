const jwtUtils = require('../utils/jwt');
const db = require('../config/db');
const { bool } = require('../utils/mappers');
const {
  AuthenticationException,
  AccessDeniedException,
  BadRequestException,
} = require('../utils/errors');

const TOKEN_HEADER = 'Authorization';
const TOKEN_PREFIX = 'Bearer ';

function extractToken(req) {
  const header = req.headers[TOKEN_HEADER.toLowerCase()];
  if (!header || !header.startsWith(TOKEN_PREFIX)) return null;
  return header.slice(TOKEN_PREFIX.length).trim();
}

async function loadUser(email) {
  const user = await db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) return null;
  return user;
}

async function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new AuthenticationException('Missing or invalid Authorization header');
    }

    let claims;
    try {
      claims = jwtUtils.decodeToken(token);
    } catch (err) {
      throw new AuthenticationException('Invalid or expired token');
    }

    if (claims.tokenType !== 'ACCESS') {
      throw new AuthenticationException('Invalid token type for access');
    }

    const stored = await db.queryOne(
      'SELECT token_id, revoked, expired, expires_at FROM jwt_tokens WHERE token = ? AND token_type = ?',
      [token, 'ACCESS']
    );
    if (!stored || bool(stored.revoked) || bool(stored.expired)) {
      throw new AuthenticationException('Token has been revoked or expired');
    }
    if (!stored.expires_at || new Date(stored.expires_at) <= new Date()) {
      throw new AuthenticationException('Token has expired');
    }

    const user = await loadUser(claims.sub);
    if (!user) {
      throw new AuthenticationException('User not found');
    }

    req.user = user;
    req.tokenJti = claims.jti;
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationException('Unauthorized'));
    }
    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
      return next(new AccessDeniedException());
    }
    next();
  };
}

async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      const claims = jwtUtils.decodeToken(token);
      if (claims.tokenType === 'ACCESS') {
        const user = await loadUser(claims.sub);
        if (user) req.user = user;
      }
    }
    next();
  } catch (err) {
    next();
  }
}

module.exports = { authenticate, requireRole, optionalAuth };
