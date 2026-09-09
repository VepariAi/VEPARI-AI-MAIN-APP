// Government scheme matching — PROMPT 141.
// Matches MSME businesses to relevant central/state government schemes
// based on business profile (type, size, sector, location).
// Scheme data is static; integration with external APIs is out of scope
// for this prompt but the interface is designed to support it.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ── Scheme catalogue ─────────────────────────────────────────────────────────

export interface GovernmentScheme {
  id: string;
  name: string;
  authority: 'central' | 'state';
  category: 'finance' | 'technology' | 'training' | 'market' | 'infrastructure' | 'subsidy';
  description: string;
  eligibilityCriteria: SchemeEligibility;
  benefits: string;
  applicationUrl?: string;
}

export interface SchemeEligibility {
  businessTypes?: string[];       // e.g. ['RETAIL', 'MANUFACTURING', 'FOOD']
  minAnnualTurnoverPaise?: number; // minimum turnover in paise
  maxAnnualTurnoverPaise?: number; // maximum turnover (MSME cap) in paise
  registrationRequired?: boolean;  // requires MSME/Udyam registration
  sectorKeywords?: string[];       // keywords matching business type/name
}

export interface SchemeMatch {
  scheme: GovernmentScheme;
  matchScore: number;  // 0-100
  matchReasons: string[];
}

