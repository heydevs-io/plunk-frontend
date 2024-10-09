import { prisma } from '../database/prisma';
import { Keys } from './keys';
import { wrapRedis } from './redis';

export class CampaignService {
  public static id(id: string) {
    return wrapRedis(Keys.Campaign.id(id), async () => {
      return prisma.campaign.findUnique({
        where: { id },
        include: {
          recipients: { select: { id: true } },
          emails: {
            select: {
              id: true,
              status: true,
              contact: { select: { id: true, email: true } },
            },
          },
        },
      });
    });
  }

  public static idV2(id: string) {
    return wrapRedis(Keys.Campaign.id(id), async () => {
      return prisma.campaign.findUnique({
        where: { id },
        include: {
          recipients: { select: { id: true } },
        },
      });
    });
  }

  public static async emailsV2(
    id: string, 
    page: number = 1, 
    pageSize: number = 10,
    status?: string,
    keywords?: string
  ) {
    const offset = (page - 1) * pageSize;

    const whereClause: any = { campaignId: id };

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    if (keywords) {
      whereClause.contact = {
        email: {
          contains: keywords,
          mode: 'insensitive'
        }
      };
    }

    const [emails, totalCount] = await Promise.all([
      prisma.email.findMany({
        where: whereClause,
        select: {
          id: true,
          status: true,
          contact: { select: { id: true, email: true } },
        },
        skip: offset,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.email.count({ where: whereClause }),
    ]);

    return {
      emails,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }
}
