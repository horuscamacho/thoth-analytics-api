import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    getHealth(): {
        status: string;
        timestamp: string;
        service: string;
    };
    getDbHealth(): Promise<{
        status: string;
        database: string;
        timestamp: string;
    }>;
    getRedisHealth(): Promise<{
        status: string;
        cache: string;
        timestamp: string;
    }>;
    getFullHealth(): Promise<{
        status: string;
        services: {
            api: string;
            database: string;
            redis: string;
        };
        timestamp: string;
    }>;
}