// Static scheme catalogue — key central government MSME schemes
const SCHEME_CATALOGUE: GovernmentScheme[] = [
  {
    id: 'pmegp',
    name: 'PMEGP (Prime Minister\'s Employment Generation Programme)',
    authority: 'central',
    category: 'finance',
    description: 'Credit-linked subsidy for new micro enterprises. Provides margin money subsidy up to 35% in rural areas.',
    eligibilityCriteria: {
      maxAnnualTurnoverPaise: 100_00_00000, // ₹1 crore
    },
    benefits: 'Margin money subsidy of 15-35% of project cost',
    applicationUrl: 'https://www.kviconline.gov.in',
  },
  {
    id: 'mudra_shishu',
    name: 'PM Mudra Yojana — Shishu',
    authority: 'central',
    category: 'finance',
    description: 'Collateral-free loans up to ₹50,000 for micro businesses.',
    eligibilityCriteria: {
      maxAnnualTurnoverPaise: 50_00_00000, // ₹50 lakh
    },
    benefits: 'Loans up to ₹50,000 without collateral',
  },
  {
    id: 'mudra_kishor',
    name: 'PM Mudra Yojana — Kishor',
    authority: 'central',
    category: 'finance',
    description: 'Loans from ₹50,001 to ₹5 lakh for expanding micro/small businesses.',
    eligibilityCriteria: {
      minAnnualTurnoverPaise: 50_00000,     // ₹50,000
      maxAnnualTurnoverPaise: 500_00_00000, // ₹5 crore
    },
    benefits: 'Loans from ₹50,001 to ₹5 lakh',
  },
  {
    id: 'cgtmse',
    name: 'CGTMSE (Credit Guarantee Fund Trust for MSEs)',
    authority: 'central',
    category: 'finance',
    description: 'Credit guarantee cover for collateral-free loans to MSEs from banks.',
    eligibilityCriteria: {
      maxAnnualTurnoverPaise: 2500_00_00000, // ₹25 crore
      registrationRequired: true,
    },
    benefits: 'Credit guarantee up to ₹2 crore without collateral',
  },
  {
    id: 'clcss',
    name: 'CLCSS (Credit Linked Capital Subsidy Scheme)',
    authority: 'central',
    category: 'technology',
    description: '15% capital subsidy on institutional credit for technology upgradation.',
    eligibilityCriteria: {
      businessTypes: ['MANUFACTURING'],
      maxAnnualTurnoverPaise: 1000_00_00000, // ₹10 crore
      registrationRequired: true,
    },
    benefits: '15% capital subsidy on loans up to ₹1 crore for tech upgrade',
  },
  {
    id: 'nsic_marketing',
    name: 'NSIC Marketing Support',
    authority: 'central',
    category: 'market',
    description: 'Marketing assistance for MSMEs to participate in domestic/international trade fairs.',
    eligibilityCriteria: {
      registrationRequired: true,
    },
    benefits: 'Subsidized participation in trade fairs, tender marketing support',
  },
  {
    id: 'msme_sampark',
    name: 'MSME Sampark (Skill Development)',
    authority: 'central',
    category: 'training',
    description: 'Free skill development and entrepreneurship training for MSME owners and workers.',
    eligibilityCriteria: {},
    benefits: 'Free training in entrepreneurship, digital payments, GST compliance',
  },
  {
    id: 'gem_portal',
    name: 'GeM (Government e-Marketplace)',
    authority: 'central',
    category: 'market',
    description: 'Online marketplace for selling goods/services to government departments.',
    eligibilityCriteria: {
      registrationRequired: true,
    },
    benefits: 'Direct access to government procurement orders; preference for MSMEs',
  },
];

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class SchemeMatchingService {
  constructor(private readonly prisma: PrismaService) {}

  async matchSchemesForBusiness(businessId: string): Promise<SchemeMatch[]> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { type: true, name: true },
    });
    if (!business) return [];

    const [salesAgg] = await Promise.all([
      this.prisma.saleOrder.aggregate({
        where: { businessId },
        _sum: { totalInPaise: true },
      }),
    ]);

    const annualTurnoverPaise = salesAgg._sum.totalInPaise ?? 0;
    const profile = {
      businessType: business.type,
      businessName: business.name,
      annualTurnoverPaise,
    };

    return SCHEME_CATALOGUE
      .map(scheme => this.scoreScheme(scheme, profile))
      .filter(m => m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  private scoreScheme(
    scheme: GovernmentScheme,
    profile: { businessType: string; businessName: string; annualTurnoverPaise: number },
  ): SchemeMatch {
    const reasons: string[] = [];
    let score = 30; // base score — all MSMEs broadly eligible

    const crit = scheme.eligibilityCriteria;

    // Turnover checks
    if (crit.minAnnualTurnoverPaise !== undefined && profile.annualTurnoverPaise < crit.minAnnualTurnoverPaise) {
      return { scheme, matchScore: 0, matchReasons: [] };
    }
    if (crit.maxAnnualTurnoverPaise !== undefined && profile.annualTurnoverPaise > crit.maxAnnualTurnoverPaise) {
      return { scheme, matchScore: 0, matchReasons: [] };
    }
    if (crit.maxAnnualTurnoverPaise !== undefined) {
      reasons.push('Turnover within eligibility limit');
      score += 20;
    }

    // Business type match
    if (crit.businessTypes && crit.businessTypes.length > 0) {
      if (crit.businessTypes.includes(profile.businessType)) {
        reasons.push(`Business type "${profile.businessType}" matches`);
        score += 25;
      } else {
        return { scheme, matchScore: 0, matchReasons: [] };
      }
    }

    // Sector keyword match
    if (crit.sectorKeywords && crit.sectorKeywords.length > 0) {
      const nameUpper = (profile.businessName + ' ' + profile.businessType).toUpperCase();
      const matched = crit.sectorKeywords.filter(kw => nameUpper.includes(kw.toUpperCase()));
      if (matched.length > 0) {
        reasons.push(`Sector match: ${matched.join(', ')}`);
        score += 15;
      }
    }

    // Category bonus for financial schemes when turnover is low
    if (scheme.category === 'finance' && profile.annualTurnoverPaise < 50_00_00000) {
      reasons.push('Small business likely needs financing support');
      score += 10;
    }

    reasons.push(scheme.benefits);

    return { scheme, matchScore: Math.min(100, score), matchReasons: reasons };
  }

  /** Return the full static catalogue. */
  getCatalogue(): GovernmentScheme[] {
    return SCHEME_CATALOGUE;
  }
}
