import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user';
import { UserRole } from '../entities/user-role.entity';
import { TraceIdService } from '../trace-id.service';
import { AuthVersionService } from './auth-version.service';

describe('AuthVersionService', () => {
  let service: AuthVersionService;

  const mockUserRepository = {
    findOne: jest.fn(),
    increment: jest.fn(),
    exists: jest.fn(),
  };

  const mockUserRoleRepository = {
    find: jest.fn(),
  };

  const mockTraceIdService = {
    traceId: 'test-trace-id',
  };

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthVersionService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: mockUserRoleRepository,
        },
        {
          provide: TraceIdService,
          useValue: mockTraceIdService,
        },
      ],
    }).compile();

    service = module.get<AuthVersionService>(AuthVersionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAuthVersion', () => {
    it('should return auth version from database', async () => {
      mockUserRepository.findOne.mockResolvedValue({ authVersion: 5 });

      const version = await service.getAuthVersion(123);
      
      expect(version).toBe(5);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 123 },
        select: ['authVersion'],
      });
    });

    it('should return default version 1 when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const version = await service.getAuthVersion(123);
      
      expect(version).toBe(1);
    });

    it('should return default version 1 on error', async () => {
      mockUserRepository.findOne.mockRejectedValue(new Error('Database error'));

      const version = await service.getAuthVersion(123);
      
      expect(version).toBe(1);
    });
  });

  describe('incrementAuthVersion', () => {
    it('should increment auth version successfully', async () => {
      mockUserRepository.exists.mockResolvedValue(true);
      mockUserRepository.increment.mockResolvedValue({ affected: 1 });
      mockUserRepository.findOne.mockResolvedValue({ authVersion: 2 });

      const newVersion = await service.incrementAuthVersion(123, 'Role added');
      
      expect(newVersion).toBe(2);
      expect(mockUserRepository.exists).toHaveBeenCalledWith({
        where: { userId: 123 },
      });
      expect(mockUserRepository.increment).toHaveBeenCalledWith(
        { userId: 123 },
        'authVersion',
        1
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepository.exists.mockResolvedValue(false);

      await expect(service.incrementAuthVersion(999, 'Test')).rejects.toThrow(
        new NotFoundException('User not found with id: 999')
      );
    });

    it('should throw NotFoundException when increment affects no rows', async () => {
      mockUserRepository.exists.mockResolvedValue(true);
      mockUserRepository.increment.mockResolvedValue({ affected: 0 });

      await expect(service.incrementAuthVersion(123, 'Test')).rejects.toThrow(
        new NotFoundException('User not found: 123')
      );
    });
  });

  describe('incrementAuthVersionBulk', () => {
    it('should increment auth version for multiple users', async () => {
      const userIds = [123, 124, 125];
      mockUserRepository.increment.mockResolvedValue({ affected: 3 });

      await service.incrementAuthVersionBulk(userIds, 'Bulk update');

      expect(mockUserRepository.increment).toHaveBeenCalledWith(
        { userId: { $in: userIds } },
        'authVersion',
        1
      );
    });

    it('should handle empty user array gracefully', async () => {
      await service.incrementAuthVersionBulk([], 'Empty update');

      expect(mockUserRepository.increment).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const userIds = [123, 124];
      mockUserRepository.increment.mockRejectedValue(new Error('Database error'));

      await expect(service.incrementAuthVersionBulk(userIds, 'Test')).rejects.toThrow('Database error');
    });
  });

  describe('getUsersByRole', () => {
    it('should return user IDs for given role', async () => {
      mockUserRoleRepository.find.mockResolvedValue([
        { userId: 123 },
        { userId: 124 },
        { userId: 125 },
      ]);

      const userIds = await service.getUsersByRole(456);

      expect(userIds).toEqual([123, 124, 125]);
      expect(mockUserRoleRepository.find).toHaveBeenCalledWith({
        where: { roleId: 456 },
        select: ['userId'],
      });
    });

    it('should return empty array when no users found', async () => {
      mockUserRoleRepository.find.mockResolvedValue([]);

      const userIds = await service.getUsersByRole(999);

      expect(userIds).toEqual([]);
    });

    it('should return empty array on error', async () => {
      mockUserRoleRepository.find.mockRejectedValue(new Error('Database error'));

      const userIds = await service.getUsersByRole(456);

      expect(userIds).toEqual([]);
    });
  });

  describe('handleUserRoleChange', () => {
    it('should handle user role added', async () => {
      jest.spyOn(service, 'incrementAuthVersion').mockResolvedValue(2);

      await service.handleUserRoleChange(123, 'added', 456);

      expect(service.incrementAuthVersion).toHaveBeenCalledWith(
        123,
        'User role added: roleId=456'
      );
    });

    it('should handle user role removed', async () => {
      jest.spyOn(service, 'incrementAuthVersion').mockResolvedValue(3);

      await service.handleUserRoleChange(123, 'removed', 456);

      expect(service.incrementAuthVersion).toHaveBeenCalledWith(
        123,
        'User role removed: roleId=456'
      );
    });
  });

  describe('handleRolePermissionChange', () => {
    it('should handle role permission added with users', async () => {
      jest.spyOn(service, 'getUsersByRole').mockResolvedValue([123, 124]);
      jest.spyOn(service, 'incrementAuthVersionBulk').mockResolvedValue();

      await service.handleRolePermissionChange(456, 'added', 789);

      expect(service.getUsersByRole).toHaveBeenCalledWith(456);
      expect(service.incrementAuthVersionBulk).toHaveBeenCalledWith(
        [123, 124],
        'Role permission added: roleId=456, permissionId=789'
      );
    });

    it('should handle role permission removed', async () => {
      jest.spyOn(service, 'getUsersByRole').mockResolvedValue([123]);
      jest.spyOn(service, 'incrementAuthVersionBulk').mockResolvedValue();

      await service.handleRolePermissionChange(456, 'removed', 789);

      expect(service.incrementAuthVersionBulk).toHaveBeenCalledWith(
        [123],
        'Role permission removed: roleId=456, permissionId=789'
      );
    });

    it('should handle role permission change without permission ID', async () => {
      jest.spyOn(service, 'getUsersByRole').mockResolvedValue([123, 124]);
      jest.spyOn(service, 'incrementAuthVersionBulk').mockResolvedValue();

      await service.handleRolePermissionChange(456, 'added');

      expect(service.incrementAuthVersionBulk).toHaveBeenCalledWith(
        [123, 124],
        'Role permission added: roleId=456, permissionId=undefined'
      );
    });

    it('should not call bulk increment when no users found', async () => {
      jest.spyOn(service, 'getUsersByRole').mockResolvedValue([]);
      jest.spyOn(service, 'incrementAuthVersionBulk').mockResolvedValue();

      await service.handleRolePermissionChange(999, 'added', 789);

      expect(service.getUsersByRole).toHaveBeenCalledWith(999);
      expect(service.incrementAuthVersionBulk).not.toHaveBeenCalled();
    });
  });
});