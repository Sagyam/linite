import { db } from '@/db';
import { installations } from '@/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import type {
  Installation,
  InstallationWithRelations,
  CreateInstallationRequest,
  UpdateInstallationRequest,
  GetInstallationsParams,
} from '@/types';

export class InstallationHistoryService {
  /**
   * Get all installations for a user with optional filtering
   */
  static async getUserInstallations(
    userId: string,
    params: GetInstallationsParams = {}
  ): Promise<InstallationWithRelations[]> {
    const { deviceIdentifier, appId, distroId, limit = 100, offset = 0 } = params;

    const conditions = [eq(installations.userId, userId)];

    if (deviceIdentifier) {
      conditions.push(eq(installations.deviceIdentifier, deviceIdentifier));
    }

    if (appId) {
      conditions.push(eq(installations.appId, appId));
    }

    if (distroId) {
      conditions.push(eq(installations.distroId, distroId));
    }

    const results = await db.query.installations.findMany({
      where: and(...conditions),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        app: {
          columns: {
            id: true,
            displayName: true,
            slug: true,
            iconUrl: true,
          },
        },
        package: {
          columns: {
            id: true,
            identifier: true,
            version: true,
          },
          with: {
            source: {
              columns: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        distro: {
          columns: {
            id: true,
            name: true,
            slug: true,
            iconUrl: true,
          },
        },
      },
      limit,
      offset,
      orderBy: [desc(installations.installedAt)],
    });

    return results as InstallationWithRelations[];
  }

  /**
   * Get installation by ID (with user ownership check)
   */
  static async getInstallationById(
    installationId: string,
    userId: string
  ): Promise<InstallationWithRelations | null> {
    const result = await db.query.installations.findFirst({
      where: and(
        eq(installations.id, installationId),
        eq(installations.userId, userId)
      ),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        app: {
          columns: {
            id: true,
            displayName: true,
            slug: true,
            iconUrl: true,
          },
        },
        package: {
          columns: {
            id: true,
            identifier: true,
            version: true,
          },
          with: {
            source: {
              columns: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        distro: {
          columns: {
            id: true,
            name: true,
            slug: true,
            iconUrl: true,
          },
        },
      },
    });

    return (result as InstallationWithRelations) || null;
  }

  /**
   * Create a new installation record
   */
  static async createInstallation(
    userId: string,
    data: CreateInstallationRequest
  ): Promise<Installation> {
    const newInstallation = await db
      .insert(installations)
      .values({
        userId,
        appId: data.appId,
        packageId: data.packageId,
        distroId: data.distroId,
        deviceIdentifier: data.deviceIdentifier,
        notes: data.notes || null,
      })
      .returning()
      .then((rows) => rows[0]);

    return newInstallation as Installation;
  }

  /**
   * Update an installation record (with user ownership check)
   */
  static async updateInstallation(
    installationId: string,
    userId: string,
    data: UpdateInstallationRequest
  ): Promise<Installation> {
    // Verify ownership
    const existing = await this.getInstallationById(installationId, userId);
    if (!existing) {
      throw new Error('Installation not found or access denied');
    }

    const updated = await db
      .update(installations)
      .set({
        deviceIdentifier: data.deviceIdentifier,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(installations.id, installationId),
          eq(installations.userId, userId)
        )
      )
      .returning()
      .then((rows) => rows[0]);

    return updated as Installation;
  }

  /**
   * Delete an installation record (with user ownership check)
   */
  static async deleteInstallation(
    installationId: string,
    userId: string
  ): Promise<void> {
    // Verify ownership
    const existing = await this.getInstallationById(installationId, userId);
    if (!existing) {
      throw new Error('Installation not found or access denied');
    }

    await db
      .delete(installations)
      .where(
        and(
          eq(installations.id, installationId),
          eq(installations.userId, userId)
        )
      );
  }

  /**
   * Bulk delete installation records (with user ownership check for all)
   */
  static async bulkDeleteInstallations(
    installationIds: string[],
    userId: string
  ): Promise<void> {
    // Verify ownership of all installations
    const foundInstallations = await db.query.installations.findMany({
      where: inArray(installations.id, installationIds),
      columns: {
        id: true,
        userId: true,
      },
    });

    // Check that all requested installations exist and belong to the user
    if (foundInstallations.length !== installationIds.length) {
      throw new Error('Some installations not found or access denied');
    }

    const allOwnedByUser = foundInstallations.every(
      (installation) => installation.userId === userId
    );

    if (!allOwnedByUser) {
      throw new Error('Some installations not found or access denied');
    }

    // Delete all installations in a single transaction
    await db
      .delete(installations)
      .where(
        and(
          inArray(installations.id, installationIds),
          eq(installations.userId, userId)
        )
      );
  }

  /**
   * Get unique devices for a user
   */
  static async getUserDevices(userId: string): Promise<string[]> {
    const results = await db
      .selectDistinct({ deviceIdentifier: installations.deviceIdentifier })
      .from(installations)
      .where(eq(installations.userId, userId));

    return results.map((r) => r.deviceIdentifier);
  }
}
