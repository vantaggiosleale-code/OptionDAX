import { describe, it, expect, beforeEach, vi } from 'vitest';
import { approvalsRouter } from './approvals';
import * as db from '../db';
import * as email from '../_core/email';
import * as notification from '../_core/notification';

// Mock dependencies
vi.mock('../db');
vi.mock('../_core/email');
vi.mock('../_core/notification');

describe('approvalsRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPending', () => {
    it('should return list of pending approvals', async () => {
      const mockPending = [
        {
          approval_requests: {
            id: 1,
            userId: 1,
            status: 'pending',
            createdAt: new Date(),
          },
          users: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      ];

      vi.mocked(db.getPendingApprovals).mockResolvedValue(mockPending as any);

      const caller = approvalsRouter.createCaller({
        user: { id: 1, role: 'admin' },
      } as any);

      const result = await caller.getPending();

      expect(result).toHaveLength(1);
      expect(result[0].userName).toBe('Test User');
      expect(result[0].userEmail).toBe('test@example.com');
    });
  });

  describe('getPendingCount', () => {
    it('should return count of pending approvals', async () => {
      vi.mocked(db.getPendingApprovalsCount).mockResolvedValue(3);

      const caller = approvalsRouter.createCaller({
        user: { id: 1, role: 'admin' },
      } as any);

      const result = await caller.getPendingCount();

      expect(result).toBe(3);
    });
  });

  describe('approve', () => {
    it('should approve user and send email', async () => {
      const mockApproval = {
        approval_requests: {
          id: 1,
          userId: 1,
          status: 'pending',
        },
        users: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      vi.mocked(db.approveUser).mockResolvedValue({} as any);
      vi.mocked(db.getApprovalRequestByUserId).mockResolvedValue(mockApproval as any);
      vi.mocked(email.sendEmail).mockResolvedValue(true);
      vi.mocked(notification.notifyOwner).mockResolvedValue(true);

      const caller = approvalsRouter.createCaller({
        user: { id: 1, role: 'admin' },
      } as any);

      const result = await caller.approve({ userId: 1 });

      expect(result.success).toBe(true);
      expect(db.approveUser).toHaveBeenCalledWith(1, 1);
      expect(email.sendEmail).toHaveBeenCalled();
      expect(notification.notifyOwner).toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('should reject user and send email', async () => {
      const mockApproval = {
        approval_requests: {
          id: 1,
          userId: 1,
          status: 'pending',
        },
        users: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      vi.mocked(db.rejectUser).mockResolvedValue({} as any);
      vi.mocked(db.getApprovalRequestByUserId).mockResolvedValue(mockApproval as any);
      vi.mocked(email.sendEmail).mockResolvedValue(true);
      vi.mocked(notification.notifyOwner).mockResolvedValue(true);

      const caller = approvalsRouter.createCaller({
        user: { id: 1, role: 'admin' },
      } as any);

      const result = await caller.reject({
        userId: 1,
        rejectionReason: 'Test reason',
      });

      expect(result.success).toBe(true);
      expect(db.rejectUser).toHaveBeenCalledWith(1, 1, 'Test reason');
      expect(email.sendEmail).toHaveBeenCalled();
      expect(notification.notifyOwner).toHaveBeenCalled();
    });
  });
});
