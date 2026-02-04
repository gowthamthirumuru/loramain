/**
 * Admin Controller - Stubbed
 * These are placeholder implementations until full Prisma refactor is done.
 */

exports.getAllSOS = (req, res) => { res.json({ success: true, data: [] }); };
exports.getActiveSOS = (req, res) => { res.json({ success: true, data: [] }); };
exports.getStats = (req, res) => { res.json({ success: true, data: { active: 0, resolved: 0, total: 0 } }); };
exports.resolveSOS = (req, res) => { res.json({ success: true, message: 'SOS resolved (stub)' }); };
exports.markFalseAlarm = (req, res) => { res.json({ success: true, message: 'Marked as false alarm (stub)' }); };
exports.getDashboard = (req, res) => { res.json({ success: true, data: {} }); };
exports.getSystemStats = (req, res) => { res.json({ success: true, data: {} }); };
exports.getAuditLogs = (req, res) => { res.json({ success: true, data: [] }); };