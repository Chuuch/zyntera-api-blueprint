import { describe, expect, it, vi } from 'vitest';
import { type UserRepository } from '../repositories/user.repository.js';
import { createAuthService } from './user.service.js';

describe('AuthService Unit Tests', () => {
    it('should return a user when searching by email', async () => {
        const mockRepo: UserRepository = {
            findById: vi.fn(),
            create: vi.fn(),
            findByEmail: vi.fn(async (email: string) => ({
                id: 'uuid-123',
                email: email,
                name: 'John Wick',
                emailVerified: true,
                image: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                role: 'user' as const,
            })),
        };

        const authService = createAuthService(mockRepo);
        const user = await authService.getUserByEmail('john.wick@example.com');

        expect(user).toBeDefined();
        expect(user?.email).toBe('john.wick@example.com');
        expect(user?.id).toBe('uuid-123');
    });

    it('should return null if user repository finds nothing', async () => {
        const mockRepo: UserRepository = {
            findById: vi.fn(),
            create: vi.fn(),
            findByEmail: vi.fn(async () => null), // Simulate no user found
        };

        const authServce = createAuthService(mockRepo);
        const user = await authServce.getUserByEmail('nonexistent@example.com');

        expect(mockRepo.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
        expect(user).toBeNull();
    });

    it('should create a user successfully', async () => {
        const userPayload = {
            id: 'uuid-456',
            email: 'newuser@example.com',
            name: 'New User',
            emailVerified: false,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            role: 'user' as const,
        };
        
        const mockRepo: UserRepository = {
            findById: vi.fn(),
            create: vi.fn().mockResolvedValue(userPayload),
            findByEmail: vi.fn(async () => null),
        };
        
        const authService = createAuthService(mockRepo);
        const newUser = await authService.createUser(userPayload);

        expect(newUser).toBeDefined();
        expect(newUser?.email).toBe('newuser@example.com');
        expect(newUser?.id).toBe('uuid-456');
        expect(mockRepo.create).toHaveBeenCalledWith({
            id: 'uuid-456',
            email: 'newuser@example.com',
            name: 'New User',
            emailVerified: false,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            role: 'user' as const,
        });
    });
});