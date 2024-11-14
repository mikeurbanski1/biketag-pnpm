import { BaseService } from './baseService';

export const validateExists = async <E extends BaseService<any, any, any, any>>(id: string, service: E): Promise<void> => {
    await service.getRequired({ id });
};
