"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateToken, auth_middleware_1.requireTenantAccess, (req, res) => {
    res.json({ message: 'Audit routes placeholder' });
});
exports.default = router;
//# sourceMappingURL=audit.routes.js.map