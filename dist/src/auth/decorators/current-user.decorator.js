"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURRENT_USER = void 0;
const common_1 = require("@nestjs/common");
exports.CURRENT_USER = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
        return null;
    }
    if (data) {
        return user[data];
    }
    return user;
});
//# sourceMappingURL=current-user.decorator.js.map