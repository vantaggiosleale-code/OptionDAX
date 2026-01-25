import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  getPendingApprovals,
  approveUser,
  rejectUser,
  getPendingApprovalsCount,
  getApprovalRequestByUserId,
} from "../db";
import { sendEmail, getNewRegistrationEmailTemplate, getApprovedEmailTemplate, getRejectedEmailTemplate } from "../_core/email";
import { notifyOwner } from "../_core/notification";
import { TRPCError } from "@trpc/server";

export const approvalsRouter = router({
  /**
   * Get all pending approval requests (admin only)
   */
  getPending: adminProcedure.query(async () => {
    try {
      const pending = await getPendingApprovals();
      return pending.map((row) => ({
        id: row.approval_requests.id,
        userId: row.approval_requests.userId,
        status: row.approval_requests.status,
        userName: row.users.name || "Unknown",
        userEmail: row.users.email || "Unknown",
        createdAt: row.approval_requests.createdAt,
      }));
    } catch (error) {
      console.error("[Approvals] Error fetching pending approvals:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch pending approvals",
      });
    }
  }),

  /**
   * Get count of pending approvals (admin only)
   */
  getPendingCount: adminProcedure.query(async () => {
    try {
      return await getPendingApprovalsCount();
    } catch (error) {
      console.error("[Approvals] Error fetching pending count:", error);
      return 0;
    }
  }),

  /**
   * Approve a user account (admin only)
   */
  approve: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { userId } = input;
        const adminId = ctx.user.id;

        // Approve the user
        await approveUser(userId, adminId);

        // Get user details for email
        const approval = await getApprovalRequestByUserId(userId);
        if (!approval) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Approval request not found",
          });
        }

        // Send email to user
        const loginUrl = `${process.env.VITE_OAUTH_PORTAL_URL || "https://option-dax.manus.space"}`;
        const userEmail = approval.users?.email;
        const userName = approval.users?.name || "User";

        if (userEmail) {
          const emailHtml = getApprovedEmailTemplate(userName, loginUrl);
          await sendEmail({
            to: userEmail,
            subject: "✅ La tua iscrizione a Option DAX è stata approvata!",
            html: emailHtml,
          });
        }

        // Notify admin
        await notifyOwner({
          title: "Account Approvato",
          content: `L'account di ${userName} (${userEmail}) è stato approvato.`,
        });

        return { success: true, message: "User approved successfully" };
      } catch (error) {
        console.error("[Approvals] Error approving user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to approve user",
        });
      }
    }),

  /**
   * Reject a user account (admin only)
   */
  reject: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        rejectionReason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { userId, rejectionReason } = input;
        const adminId = ctx.user.id;

        // Reject the user
        await rejectUser(userId, adminId, rejectionReason);

        // Get user details for email
        const approval = await getApprovalRequestByUserId(userId);
        if (!approval) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Approval request not found",
          });
        }

        // Send email to user
        const userEmail = approval.users?.email;
        const userName = approval.users?.name || "User";

        if (userEmail) {
          const emailHtml = getRejectedEmailTemplate(userName, rejectionReason);
          await sendEmail({
            to: userEmail,
            subject: "❌ La tua richiesta di iscrizione a Option DAX è stata rifiutata",
            html: emailHtml,
          });
        }

        // Notify admin
        await notifyOwner({
          title: "Account Rifiutato",
          content: `L'account di ${userName} (${userEmail}) è stato rifiutato. Motivo: ${rejectionReason || "Non specificato"}`,
        });

        return { success: true, message: "User rejected successfully" };
      } catch (error) {
        console.error("[Approvals] Error rejecting user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reject user",
        });
      }
    }),
});
