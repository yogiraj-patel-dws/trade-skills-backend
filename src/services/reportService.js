const prisma = require('../config/database');

class ReportService {
  async createReport(reporterId, reportData) {
    const { type, reason, description, reportedUserId, sessionId } = reportData;
    
    return await prisma.report.create({
      data: {
        reporterId,
        reportedUserId,
        sessionId,
        type,
        reason,
        description,
        status: 'PENDING'
      },
      include: {
        reporter: {
          select: {
            profile: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    });
  }

  async getUserReports(userId, filters = {}) {
    const { status, type, limit = 20, offset = 0 } = filters;
    
    const where = { reporterId: userId };
    if (status) where.status = status;
    if (type) where.type = type;

    return await prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
  }

  async getReportById(reportId) {
    return await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: {
            profile: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    });
  }

  async updateReportStatus(reportId, status, resolvedBy = null) {
    const updateData = { status };
    if (resolvedBy) {
      updateData.resolvedBy = resolvedBy;
      updateData.resolvedAt = new Date();
    }

    return await prisma.report.update({
      where: { id: reportId },
      data: updateData
    });
  }
}

module.exports = new ReportService();