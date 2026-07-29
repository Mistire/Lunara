import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, sql, ilike, or } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { icd10Codes } from '../../database/schema/icd10';

@Injectable()
export class Icd10Service {
  constructor(private databaseService: DatabaseService) {}

  async search(query: string, limit: number = 20) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const cleanQuery = query.trim();

    try {
      // Use PostgreSQL full-text search websearch_to_tsquery for natural query search
      const ftsResults = await this.databaseService.db
        .select({
          id: icd10Codes.id,
          code: icd10Codes.code,
          description: icd10Codes.description,
          category: icd10Codes.category,
        })
        .from(icd10Codes)
        .where(
          sql`${icd10Codes.searchVector} @@ websearch_to_tsquery('english', ${cleanQuery})`,
        )
        .limit(limit);

      if (ftsResults.length > 0) {
        return ftsResults;
      }
    } catch {
      // Fall back to ILIKE if search vector query fails
    }

    // Fallback ILIKE search (for code or description)
    return this.databaseService.db
      .select({
        id: icd10Codes.id,
        code: icd10Codes.code,
        description: icd10Codes.description,
        category: icd10Codes.category,
      })
      .from(icd10Codes)
      .where(
        or(
          ilike(icd10Codes.code, `${cleanQuery}%`),
          ilike(icd10Codes.description, `%${cleanQuery}%`),
        ),
      )
      .limit(limit);
  }

  async findByCode(code: string) {
    const results = await this.databaseService.db
      .select()
      .from(icd10Codes)
      .where(eq(icd10Codes.code, code.toUpperCase().trim()))
      .limit(1);

    if (results.length === 0) {
      throw new NotFoundException(`ICD-10 code '${code}' not found`);
    }

    return results[0];
  }
}
