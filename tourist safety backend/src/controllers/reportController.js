/**
 * Report Controller - Stubbed
 */
exports.getAll = (req, res) => { res.json({ success: true, data: [] }); };
exports.getById = (req, res) => { res.json({ success: true, data: {} }); };
exports.generate = (req, res) => { res.status(201).json({ success: true, data: { id: 'stub-report' } }); };
exports.download = (req, res) => { res.json({ success: true, message: 'Download stub' }); };
