export declare class CreateTenantDto {
    name: string;
    type: 'GOVERNMENT_STATE' | 'GOVERNMENT_MUNICIPAL' | 'HIGH_PROFILE';
    settings?: Record<string, unknown>;
}
