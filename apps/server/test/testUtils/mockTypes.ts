import { dot } from 'node:test/reporters';
import { BaseService } from '../../src/common/baseService';
import { BaseExistsCheckError, ServiceErrors } from '../../src/common/errors';
import { BaseEntity } from '../../src/dal/models';
import { BaseDalService } from '../../src/dal/services/baseDalService';

export interface MockType extends BaseEntity {
    name: string;
    phone: string;
}

export class ExistsError extends BaseExistsCheckError {
    public static entityName = 'Mock';
}
export class NotFoundError extends BaseExistsCheckError {
    public static entityName = 'Mock';
}

export const mockServiceErrors: ServiceErrors = {
    notFoundErrorClass: ExistsError,
    existsErrorClass: NotFoundError
};

export class MockDalService extends BaseDalService<MockType> {
    constructor() {
        super({ collectionName: 'mocks' as any, prefix: 'mock', serviceErrors: mockServiceErrors });
    }
}

export class MockService extends BaseService<MockType, MockType, MockType, MockDalService> {
    constructor() {
        super({ prefix: 'MockService', dalService: new MockDalService(), serviceErrors: mockServiceErrors });
    }

    protected convertToEntity(dto: MockType): Pick<MockType, 'name' | 'phone'> {
        return dto;
    }
    protected async convertToDto(entity: MockType | null): Promise<MockType | null> {
        return entity;
    }
}
