/**
 * API Key Authentication Middleware
 * Protects gateway endpoints from unauthorized access
 */

const authenticateGateway = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  // Skip auth for health check
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }
  
  // Check if API key is required for this route
  const protectedPaths = ['/api/location/update', '/api/gateway'];
  const isProtected = protectedPaths.some(path => req.path.startsWith(path));
  
  if (!isProtected) {
    return next();
  }
  
  // Validate API key
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required',
      code: 'MISSING_API_KEY'
    });
  }
  
  if (apiKey !== process.env.GATEWAY_API_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }
  
  next();
};

/**
 * Admin Token Authentication (for dashboard)
 */
const authenticateAdmin = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authorization token required',
      code: 'MISSING_TOKEN'
    });
  }
  
  // For now, simple token check. Upgrade to JWT later.
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
  
  next();
};

module.exports = {
  authenticateGateway,
  authenticateAdmin
};
