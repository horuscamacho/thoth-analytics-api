"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const tweets_module_1 = require("./tweets/tweets.module");
const news_module_1 = require("./news/news.module");
const ai_analysis_module_1 = require("./ai-analysis/ai-analysis.module");
const alerts_module_1 = require("./alerts/alerts.module");
const common_module_1 = require("./common/common.module");
const config_module_1 = require("./config/config.module");
const database_module_1 = require("./database/database.module");
const redis_config_1 = require("./config/redis.config");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
                load: [redis_config_1.default],
                validationOptions: {
                    allowUnknown: true,
                    abortEarly: true,
                },
            }),
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            tweets_module_1.TweetsModule,
            news_module_1.NewsModule,
            ai_analysis_module_1.AiAnalysisModule,
            alerts_module_1.AlertsModule,
            common_module_1.CommonModule,
            config_module_1.ConfigModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map