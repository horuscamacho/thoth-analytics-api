export declare class UpdateTenantDto {
    name?: string;
    type?: 'GOVERNMENT_STATE' | 'GOVERNMENT_MUNICIPAL' | 'HIGH_PROFILE';
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    settings?: Record<string, unknown>;
}
