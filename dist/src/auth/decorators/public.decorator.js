"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUBLIC = exports.IS_PUBLIC_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.IS_PUBLIC_KEY = 'isPublic';
const PUBLIC = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.PUBLIC = PUBLIC;
//# sourceMappingURL=public.decorator.js.map