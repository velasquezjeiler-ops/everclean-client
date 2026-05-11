'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { notifyBookingEvent } from '../../../lib/notifications';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://commercial-clean-setup.replit.app/api';

const C = {
  navy: '#0D3781',
  navyDark: '#081f4a',
  blue: '#1565C0',
  green: '#4CAF50',
  greenDk: '#388E3C',
  canvas: '#FFFFFF',
  soft: '#F5F7FA',
  ink: '#0D1B2A',
  muted: '#64748B',
  border: '#E2E8F0',
  shadow: '0 2px 8px rgba(13,55,129,0.06)',
  bg: '#F5F7FA',
  text: '#0D1B2A',
  warning: '#F59E0B',
  danger: '#DC2626',
};

const R = { sm: '8px', md: '14px', lg: '20px', full: '9999px' };

type ServicePricing = {
  sqftRate: number;
  minimum: number;
  restroomFee?: number;
  breakroomFee?: number;
  suppliesFee?: number;
  marketLabel: string;
  pricingNote: string;
};

type StatePricingInput = {
  marketLabel: string;
  pricingNote: string;
  house: number;
  houseMin: number;
  deep: number;
  deepMin: number;
  move: number;
  moveMin: number;
  same: number;
  sameMin: number;
  office: number;
  officeMin: number;
  restroom: number;
  breakroom: number;
  supplies: number;
  post: number;
  postMin: number;
  postRestroom: number;
  postSupplies: number;
  medical: number;
  medicalMin: number;
  medicalRestroom: number;
  medicalSupplies: number;
};

type PriceCalc = {
  price: number;
  hours: number | null;
  sqftUsed: number | null;
  corrected: boolean;
  addonTotal: number;
  roomSqft?: number;
  effectiveRate: number | null;
  minPrice: number;
  minimumApplied: boolean;
  sqftBase: number;
  sqftCharge?: number;
  restroomCharge?: number;
  breakroomCharge?: number;
  suppliesFee?: number;
  subtotalBeforeMinimum?: number;
  subtotal?: number;
  frequencyFactor?: number;
  restroomCount?: number;
  breakroomCount?: number;
  restroomFee?: number;
  breakroomFee?: number;
  marketLabel?: string;
  pricingNote?: string;
  stateCode?: string;
  serviceType?: string;
  pricingBreakdown?: Record<string, unknown>;
};

const STATE_OPTIONS = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

const CLEANING_SERVICES: Record<string, { label: string; icon: string; commercial: boolean; desc: string }> = {
  HOUSE_CLEANING: { label: 'House Cleaning', icon: 'Home', commercial: false, desc: 'Regular residential cleaning' },
  DEEP_CLEANING: { label: 'Deep Cleaning', icon: 'Deep', commercial: false, desc: 'Detailed top-to-bottom cleaning' },
  MOVE_IN_OUT: { label: 'Move In / Out', icon: 'Move', commercial: false, desc: 'Full property reset' },
  SAME_DAY_CLEANING: { label: 'Same Day', icon: 'Fast', commercial: false, desc: 'Priority same-day visit' },
  OFFICE_CLEANING: { label: 'Office Cleaning', icon: 'Office', commercial: true, desc: 'Workplace cleaning' },
  POST_CONSTRUCTION: { label: 'Post Construction', icon: 'Build', commercial: true, desc: 'After remodel or construction' },
  MEDICAL_CLEANING: { label: 'Medical / Clinical', icon: 'Care', commercial: true, desc: 'Clinical-grade cleaning' },
};

const STATE_PRICING_INPUTS: Record<string, StatePricingInput> = {
  AL: { marketLabel: 'Alabama Value Market', pricingNote: 'Lower-cost market with protective minimums for travel, supplies and booking overhead.', house: 0.12, houseMin: 105, deep: 0.17, deepMin: 135, move: 0.24, moveMin: 175, same: 0.15, sameMin: 120, office: 0.14, officeMin: 145, restroom: 24, breakroom: 20, supplies: 12, post: 0.28, postMin: 240, postRestroom: 38, postSupplies: 28, medical: 0.23, medicalMin: 225, medicalRestroom: 34, medicalSupplies: 25 },
  AK: { marketLabel: 'Alaska Remote Premium Market', pricingNote: 'Remote logistics and labor availability require higher minimums and service rates.', house: 0.19, houseMin: 165, deep: 0.26, deepMin: 210, move: 0.36, moveMin: 290, same: 0.23, sameMin: 200, office: 0.23, officeMin: 230, restroom: 42, breakroom: 34, supplies: 25, post: 0.44, postMin: 390, postRestroom: 58, postSupplies: 55, medical: 0.36, medicalMin: 350, medicalRestroom: 54, medicalSupplies: 45 },
  AZ: { marketLabel: 'Arizona Growth Market', pricingNote: 'Mid-high demand market with strong labor and travel cost variance.', house: 0.14, houseMin: 120, deep: 0.19, deepMin: 155, move: 0.27, moveMin: 210, same: 0.17, sameMin: 140, office: 0.16, officeMin: 165, restroom: 28, breakroom: 22, supplies: 14, post: 0.32, postMin: 275, postRestroom: 42, postSupplies: 32, medical: 0.26, medicalMin: 255, medicalRestroom: 38, medicalSupplies: 28 },
  AR: { marketLabel: 'Arkansas Value Market', pricingNote: 'Lower-cost service market with minimums designed to avoid underpriced small jobs.', house: 0.11, houseMin: 100, deep: 0.16, deepMin: 130, move: 0.23, moveMin: 170, same: 0.14, sameMin: 115, office: 0.13, officeMin: 140, restroom: 23, breakroom: 18, supplies: 12, post: 0.27, postMin: 235, postRestroom: 36, postSupplies: 28, medical: 0.22, medicalMin: 220, medicalRestroom: 33, medicalSupplies: 25 },
  CA: { marketLabel: 'California Premium Market', pricingNote: 'Premium labor, insurance, traffic and cost-of-living market.', house: 0.20, houseMin: 170, deep: 0.27, deepMin: 220, move: 0.38, moveMin: 300, same: 0.24, sameMin: 205, office: 0.24, officeMin: 230, restroom: 42, breakroom: 35, supplies: 25, post: 0.46, postMin: 400, postRestroom: 60, postSupplies: 55, medical: 0.37, medicalMin: 355, medicalRestroom: 55, medicalSupplies: 45 },
  CO: { marketLabel: 'Colorado High-Demand Market', pricingNote: 'High-demand urban and suburban service market with elevated labor cost.', house: 0.16, houseMin: 135, deep: 0.22, deepMin: 175, move: 0.31, moveMin: 235, same: 0.19, sameMin: 160, office: 0.19, officeMin: 185, restroom: 32, breakroom: 27, supplies: 18, post: 0.36, postMin: 315, postRestroom: 48, postSupplies: 38, medical: 0.30, medicalMin: 295, medicalRestroom: 44, medicalSupplies: 34 },
  CT: { marketLabel: 'Connecticut Premium Northeast Market', pricingNote: 'Premium Northeast labor and travel cost market.', house: 0.18, houseMin: 150, deep: 0.24, deepMin: 195, move: 0.34, moveMin: 255, same: 0.22, sameMin: 180, office: 0.21, officeMin: 205, restroom: 36, breakroom: 30, supplies: 20, post: 0.40, postMin: 345, postRestroom: 52, postSupplies: 42, medical: 0.33, medicalMin: 320, medicalRestroom: 48, medicalSupplies: 38 },
  DC: { marketLabel: 'Washington DC Premium Metro Market', pricingNote: 'Dense premium metro market with parking, access and labor constraints.', house: 0.20, houseMin: 170, deep: 0.27, deepMin: 220, move: 0.38, moveMin: 300, same: 0.24, sameMin: 205, office: 0.24, officeMin: 230, restroom: 42, breakroom: 35, supplies: 25, post: 0.46, postMin: 400, postRestroom: 60, postSupplies: 55, medical: 0.37, medicalMin: 355, medicalRestroom: 55, medicalSupplies: 45 },
  DE: { marketLabel: 'Delaware Mid-Atlantic Market', pricingNote: 'Mid-Atlantic market with moderate labor and travel cost.', house: 0.15, houseMin: 125, deep: 0.20, deepMin: 165, move: 0.29, moveMin: 225, same: 0.18, sameMin: 150, office: 0.17, officeMin: 175, restroom: 30, breakroom: 25, supplies: 15, post: 0.34, postMin: 295, postRestroom: 45, postSupplies: 35, medical: 0.28, medicalMin: 275, medicalRestroom: 40, medicalSupplies: 30 },
  FL: { marketLabel: 'Florida Competitive Growth Market', pricingNote: 'Competitive but high-volume market; small jobs still require service minimum protection.', house: 0.14, houseMin: 120, deep: 0.19, deepMin: 155, move: 0.27, moveMin: 210, same: 0.17, sameMin: 140, office: 0.16, officeMin: 165, restroom: 28, breakroom: 22, supplies: 14, post: 0.32, postMin: 275, postRestroom: 42, postSupplies: 32, medical: 0.26, medicalMin: 255, medicalRestroom: 38, medicalSupplies: 28 },
  GA: { marketLabel: 'Georgia Core Market', pricingNote: 'Core southeast market with balanced rate and minimum structure.', house: 0.13, houseMin: 115, deep: 0.18, deepMin: 145, move: 0.25, moveMin: 195, same: 0.16, sameMin: 130, office: 0.15, officeMin: 155, restroom: 26, breakroom: 21, supplies: 13, post: 0.30, postMin: 260, postRestroom: 40, postSupplies: 30, medical: 0.24, medicalMin: 240, medicalRestroom: 36, medicalSupplies: 26 },
  HI: { marketLabel: 'Hawaii Premium Logistics Market', pricingNote: 'Island logistics, supplies and labor availability require premium minimums.', house: 0.21, houseMin: 180, deep: 0.29, deepMin: 235, move: 0.40, moveMin: 320, same: 0.25, sameMin: 215, office: 0.25, officeMin: 245, restroom: 45, breakroom: 38, supplies: 28, post: 0.48, postMin: 420, postRestroom: 62, postSupplies: 58, medical: 0.39, medicalMin: 370, medicalRestroom: 58, medicalSupplies: 48 },
  ID: { marketLabel: 'Idaho Core Market', pricingNote: 'Moderate market with protected small-job minimums.', house: 0.13, houseMin: 115, deep: 0.18, deepMin: 145, move: 0.25, moveMin: 195, same: 0.16, sameMin: 130, office: 0.15, officeMin: 155, restroom: 26, breakroom: 21, supplies: 13, post: 0.30, postMin: 260, postRestroom: 40, postSupplies: 30, medical: 0.24, medicalMin: 240, medicalRestroom: 36, medicalSupplies: 26 },
  IL: { marketLabel: 'Illinois Metro Market', pricingNote: 'Chicago-area demand and operating costs require above-core pricing.', house: 0.16, houseMin: 135, deep: 0.22, deepMin: 175, move: 0.31, moveMin: 235, same: 0.19, sameMin: 160, office: 0.19, officeMin: 185, restroom: 32, breakroom: 27, supplies: 18, post: 0.36, postMin: 315, postRestroom: 48, postSupplies: 38, medical: 0.30, medicalMin: 295, medicalRestroom: 44, medicalSupplies: 34 },
  IN: { marketLabel: 'Indiana Core Market', pricingNote: 'Balanced Midwest pricing with service minimum safeguards.', house: 0.13, houseMin: 115, deep: 0.18, deepMin: 145, move: 0.25, moveMin: 195, same: 0.16, sameMin: 130, office: 0.15, officeMin: 155, restroom: 26, breakroom: 21, supplies: 13, post: 0.30, postMin: 260, postRestroom: 40, postSupplies: 30, medical: 0.24, medicalMin: 240, medicalRestroom: 36, medicalSupplies: 26 },
  IA: { marketLabel: 'Iowa Value-Core Market', pricingNote: 'Value-core market with lower rate but enforced visit minimums.', house: 0.12, houseMin: 105, deep: 0.17, deepMin: 135, move: 0.24, moveMin: 175, same: 0.15, sameMin: 120, office: 0.14, officeMin: 145, restroom: 24, breakroom: 20, supplies: 12, post: 0.28, postMin: 240, postRestroom: 38, postSupplies: 28, medical: 0.23, medicalMin: 225, medicalRestroom: 34, medicalSupplies: 25 },
  KS: { marketLabel: 'Kansas Value-Core Market', pricingNote: 'Value-core market with lower rate but enforced visit minimums.', house: 0.12, houseMin: 105, deep: 0.17, deepMin: 135, move: 0.24, moveMin: 175, same: 0.15, sameMin: 120, office: 0.14, officeMin: 145, restroom: 24, breakroom: 20, supplies: 12, post: 0.28, postMin: 240, postRestroom: 38, postSupplies: 28, medical: 0.23, medicalMin: 225, medicalRestroom: 34, medicalSupplies: 25 },
  KY: { marketLabel: 'Kentucky Value-Core Market', pricingNote: 'Lower-cost market with protective minimums for travel, supplies and booking overhead.', house: 0.12, houseMin: 105, deep: 0.17, deepMin: 135, move: 0.24, moveMin: 175, same: 0.15, sameMin: 120, office: 0.14, officeMin: 145, restroom: 24, breakroom: 20, supplies: 12, post: 0.28, postMin: 240, postRestroom: 38, postSupplies: 28, medical: 0.23, medicalMin: 225, medicalRestroom: 34, medicalSupplies: 25 },
  LA: { marketLabel: 'Louisiana Core Market', pricingNote: 'Core Gulf market with balanced rate and minimum structure.', house: 0.13, houseMin: 115, deep: 0.18, deepMin: 145, move: 0.25, moveMin: 195, same: 0.16, sameMin: 130, office: 0.15, officeMin: 155, restroom: 26, breakroom: 21, supplies: 13, post: 0.30, postMin: 260, postRestroom: 40, postSupplies: 30, medical: 0.24, medicalMin: 240, medicalRestroom: 36, medicalSupplies: 26 },
  ME: { marketLabel: 'Maine Northeast Market', pricingNote: 'Northeast market with seasonal travel and availability considerations.', house: 0.16, houseMin: 135, deep: 0.22, deepMin: 175, move: 0.31, moveMin: 235, same: 0.19, sameMin: 160, office: 0.19, officeMin: 185, restroom: 32, breakroom: 27, supplies: 18, post: 0.36, postMin: 315, postRestroom: 48, postSupplies: 38, medical: 0.30, medicalMin: 295, medicalRestroom: 44, medicalSupplies: 34 },
  MD: { marketLabel: 'Maryland Premium Mid-Atlantic Market', pricingNote: 'Premium Mid-Atlantic market with elevated labor, parking and traffic cost.', house: 0.18, houseMin: 150, deep: 0.24, deepMin: 195, move: 0.34, moveMin: 255, same: 0.22, sameMin: 180, office: 0.21, officeMin: 205, restroom: 36, breakroom: 30, supplies: 20, post: 0.40, postMin: 345, postRestroom: 52, postSupplies: 42, medical: 0.33, medicalMin: 320, medicalRestroom: 48, medicalSupplies: 38 },
  MA: { marketLabel: 'Massachusetts Premium Northeast Market', pricingNote: 'Premium Northeast labor, insurance and cost-of-living market.', house: 0.20, houseMin: 170, deep: 0.27, deepMin: 220, move: 0.38, moveMin: 300, same: 0.24, sameMin: 205, office: 0.24, officeMin: 230, restroom: 42, breakroom: 35, supplies: 25, post: 0.46, postMin: 400, postRestroom: 60, postSupplies: 55, medical: 0.37, medicalMin: 355, medicalRestroom: 55, medicalSupplies: 45 },
  MI: { marketLabel: 'Michigan Core Market', pricingNote: 'Balanced Midwest pricing with stronger metro minimum protection.', house: 0.14, houseMin: 120, deep: 0.19, deepMin: 155, move: 0.27, moveMin: 210, same: 0.17, sameMin: 140, office: 0.16, officeMin: 165, restroom: 28, breakroom: 22, supplies: 14, post: 0.32, postMin: 275, postRestroom: 42, postSupplies: 32, medical: 0.26, medicalMin: 255, medicalRestroom: 38, medicalSupplies: 28 },
  MN: { marketLabel: 'Minnesota High-Core Market', pricingNote: 'Upper Midwest market with elevated labor and winter travel considerations.', house: 0.15, houseMin: 125, deep: 0.20, deepMin: 165, move: 0.29, moveMin: 225, same: 0.18, sameMin: 150, office: 0.17, officeMin: 175, restroom: 30, breakroom: 25, supplies: 15, post: 0.34, postMin: 295, postRestroom: 45, postSupplies: 35, medical: 0.28, medicalMin: 275, medicalRestroom: 40, medicalSupplies: 30 },
  MS: { marketLabel: 'Mississippi Value Market', pricingNote: 'Lower-cost market with protective minimums for travel, supplies and booking overhead.', house: 0.11, houseMin: 100, deep: 0.16, deepMin: 130, move: 0.23, moveMin: 170, same: 0.14, sameMin: 115, office: 0.13, officeMin: 140, restroom: 23, breakroom: 18, supplies: 12, post: 0.27, postMin: 235, postRestroom: 36, postSupplies: 28, medical: 0.22, medicalMin: 220, medicalRestroom: 33, medicalSupplies: 25 },
  MO: { marketLabel: 'Missouri Core Market', pricingNote: 'Balanced Midwest pricing with service minimum safeguards.', house: 0.13, houseMin: 115, deep: 0.18, deepMin: 145, move: 0.25, moveMin: 195, same: 0.16, sameMin: 130, office: 0.15, officeMin: 155, restroom: 26, breakroom: 21, supplies: 13, post: 0.30, postMin: 260, postRestroom: 40, postSupplies: 30, medical: 0.24, medicalMin: 240, medicalRestroom: 36, medicalSupplies: 26 },
  MT: { marketLabel: 'Montana Rural-Core Market', pricingNote: 'Lower density market with travel-sensitive minimums.', house: 0.13, houseMin: 115, deep: 0.18, deepMin: 145, move: 0.25, moveMin: 195, same: 0.16, sameMin: 130, office: 0.15, officeMin: 155, restroom: 26, breakroom: 21, supplies: 13, post: 0.30, postMin: 260, postRestroom: 40, postSupplies: 30, medical: 0.24, medicalMin: 240, medicalRestroom: 36, medicalSupplies: 26 },
  NE: { marketLabel: 'Nebraska Value-Core Market', pricingNote: 'Value-core market with lower rate but enforced visit minimums.', house: 0.12, houseMin: 105, deep: 0.17, deepMin: 135, move: 0.24, moveMin: 175, same: 0.15, sameMin: 120, office: 0.14, officeMin: 145, restroom: 24, breakroom: 20, supplies: 12, post: 0.28, postMin: 240, postRestroom: 38, postSupplies: 28, medical: 0.23, medicalMin: 225, medicalRestroom: 34, medicalSupplies: 25 },
  NV: { marketLabel: 'Nevada High-Demand Market', pricingNote: 'High-demand urban and hospitality market with elevated commercial minimums.', house: 0.16, houseMin: 135, deep: 0.22, deepMin: 175, move: 0.31, moveMin: 235, same: 0.19, sameMin: 160, office: 0.19, officeMin: 185, restroom: 32, breakroom: 27, supplies: 18, post: 0.36, postMin: 315, postRestroom: 48, postSupplies: 38, medical: 0.30, medicalMin: 295, medicalRestroom: 44, medicalSupplies: 34 },
  NH: { marketLabel: 'New Hampshire Northeast Market', pricingNote: 'Northeast market with elevated labor and travel cost.', house: 0.17, houseMin: 140, deep: 0.23, deepMin: 185, move: 0.32, moveMin: 245, same: 0.20, sameMin: 170, office: 0.20, officeMin: 195, restroom: 34, breakroom: 28, supplies: 18, post: 0.38, postMin: 330, postRestroom: 50, postSupplies: 40, medical: 0.31, medicalMin: 305, medicalRestroom: 46, medicalSupplies: 36 },
  NJ: { marketLabel: 'New Jersey Premium Tri-State Market', pricingNote: 'Premium Tri-State market with higher labor, tolls, parking, traffic and insurance cost.', house: 0.17, houseMin: 140, deep: 0.23, deepMin: 180, move: 0.32, moveMin: 240, same: 0.20, sameMin: 165, office: 0.18, officeMin: 175, restroom: 30, breakroom: 25, supplies: 15, post: 0.35, postMin: 300, postRestroom: 45, postSupplies: 35, medical: 0.28, medicalMin: 275, medicalRestroom: 40, medicalSupplies: 30 },
  NM: { marketLabel: 'New Mexico Value-Core Market', pricingNote: 'Value-core market with lower rate but enforced visit minimums.', house: 0.12, houseMin: 105, deep: 0.17, deepMin: 135, move: 0.24, moveMin: 175, same: 0.15, sameMin: 120, office: 0.14, officeMin: 145, restroom: 24, breakroom: 20, supplies: 12, post: 0.28, postMin: 240, postRestroom: 38, postSupplies: 28, medical: 0.23, medicalMin: 225, medicalRestroom: 34, medicalSupplies: 25 },
  NY: { marketLabel: 'New York Premium Metro Market', pricingNote: 'Premium metro market with high labor, parking, traffic, toll and access costs.', house: 0.21, houseMin: 180, deep: 0.29, deepMin: 235, move: 0.40, moveMin: 320, same: 0.25, sameMin: 215, office: 0.25, officeMin: 245, restroom: 45, breakroom: 38, supplies: 28, post: 0.48, postMin: 420, postRestroom: 62, postSupplies: 58, medical: 0.39, medicalMin: 370, medicalRestroom: 58, medicalSupplies: 48 },
  NC: { marketLabel: 'North Carolina Core Growth Market', pricingNote: 'Growing southeast market with balanced rate and minimum structure.', house: 0.13, houseMin: 115, deep: 0.18, deepMin: 145, move: 0.25, moveMin: 195, same: 0.16, sameMin: 130, office: 0.15, officeMin: 155, restroom: 26, breakroom: 21, supplies: 13, post: 0.30, postMin: 260, postRestroom: 40, postSupplies: 30, medical: 0.24, medicalMin: 240, medicalRestroom: 36, medicalSupplies: 26 },
  ND: { marketLabel: 'North Dakota Rural-Core Market', pricingNote: 'Lower density market with travel-sensitive minimums.', house: 0.13, houseMin: 115, deep: 0.18, deepMin: 145, move: 0.25, moveMin: 195, same: 0.16, sameMin: 130, office: 0.15, officeMin: 155, restroom: 26, breakroom: 21, supplies: 13, post: 0.30, postMin: 260, postRestroom: 40, postSupplies: 30, medical: 0.24, medicalMin: 240, medicalRestroom: 36, medicalSupplies: 26 },
  OH: { marketLabel: 'Ohio Core Market', pricingNote: 'Balanced Midwest pricing with service minimum safeguards.', house: 0.13, houseMin: 115, deep: 0.18, deepMin: 145, move: 0.25, moveMin: 195, same: 0.16, sameMin: 130, office: 0.15, officeMin: 155, restroom: 26, breakroom: 21, supplies: 13, post: 0.30, postMin: 260, postRestroom: 40, postSupplies: 30, medical: 0.24, medicalMin: 240, medicalRestroom: 36, medicalSupplies: 26 },
  OK: { marketLabel: 'Oklahoma Value-Core Market', pricingNote: 'Value-core market with lower rate but enforced visit minimums.', house: 0.12, houseMin: 105, deep: 0.17, deepMin: 135, move: 0.24, moveMin: 175, same: 0.15, sameMin: 120, office: 0.14, officeMin: 145, restroom: 24, breakroom: 20, supplies: 12, post: 0.28, postMin: 240, postRestroom: 38, postSupplies: 28, medical: 0.23, medicalMin: 225, medicalRestroom: 34, medicalSupplies: 25 },
  OR: { marketLabel: 'Oregon High-Demand Market', pricingNote: 'West Coast market with elevated labor and operating costs.', house: 0.17, houseMin: 140, deep: 0.23, deepMin: 185, move: 0.32, moveMin: 245, same: 0.20, sameMin: 170, office: 0.20, officeMin: 195, restroom: 34, breakroom: 28, supplies: 18, post: 0.38, postMin: 330, postRestroom: 50, postSupplies: 40, medical: 0.31, medicalMin: 305, medicalRestroom: 46, medicalSupplies: 36 },
  PA: { marketLabel: 'Pennsylvania Mid-Atlantic Market', pricingNote: 'Mid-Atlantic market with rate protection for urban and suburban jobs.', house: 0.15, houseMin: 125, deep: 0.20, deepMin: 165, move: 0.29, moveMin: 225, same: 0.18, sameMin: 150, office: 0.17, officeMin: 175, restroom: 30, breakroom: 25, supplies: 15, post: 0.34, postMin: 295, postRestroom: 45, postSupplies: 35, medical: 0.28, medicalMin: 275, medicalRestroom: 40, medicalSupplies: 30 },
  RI: { marketLabel: 'Rhode Island Premium Northeast Market', pricingNote: 'Premium Northeast market with elevated labor and travel cost.', house: 0.18, houseMin: 150, deep: 0.24, deepMin: 195, move: 0.34, moveMin: 255, same: 0.22, sameMin: 180, office: 0.21, officeMin: 205, restroom: 36, breakroom: 30, supplies: 20, post: 0.40, postMin: 345, postRestroom: 52, postSupplies: 42, medical: 0.33, medicalMin: 320, medicalRestroom: 48, medicalSupplies: 38 },
  SC: { marketLabel: 'South Carolina Core Market', pricingNote: 'Core southeast market with balanced rate and minimum structure.', house: 0.13, houseMin: 115, deep: 0.18, deepMin: 145, move: 0.25, moveMin: 195, same: 0.16, sameMin: 130, office: 0.15, officeMin: 155, restroom: 26, breakroom: 21, supplies: 13, post: 0.30, postMin: 260, postRestroom: 40, postSupplies: 30, medical: 0.24, medicalMin: 240, medicalRestroom: 36, medicalSupplies: 26 },
  SD: { marketLabel: 'South Dakota Rural-Core Market', pricingNote: 'Lower density market with travel-sensitive minimums.', house: 0.12, houseMin: 105, deep: 0.17, deepMin: 135, move: 0.24, moveMin: 175, same: 0.15, sameMin: 120, office: 0.14, officeMin: 145, restroom: 24, breakroom: 20, supplies: 12, post: 0.28, postMin: 240, postRestroom: 38, postSupplies: 28, medical: 0.23, medicalMin: 225, medicalRestroom: 34, medicalSupplies: 25 },
  TN: { marketLabel: 'Tennessee Core Growth Market', pricingNote: 'Growing southeast market with balanced rate and minimum structure.', house: 0.13, houseMin: 115, deep: 0.18, deepMin: 145, move: 0.25, moveMin: 195, same: 0.16, sameMin: 130, office: 0.15, officeMin: 155, restroom: 26, breakroom: 21, supplies: 13, post: 0.30, postMin: 260, postRestroom: 40, postSupplies: 30, medical: 0.24, medicalMin: 240, medicalRestroom: 36, medicalSupplies: 26 },
  TX: { marketLabel: 'Texas Competitive Growth Market', pricingNote: 'Large competitive market with commercial minimum protection.', house: 0.14, houseMin: 120, deep: 0.19, deepMin: 155, move: 0.27, moveMin: 210, same: 0.17, sameMin: 140, office: 0.16, officeMin: 165, restroom: 28, breakroom: 22, supplies: 14, post: 0.32, postMin: 275, postRestroom: 42, postSupplies: 32, medical: 0.26, medicalMin: 255, medicalRestroom: 38, medicalSupplies: 28 },
  UT: { marketLabel: 'Utah Core Growth Market', pricingNote: 'Growing mountain-west market with moderate labor and travel cost.', house: 0.14, houseMin: 120, deep: 0.19, deepMin: 155, move: 0.27, moveMin: 210, same: 0.17, sameMin: 140, office: 0.16, officeMin: 165, restroom: 28, breakroom: 22, supplies: 14, post: 0.32, postMin: 275, postRestroom: 42, postSupplies: 32, medical: 0.26, medicalMin: 255, medicalRestroom: 38, medicalSupplies: 28 },
  VT: { marketLabel: 'Vermont Northeast Market', pricingNote: 'Northeast market with travel and labor availability considerations.', house: 0.17, houseMin: 140, deep: 0.23, deepMin: 185, move: 0.32, moveMin: 245, same: 0.20, sameMin: 170, office: 0.20, officeMin: 195, restroom: 34, breakroom: 28, supplies: 18, post: 0.38, postMin: 330, postRestroom: 50, postSupplies: 40, medical: 0.31, medicalMin: 305, medicalRestroom: 46, medicalSupplies: 36 },
  VA: { marketLabel: 'Virginia Premium Mid-Atlantic Market', pricingNote: 'Premium Mid-Atlantic market with elevated urban/suburban operating costs.', house: 0.17, houseMin: 140, deep: 0.23, deepMin: 180, move: 0.32, moveMin: 240, same: 0.20, sameMin: 165, office: 0.20, officeMin: 195, restroom: 34, breakroom: 28, supplies: 18, post: 0.38, postMin: 330, postRestroom: 50, postSupplies: 40, medical: 0.31, medicalMin: 305, medicalRestroom: 46, medicalSupplies: 36 },
  WA: { marketLabel: 'Washington Premium West Coast Market', pricingNote: 'Premium West Coast labor, traffic and cost-of-living market.', house: 0.20, houseMin: 170, deep: 0.27, deepMin: 220, move: 0.38, moveMin: 300, same: 0.24, sameMin: 205, office: 0.24, officeMin: 230, restroom: 42, breakroom: 35, supplies: 25, post: 0.46, postMin: 400, postRestroom: 60, postSupplies: 55, medical: 0.37, medicalMin: 355, medicalRestroom: 55, medicalSupplies: 45 },
  WV: { marketLabel: 'West Virginia Value Market', pricingNote: 'Lower-cost market with protective minimums for travel, supplies and booking overhead.', house: 0.11, houseMin: 100, deep: 0.16, deepMin: 130, move: 0.23, moveMin: 170, same: 0.14, sameMin: 115, office: 0.13, officeMin: 140, restroom: 23, breakroom: 18, supplies: 12, post: 0.27, postMin: 235, postRestroom: 36, postSupplies: 28, medical: 0.22, medicalMin: 220, medicalRestroom: 33, medicalSupplies: 25 },
  WI: { marketLabel: 'Wisconsin Core Market', pricingNote: 'Balanced Midwest pricing with service minimum safeguards.', house: 0.13, houseMin: 115, deep: 0.18, deepMin: 145, move: 0.25, moveMin: 195, same: 0.16, sameMin: 130, office: 0.15, officeMin: 155, restroom: 26, breakroom: 21, supplies: 13, post: 0.30, postMin: 260, postRestroom: 40, postSupplies: 30, medical: 0.24, medicalMin: 240, medicalRestroom: 36, medicalSupplies: 26 },
  WY: { marketLabel: 'Wyoming Rural-Core Market', pricingNote: 'Lower density market with travel-sensitive minimums.', house: 0.13, houseMin: 115, deep: 0.18, deepMin: 145, move: 0.25, moveMin: 195, same: 0.16, sameMin: 130, office: 0.15, officeMin: 155, restroom: 26, breakroom: 21, supplies: 13, post: 0.30, postMin: 260, postRestroom: 40, postSupplies: 30, medical: 0.24, medicalMin: 240, medicalRestroom: 36, medicalSupplies: 26 },
};

function buildStatePricing(input: StatePricingInput): Record<string, ServicePricing> {
  return {
    HOUSE_CLEANING: {
      sqftRate: input.house,
      minimum: input.houseMin,
      marketLabel: input.marketLabel,
      pricingNote: input.pricingNote,
    },
    DEEP_CLEANING: {
      sqftRate: input.deep,
      minimum: input.deepMin,
      marketLabel: input.marketLabel,
      pricingNote: input.pricingNote,
    },
    MOVE_IN_OUT: {
      sqftRate: input.move,
      minimum: input.moveMin,
      marketLabel: input.marketLabel,
      pricingNote: input.pricingNote,
    },
    SAME_DAY_CLEANING: {
      sqftRate: input.same,
      minimum: input.sameMin,
      marketLabel: input.marketLabel,
      pricingNote: input.pricingNote,
    },
    OFFICE_CLEANING: {
      sqftRate: input.office,
      minimum: input.officeMin,
      restroomFee: input.restroom,
      breakroomFee: input.breakroom,
      suppliesFee: input.supplies,
      marketLabel: input.marketLabel,
      pricingNote: input.pricingNote,
    },
    POST_CONSTRUCTION: {
      sqftRate: input.post,
      minimum: input.postMin,
      restroomFee: input.postRestroom,
      breakroomFee: input.breakroom,
      suppliesFee: input.postSupplies,
      marketLabel: input.marketLabel,
      pricingNote: input.pricingNote,
    },
    MEDICAL_CLEANING: {
      sqftRate: input.medical,
      minimum: input.medicalMin,
      restroomFee: input.medicalRestroom,
      breakroomFee: input.breakroom,
      suppliesFee: input.medicalSupplies,
      marketLabel: input.marketLabel,
      pricingNote: input.pricingNote,
    },
  };
}

const STATE_PRICING: Record<string, Record<string, ServicePricing>> = Object.fromEntries(
  Object.entries(STATE_PRICING_INPUTS).map(([stateCode, pricing]) => [stateCode, buildStatePricing(pricing)])
);

const FREQ_OPTIONS = [
  { key: 'ONE_TIME', label: 'One Time', residentialFactor: 1, commercialFactor: 1.15 },
  { key: 'MONTHLY', label: 'Monthly', residentialFactor: 0.95, commercialFactor: 1.05 },
  { key: 'BI_WEEKLY', label: 'Bi-Weekly', residentialFactor: 0.9, commercialFactor: 1 },
  { key: 'WEEKLY', label: 'Weekly', residentialFactor: 0.85, commercialFactor: 1 },
  { key: 'TWO_X_WEEK', label: '2x per week', residentialFactor: 0.82, commercialFactor: 0.95, commercialOnly: true },
  { key: 'THREE_X_WEEK', label: '3x per week', residentialFactor: 0.8, commercialFactor: 0.92, commercialOnly: true },
  { key: 'FIVE_X_WEEK', label: '5x per week', residentialFactor: 0.78, commercialFactor: 0.88, commercialOnly: true },
];

const RUG_PRICES: Record<string, { label: string; price: number }> = {
  SMALL: { label: 'Small rug', price: 25 },
  MEDIUM: { label: 'Medium rug', price: 45 },
  LARGE: { label: 'Large rug', price: 70 },
  XL: { label: 'Oversized rug', price: 95 },
};

const VEHICLE_TYPES = [
  { code: 'COMPACT', label: 'Compact / Hatchback', examples: 'Corolla, Civic, Elantra, Golf, Mazda3' },
  { code: 'SEDAN', label: 'Sedan', examples: 'Camry, Accord, Altima, BMW 3, Audi A4' },
  { code: 'SUV_MID', label: 'Mid-size SUV', examples: 'RAV4, CR-V, Rogue, Equinox, Tucson' },
  { code: 'SUV_LG', label: 'Large SUV', examples: 'Highlander, Explorer, Telluride, Palisade' },
  { code: 'SUV_XL', label: 'Full-size SUV', examples: 'Expedition, Suburban, Yukon XL, Sequoia' },
  { code: 'TRUCK_S', label: 'Single-cab Pickup', examples: 'F-150 Regular, Silverado Regular, Ram Regular' },
  { code: 'TRUCK_DC', label: 'Crew-cab Pickup', examples: 'F-150 Crew, Ram Crew, Tacoma DC, Frontier DC' },
  { code: 'TRUCK_HD', label: 'Heavy-duty Pickup', examples: 'F-250, F-350, Ram 2500/3500' },
  { code: 'VAN', label: 'Van / Minivan', examples: 'Odyssey, Pacifica, Sienna, Carnival' },
];

const CAR_PKG_DETAILS = {
  BASIC: { label: 'Basic Wash', includes: 'Exterior hand wash and dry' },
  STANDARD: { label: 'Standard', includes: 'Basic + interior vacuum and wipe down' },
  INTERIOR: { label: 'Interior Only', includes: 'Vacuum, surfaces and interior glass' },
  FULL: { label: 'Full Detail', includes: 'Complete exterior and interior detail' },
  PREMIUM: { label: 'Premium', includes: 'Full + wax, wheels and finish care' },
  VIP: { label: 'VIP', includes: 'Premium + protectant, leather and engine bay' },
};

const CAR_WASH_RATES: Record<string, Record<string, number>> = {
  COMPACT: { BASIC: 40, STANDARD: 60, INTERIOR: 55, FULL: 90, PREMIUM: 125, VIP: 170 },
  SEDAN: { BASIC: 45, STANDARD: 65, INTERIOR: 60, FULL: 100, PREMIUM: 135, VIP: 185 },
  SUV_MID: { BASIC: 55, STANDARD: 80, INTERIOR: 70, FULL: 120, PREMIUM: 160, VIP: 215 },
  SUV_LG: { BASIC: 65, STANDARD: 90, INTERIOR: 80, FULL: 135, PREMIUM: 180, VIP: 240 },
  SUV_XL: { BASIC: 75, STANDARD: 105, INTERIOR: 90, FULL: 155, PREMIUM: 205, VIP: 270 },
  TRUCK_S: { BASIC: 60, STANDARD: 85, INTERIOR: 75, FULL: 125, PREMIUM: 165, VIP: 225 },
  TRUCK_DC: { BASIC: 70, STANDARD: 95, INTERIOR: 85, FULL: 145, PREMIUM: 190, VIP: 255 },
  TRUCK_HD: { BASIC: 85, STANDARD: 115, INTERIOR: 100, FULL: 170, PREMIUM: 220, VIP: 290 },
  VAN: { BASIC: 75, STANDARD: 100, INTERIOR: 90, FULL: 150, PREMIUM: 195, VIP: 260 },
};

const CAR_ADDONS = [
  { code: 'OZONE', label: 'Odor removal', price: 35 },
  { code: 'PAINT_LIGHT', label: 'Light paint correction', price: 60 },
  { code: 'CERAMIC', label: 'Ceramic coating', price: 120 },
  { code: 'ENGINE', label: 'Engine bay cleaning', price: 45 },
];

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function stateName(stateCode: string) {
  return STATE_OPTIONS.find((s) => s.code === stateCode)?.name ?? stateCode;
}

function getStatePricing(stateCode: string, serviceType: string) {
  return STATE_PRICING[stateCode]?.[serviceType] ?? STATE_PRICING.NJ?.[serviceType] ?? null;
}

function serviceSqftRate(serviceType: string, stateCode: string) {
  return getStatePricing(stateCode, serviceType)?.sqftRate ?? 0;
}

function serviceMinimum(serviceType: string, stateCode: string) {
  return getStatePricing(stateCode, serviceType)?.minimum ?? 0;
}

function frequencyFactor(frequency: string, commercial: boolean) {
  const option = FREQ_OPTIONS.find((f) => f.key === frequency);
  if (!option) return 1;
  return commercial ? option.commercialFactor : option.residentialFactor;
}

function frequencyLabel(frequency: string) {
  return FREQ_OPTIONS.find((f) => f.key === frequency)?.label ?? frequency;
}

function frequencyText(frequency: string, commercial: boolean) {
  const factor = frequencyFactor(frequency, commercial);
  if (factor === 1) return 'No frequency adjustment';
  if (factor > 1) return `+${Math.round((factor - 1) * 100)}% frequency adjustment`;
  return `-${Math.round((1 - factor) * 100)}% frequency adjustment`;
}

function estimatedSqftFromRooms(beds: number, baths: number, kitchens: number) {
  const baseLiving = beds === 0 ? 360 : 420;
  const bedroomSqft = beds * 240;
  const bathSqft = baths * 90;
  const kitchenSqft = Math.max(kitchens, 1) * 180;
  return Math.ceil((baseLiving + bedroomSqft + bathSqft + kitchenSqft) / 50) * 50;
}

function estimatedHours(sqft: number, addonTotal: number) {
  const baseHours = sqft <= 1000 ? 2 : sqft <= 2000 ? 3 : sqft <= 3500 ? 4 : 5;
  return Math.round((baseHours + addonTotal / 90) * 10) / 10;
}

function estimatedCommercialHours(sqft: number, restroomCount: number, breakroomCount: number, serviceType: string) {
  const sqftHours = serviceType === 'POST_CONSTRUCTION' ? sqft / 550 : serviceType === 'MEDICAL_CLEANING' ? sqft / 700 : sqft / 850;
  const roomHours = restroomCount * 0.25 + breakroomCount * 0.2;
  return Math.max(1.5, Math.round((sqftHours + roomHours) * 10) / 10);
}

function cleaningAddonPrice(addons: {
  drawers: number;
  carpetSqft: number;
  rugSize: string;
  rugCount: number;
  windowsInside: number;
  windowsOutside: number;
}) {
  const carpet = addons.carpetSqft > 0 ? Math.max(addons.carpetSqft * 0.28, 45) : 0;
  const rug = addons.rugSize && addons.rugCount > 0 ? (RUG_PRICES[addons.rugSize]?.price || 0) * addons.rugCount : 0;
  const drawers = addons.drawers * 8;
  const windows = addons.windowsInside * 8 + addons.windowsOutside * 12;
  return money(carpet + rug + drawers + windows);
}

function calcResidentialCleaningPrice(
  serviceType: string,
  stateCode: string,
  sqft: number,
  beds: number | null,
  baths: number | null,
  kitchens: number,
  frequency: string,
  addons: { drawers: number; carpetSqft: number; rugSize: string; rugCount: number; windowsInside: number; windowsOutside: number },
  useRoomEstimate = true
): PriceCalc | null {
  const cfg = getStatePricing(stateCode, serviceType);
  if (!cfg) return null;

  const roomSqft = useRoomEstimate && beds != null && baths != null ? estimatedSqftFromRooms(beds, baths, kitchens) : 0;
  let sqftUsed = sqft || roomSqft;
  let corrected = false;

  if (roomSqft && sqftUsed < roomSqft) {
    sqftUsed = roomSqft;
    corrected = true;
  }

  if (sqftUsed <= 0) return null;

  const addonTotal = cleaningAddonPrice(addons);
  const effectiveRate = cfg.sqftRate;
  const minPrice = cfg.minimum;
  const sqftBase = money(sqftUsed * effectiveRate);
  const minimumApplied = sqftBase < minPrice;
  const base = Math.max(sqftBase, minPrice);
  const factor = frequencyFactor(frequency, false);
  const price = money(base * factor + addonTotal);

  return {
    price,
    hours: estimatedHours(sqftUsed, addonTotal),
    sqftUsed,
    corrected,
    addonTotal,
    roomSqft,
    effectiveRate,
    minPrice,
    minimumApplied,
    sqftBase,
    sqftCharge: sqftBase,
    subtotalBeforeMinimum: sqftBase,
    subtotal: base,
    frequencyFactor: factor,
    marketLabel: cfg.marketLabel,
    pricingNote: cfg.pricingNote,
    stateCode,
    serviceType,
    pricingBreakdown: {
      mode: 'residential',
      stateCode,
      stateName: stateName(stateCode),
      marketLabel: cfg.marketLabel,
      serviceType,
      sqftUsed,
      sqftRate: effectiveRate,
      sqftCharge: sqftBase,
      minimum: minPrice,
      minimumApplied,
      frequency,
      frequencyFactor: factor,
      addonTotal,
      finalEstimatedPrice: price,
    },
  };
}

function calcCommercialCleaningPrice(
  serviceType: string,
  stateCode: string,
  sqft: number,
  restroomCount: number,
  breakroomCount: number,
  frequency: string
): PriceCalc | null {
  const cfg = getStatePricing(stateCode, serviceType);
  if (!cfg || sqft <= 0) return null;

  const factor = frequencyFactor(frequency, true);
  const restroomFee = cfg.restroomFee ?? 0;
  const breakroomFee = cfg.breakroomFee ?? 0;
  const suppliesFee = cfg.suppliesFee ?? 0;

  const sqftCharge = money(sqft * cfg.sqftRate);
  const restroomCharge = money(restroomCount * restroomFee);
  const breakroomCharge = money(breakroomCount * breakroomFee);
  const subtotalBeforeMinimum = money(sqftCharge + restroomCharge + breakroomCharge + suppliesFee);
  const minimumApplied = subtotalBeforeMinimum < cfg.minimum;
  const subtotal = Math.max(subtotalBeforeMinimum, cfg.minimum);
  const price = money(subtotal * factor);

  return {
    price,
    hours: estimatedCommercialHours(sqft, restroomCount, breakroomCount, serviceType),
    sqftUsed: sqft,
    corrected: false,
    addonTotal: 0,
    effectiveRate: cfg.sqftRate,
    minPrice: cfg.minimum,
    minimumApplied,
    sqftBase: sqftCharge,
    sqftCharge,
    restroomCharge,
    breakroomCharge,
    suppliesFee,
    subtotalBeforeMinimum,
    subtotal,
    frequencyFactor: factor,
    restroomCount,
    breakroomCount,
    restroomFee,
    breakroomFee,
    marketLabel: cfg.marketLabel,
    pricingNote: cfg.pricingNote,
    stateCode,
    serviceType,
    pricingBreakdown: {
      mode: 'commercial',
      stateCode,
      stateName: stateName(stateCode),
      marketLabel: cfg.marketLabel,
      serviceType,
      sqftUsed: sqft,
      sqftRate: cfg.sqftRate,
      sqftCharge,
      restroomCount,
      restroomFee,
      restroomCharge,
      breakroomCount,
      breakroomFee,
      breakroomCharge,
      suppliesFee,
      subtotalBeforeMinimum,
      minimum: cfg.minimum,
      minimumApplied,
      subtotal,
      frequency,
      frequencyFactor: factor,
      finalEstimatedPrice: price,
    },
  };
}

function laundryPrice(weight: string) {
  const lbs = Math.max(parseFloat(weight) || 10, 10);
  const price = Math.max(lbs * 2.5 + 20, 45);
  return { price: money(price), lbs };
}

function serviceLabel(serviceType: string) {
  if (CLEANING_SERVICES[serviceType]) return CLEANING_SERVICES[serviceType].label;
  if (serviceType === 'CAR_WASH') return 'Car Wash';
  if (serviceType === 'LAUNDRY_PICKUP') return 'Laundry';
  return serviceType;
}

export default function NewBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [serviceType, setServiceType] = useState('');
  const [state, setState] = useState('NJ');

  const [sqft, setSqft] = useState('');
  const [beds, setBeds] = useState('');
  const [baths, setBaths] = useState('');
  const [kitchens, setKitchens] = useState('1');
  const [frequency, setFrequency] = useState('ONE_TIME');

  const [commercialRestrooms, setCommercialRestrooms] = useState('0');
  const [commercialBreakrooms, setCommercialBreakrooms] = useState('0');

  const [drawerCount, setDrawerCount] = useState('0');
  const [carpetSqft, setCarpetSqft] = useState('0');
  const [rugSize, setRugSize] = useState('');
  const [rugCount, setRugCount] = useState('0');
  const [windowInside, setWindowInside] = useState('0');
  const [windowOutside, setWindowOutside] = useState('0');

  const [vehicleCode, setVehicleCode] = useState('');
  const [carPkg, setCarPkg] = useState('');
  const [selectedCarAddons, setSelectedCarAddons] = useState<string[]>([]);
  const [weightLbs, setWeightLbs] = useState('10');

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');

  const isCleaning = serviceType in CLEANING_SERVICES;
  const isCommercialCleaning = Boolean(CLEANING_SERVICES[serviceType]?.commercial);
  const isResidentialCleaning = isCleaning && !isCommercialCleaning;
  const isCarWash = serviceType === 'CAR_WASH';
  const isLaundry = serviceType === 'LAUNDRY_PICKUP';

  function chooseService(nextService: string) {
    setServiceType(nextService);
    setStep(1);

    const nextCfg = CLEANING_SERVICES[nextService];

    if (nextCfg?.commercial) {
      setBeds('');
      setBaths('');
      setKitchens('1');
      setDrawerCount('0');
      setCarpetSqft('0');
      setRugSize('');
      setRugCount('0');
      setWindowInside('0');
      setWindowOutside('0');
      if (['MONTHLY', 'BI_WEEKLY'].includes(frequency)) setFrequency('WEEKLY');
      return;
    }

    setCommercialRestrooms('0');
    setCommercialBreakrooms('0');
    if (['TWO_X_WEEK', 'THREE_X_WEEK', 'FIVE_X_WEEK'].includes(frequency)) setFrequency('ONE_TIME');
  }

  const cleaningAddons = {
    drawers: Math.max(parseInt(drawerCount) || 0, 0),
    carpetSqft: Math.max(parseFloat(carpetSqft) || 0, 0),
    rugSize,
    rugCount: Math.max(parseInt(rugCount) || 0, 0),
    windowsInside: Math.max(parseInt(windowInside) || 0, 0),
    windowsOutside: Math.max(parseInt(windowOutside) || 0, 0),
  };

  const commercialRestroomCount = Math.max(parseInt(commercialRestrooms) || 0, 0);
  const commercialBreakroomCount = Math.max(parseInt(commercialBreakrooms) || 0, 0);

  const priceCalc: PriceCalc | null = (() => {
    if (!serviceType) return null;

    if (isCleaning) {
      const parsedSqft = parseInt(sqft) || 0;

      if (isCommercialCleaning) {
        if (parsedSqft <= 0) return null;
        return calcCommercialCleaningPrice(
          serviceType,
          state,
          parsedSqft,
          commercialRestroomCount,
          commercialBreakroomCount,
          frequency
        );
      }

      if (isResidentialCleaning) {
        if (parsedSqft === 0 && !beds) return null;
        return calcResidentialCleaningPrice(
          serviceType,
          state,
          parsedSqft,
          beds ? parseInt(beds) : null,
          baths ? parseInt(baths) : null,
          Math.max(parseInt(kitchens) || 1, 1),
          frequency,
          cleaningAddons,
          true
        );
      }
    }

    if (isCarWash && vehicleCode && carPkg) {
      const base = CAR_WASH_RATES[vehicleCode]?.[carPkg] ?? 0;
      const addonsTotal = selectedCarAddons.reduce((sum, addon) => sum + (CAR_ADDONS.find((x) => x.code === addon)?.price ?? 0), 0);
      return {
        price: money(base + addonsTotal),
        hours: null,
        sqftUsed: null,
        corrected: false,
        addonTotal: addonsTotal,
        effectiveRate: null,
        minPrice: 0,
        minimumApplied: false,
        sqftBase: 0,
      };
    }

    if (isLaundry) {
      const calc = laundryPrice(weightLbs);
      return {
        price: calc.price,
        hours: null,
        sqftUsed: null,
        corrected: false,
        addonTotal: 0,
        effectiveRate: null,
        minPrice: 0,
        minimumApplied: false,
        sqftBase: 0,
      };
    }

    return null;
  })();

  const visibleFrequencyOptions = FREQ_OPTIONS.filter((f) => isCommercialCleaning || !f.commercialOnly);
  const canStep1 = Boolean(serviceType && priceCalc && priceCalc.price > 0);

  async function handleSubmit() {
    if (!address || !scheduledDate || !scheduledTime) {
      setError('Complete the required address, date and time fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const body: Record<string, unknown> = {
        service_type: serviceType,
        address,
        city,
        state,
        zip_code: zipCode,
        scheduledAt: `${scheduledDate}T${scheduledTime}:00`,
        notes,
        frequency,
        final_estimated_price: priceCalc?.price ?? null,
      };

      if (isCleaning) {
        body.sqft = priceCalc?.sqftUsed || parseInt(sqft) || 0;
        body.pricing_state_code = state;
        body.pricing_market_label = priceCalc?.marketLabel;
        body.pricing_note = priceCalc?.pricingNote;
        body.sqft_rate = priceCalc?.effectiveRate;
        body.pricing_breakdown = priceCalc?.pricingBreakdown ?? null;

        if (isResidentialCleaning) {
          body.bedrooms = beds ? parseInt(beds) : null;
          body.bathrooms = baths ? parseInt(baths) : null;
          body.kitchens = Math.max(parseInt(kitchens) || 1, 1);
          body.drawer_count = cleaningAddons.drawers;
          body.carpet_sqft = cleaningAddons.carpetSqft;
          body.rug_size = cleaningAddons.rugSize;
          body.rug_count = cleaningAddons.rugCount;
          body.window_inside_count = cleaningAddons.windowsInside;
          body.window_outside_count = cleaningAddons.windowsOutside;
        }

        if (isCommercialCleaning) {
          body.commercial_restrooms = commercialRestroomCount;
          body.commercial_breakrooms = commercialBreakroomCount;
          body.restroom_count = commercialRestroomCount;
          body.breakroom_count = commercialBreakroomCount;
          body.restroom_fee = priceCalc?.restroomFee ?? 0;
          body.breakroom_fee = priceCalc?.breakroomFee ?? 0;
          body.supplies_fee = priceCalc?.suppliesFee ?? 0;
          body.commercial_subtotal_before_minimum = priceCalc?.subtotalBeforeMinimum ?? null;
          body.commercial_minimum = priceCalc?.minPrice ?? null;
          body.commercial_minimum_applied = priceCalc?.minimumApplied ?? false;
        }
      }

      if (!isCleaning) {
        body.sqft = 0;
      }

      if (isCarWash) {
        body.vehicle_code = vehicleCode;
        body.package = carPkg;
        body.car_wash_addons = selectedCarAddons;
      }

      if (isLaundry) body.weight_lbs = laundryPrice(weightLbs).lbs;

      const res = await fetch(`${API}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { throw new Error('Server error: ' + text.slice(0, 100)); }
      if (!res.ok) throw new Error(data.error ?? 'Error creating booking');
      const bookingId = data.id || data.booking?.id;
      if (bookingId) localStorage.setItem('last_booking_id', String(bookingId));

      notifyBookingEvent({
        event: 'BOOKING_CREATED',
        booking: data.booking || { ...body, id: bookingId },
        client: { email: localStorage.getItem('userEmail') || undefined },
      });

      router.push('/dashboard?booked=1');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="booking-page">
      <style>{`
        .booking-page { width: 100%; }
        .booking-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:18px; }
        .booking-title { margin:0 0 5px; color:${C.text}; font-size:28px; line-height:1.05; font-weight:600; }
        .booking-subtitle { margin:0; color:${C.muted}; font-size:14px; }
        .booking-shell { background:#fff; border:1px solid ${C.border}; border-radius:${R.md}; box-shadow:0 2px 14px rgba(13,55,129,0.05); overflow:hidden; }
        .booking-steps { display:flex; align-items:center; gap:10px; padding:16px; border-bottom:1px solid ${C.border}; background:#F8FBFF; }
        .booking-step { width:32px; height:32px; border-radius:${R.full}; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:600; background:#E2E8F0; color:${C.muted}; }
        .booking-step.active { color:#fff; background:${C.green}; box-shadow:0 8px 18px rgba(76,175,80,0.18); }
        .booking-step-label { color:${C.muted}; font-size:13px; font-weight:600; }
        .booking-body { padding:16px; }
        .booking-section { margin-bottom:18px; }
        .booking-label { display:block; color:${C.text}; font-size:13px; font-weight:600; margin-bottom:8px; }
        .booking-kicker { color:${C.muted}; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:1.4px; margin:0 0 9px; }
        .booking-input, .booking-select, .booking-textarea { width:100%; border:1px solid ${C.border}; border-radius:${R.sm}; background:#fff; color:${C.text}; min-height:42px; padding:0 12px; outline:none; font-size:14px; }
        .booking-textarea { min-height:82px; padding:12px; resize:none; }
        .booking-input:focus, .booking-select:focus, .booking-textarea:focus { border-color:${C.green}; box-shadow:0 0 0 3px rgba(76,175,80,.14); }
        .booking-help { margin:7px 0 0; color:${C.muted}; font-size:12px; }
        .booking-note { margin:8px 0 0; color:${C.navy}; background:#EFF6FF; border:1px solid #BFDBFE; border-radius:${R.sm}; padding:10px 12px; font-size:12px; line-height:1.35; }
        .booking-grid { display:grid; gap:10px; }
        .booking-grid.three { grid-template-columns:repeat(3, minmax(0, 1fr)); }
        .booking-grid.two { grid-template-columns:repeat(2, minmax(0, 1fr)); }
        .booking-grid.four { grid-template-columns:repeat(4, minmax(0, 1fr)); }
        .booking-option { border:1px solid ${C.border}; background:#fff; border-radius:${R.md}; padding:13px; min-height:86px; cursor:pointer; text-align:left; transition:border .15s, box-shadow .15s, background .15s; }
        .booking-option:hover { border-color:${C.blue}; }
        .booking-option.selected { border-color:${C.blue}; background:#EFF6FF; box-shadow:0 0 0 3px rgba(21,101,192,0.08); }
        .booking-option.green.selected { border-color:${C.green}; background:#ECFDF5; box-shadow:0 0 0 3px rgba(76,175,80,0.1); }
        .booking-option-icon { font-size:12px; font-weight:600; color:${C.blue}; margin-bottom:7px; text-transform:uppercase; letter-spacing:.4px; }
        .booking-option strong { display:block; color:${C.text}; font-size:13px; font-weight:600; line-height:1.15; }
        .booking-option span { display:block; color:${C.muted}; font-size:12px; margin-top:4px; }
        .booking-option em { display:block; color:${C.warning}; font-size:11px; font-style:normal; font-weight:600; margin-top:4px; }
        .booking-price-card { border-radius:${R.md}; padding:24px; color:${C.text}; background:#fff; border:1px solid ${C.border}; box-shadow:${C.shadow}; margin-bottom:16px; }
        .booking-price-card p { margin:0 0 6px; color:${C.muted}; font-size:13px; font-weight:500; }
        .booking-price-card strong { display:block; font-size:38px; line-height:1; font-weight:600; color:${C.navy}; }
        .booking-price-meta { display:flex; flex-wrap:wrap; gap:10px; margin-top:12px; color:${C.muted}; font-size:13px; font-weight:600; }
        .booking-price-meta span { background:#F8FAFC; border:1px solid ${C.border}; border-radius:${R.full}; padding:6px 10px; }
        .booking-breakdown { margin-top:16px; border-top:1px solid ${C.border}; padding-top:12px; display:grid; gap:8px; }
        .booking-breakdown-row { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; color:${C.text}; font-size:13px; }
        .booking-breakdown-row span:first-child { color:${C.muted}; }
        .booking-breakdown-row b { color:${C.text}; font-size:13px; white-space:nowrap; }
        .booking-breakdown-total { border-top:1px solid ${C.border}; padding-top:8px; margin-top:4px; }
        .booking-actions { display:flex; gap:10px; }
        .booking-button { width:100%; min-height:52px; border:0; border-radius:${R.full}; color:#fff; background:${C.green}; font-size:15px; font-weight:600; cursor:pointer; }
        .booking-button:disabled { opacity:.45; cursor:not-allowed; }
        .booking-button.secondary { background:#fff; color:${C.text}; border:1px solid ${C.border}; border-radius:${R.sm}; }
        .booking-summary { background:#F8FBFF; border:1px solid ${C.border}; border-radius:${R.md}; padding:14px; display:flex; justify-content:space-between; gap:12px; margin-bottom:16px; }
        .booking-summary strong { color:${C.text}; font-size:15px; font-weight:600; }
        .booking-summary span { display:block; color:${C.muted}; font-size:12px; margin-top:3px; }
        .booking-summary b { color:${C.blue}; font-size:24px; white-space:nowrap; }
        .booking-error { background:#FEF2F2; border:1px solid #FECACA; color:${C.danger}; border-radius:${R.md}; padding:12px 14px; font-size:13px; font-weight:600; margin-bottom:14px; }
        @media (max-width:960px) { .booking-grid.four { grid-template-columns:repeat(2, minmax(0, 1fr)); } }
        @media (max-width:760px) { .booking-header { flex-direction:column; } .booking-grid.three, .booking-grid.two, .booking-grid.four { grid-template-columns:1fr; } .booking-actions { flex-direction:column; } .booking-title { font-size:26px; } }
      `}</style>

      <div className="booking-header">
        <div>
          <h1 className="booking-title">Book a Service</h1>
          <p className="booking-subtitle">Choose a service, review state-specific pricing, then schedule your visit.</p>
        </div>
      </div>

      <div className="booking-shell">
        <div className="booking-steps">
          {[1, 2].map((s) => <div key={s} className={`booking-step ${step >= s ? 'active' : ''}`}>{s}</div>)}
          <span className="booking-step-label">{step === 1 ? 'Service and price' : 'Where and when'}</span>
        </div>

        <div className="booking-body">
          {step === 1 && (
            <>
              <div className="booking-section">
                <label className="booking-label">State</label>
                <select value={state} onChange={(e) => setState(e.target.value)} className="booking-select">
                  {STATE_OPTIONS.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
                {serviceType && priceCalc?.marketLabel && (
                  <p className="booking-note">
                    <strong>{priceCalc.marketLabel}</strong><br />
                    {priceCalc.pricingNote}
                  </p>
                )}
              </div>

              <div className="booking-section">
                <p className="booking-kicker">Base cleaning services</p>
                <div className="booking-grid three">
                  {Object.entries(CLEANING_SERVICES).map(([key, cfg]) => {
                    const previewPricing = getStatePricing(state, key);
                    return (
                      <button key={key} onClick={() => chooseService(key)} className={`booking-option ${serviceType === key ? 'selected' : ''}`} type="button">
                        <div className="booking-option-icon">{cfg.icon}</div>
                        <strong>{cfg.label}</strong>
                        <span>${(previewPricing?.sqftRate ?? 0).toFixed(2)}/sqft in {stateName(state)}</span>
                        <span>Minimum ${previewPricing?.minimum.toFixed(2) ?? '0.00'}</span>
                        <span>{cfg.desc}</span>
                        {cfg.commercial && <em>Commercial</em>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="booking-section">
                <p className="booking-kicker">Standalone services</p>
                <div className="booking-grid two">
                  {[{ key: 'CAR_WASH', label: 'Car Wash', icon: 'Auto' }, { key: 'LAUNDRY_PICKUP', label: 'Laundry', icon: 'Laundry' }].map((s) => (
                    <button key={s.key} onClick={() => chooseService(s.key)} className={`booking-option ${serviceType === s.key ? 'selected' : ''}`} type="button">
                      <div className="booking-option-icon">{s.icon}</div>
                      <strong>{s.label}</strong>
                    </button>
                  ))}
                </div>
              </div>

              {isCommercialCleaning && (
                <div className="booking-section">
                  <p className="booking-kicker">Commercial space</p>
                  <div className="booking-grid three">
                    <label>
                      <span className="booking-label">Billable sqft *</span>
                      <input type="number" min="100" value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="example: 750" className="booking-input" />
                    </label>
                    <label>
                      <span className="booking-label">Restrooms / bathrooms</span>
                      <input type="number" min="0" value={commercialRestrooms} onChange={(e) => setCommercialRestrooms(e.target.value)} placeholder="example: 2" className="booking-input" />
                    </label>
                    <label>
                      <span className="booking-label">Breakrooms / kitchenettes</span>
                      <input type="number" min="0" value={commercialBreakrooms} onChange={(e) => setCommercialBreakrooms(e.target.value)} placeholder="example: 1" className="booking-input" />
                    </label>
                  </div>
                  <p className="booking-help">
                    Commercial pricing uses the selected state matrix, billable sqft, restrooms, breakrooms, supplies and minimum visit protection.
                  </p>
                  {priceCalc?.minimumApplied && <p className="booking-help">Minimum price applied: ${priceCalc.minPrice.toFixed(2)}.</p>}

                  <div style={{ marginTop: 18 }}>
                    <label className="booking-label">Frequency</label>
                    <div className="booking-grid two">
                      {visibleFrequencyOptions.map((f) => (
                        <button key={f.key} onClick={() => setFrequency(f.key)} className={`booking-option green ${frequency === f.key ? 'selected' : ''}`} type="button" style={{ minHeight: 58 }}>
                          <strong>{f.label}</strong>
                          <span>{frequencyText(f.key, true)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {isResidentialCleaning && (
                <div className="booking-section">
                  <p className="booking-kicker">Home size</p>
                  <div className="booking-grid three">
                    <label>
                      <span className="booking-label">Bedrooms</span>
                      <select value={beds} onChange={(e) => setBeds(e.target.value)} className="booking-select">
                        <option value="">--</option>
                        {[0, 1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n === 0 ? 'Studio' : n}</option>)}
                      </select>
                    </label>
                    <label>
                      <span className="booking-label">Bathrooms</span>
                      <select value={baths} onChange={(e) => setBaths(e.target.value)} className="booking-select">
                        <option value="">--</option>
                        {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </label>
                    <label>
                      <span className="booking-label">Kitchens</span>
                      <select value={kitchens} onChange={(e) => setKitchens(e.target.value)} className="booking-select">
                        {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </label>
                  </div>

                  {beds && baths && <p className="booking-help">Estimated minimum: {estimatedSqftFromRooms(parseInt(beds), parseInt(baths), parseInt(kitchens) || 1)} sqft based on bedrooms, bathrooms and kitchen.</p>}

                  <div style={{ marginTop: 12 }}>
                    <label className="booking-label">Exact sqft (optional)</label>
                    <input type="number" min="100" value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="example: 1200" className="booking-input" />
                  </div>

                  {priceCalc?.corrected && <div className="booking-error" style={{ marginTop: 12 }}>Sqft adjusted to {priceCalc.sqftUsed} based on the declared rooms.</div>}

                  <div style={{ marginTop: 18 }}>
                    <p className="booking-kicker">Cleaning add-ons</p>
                    <div className="booking-grid four">
                      <label><span className="booking-label">Drawers to clean/organize</span><input type="number" min="0" value={drawerCount} onChange={(e) => setDrawerCount(e.target.value)} className="booking-input" /></label>
                      <label><span className="booking-label">Carpet sqft</span><input type="number" min="0" value={carpetSqft} onChange={(e) => setCarpetSqft(e.target.value)} className="booking-input" /></label>
                      <label><span className="booking-label">Interior windows</span><input type="number" min="0" value={windowInside} onChange={(e) => setWindowInside(e.target.value)} className="booking-input" /></label>
                      <label><span className="booking-label">Exterior windows</span><input type="number" min="0" value={windowOutside} onChange={(e) => setWindowOutside(e.target.value)} className="booking-input" /></label>
                    </div>
                    <div className="booking-grid two" style={{ marginTop: 10 }}>
                      <label>
                        <span className="booking-label">Rug size</span>
                        <select value={rugSize} onChange={(e) => setRugSize(e.target.value)} className="booking-select">
                          <option value="">No rug</option>
                          {Object.entries(RUG_PRICES).map(([key, rug]) => <option key={key} value={key}>{rug.label} (+${rug.price})</option>)}
                        </select>
                      </label>
                      <label><span className="booking-label">Rug count</span><input type="number" min="0" value={rugCount} onChange={(e) => setRugCount(e.target.value)} className="booking-input" /></label>
                    </div>
                    {priceCalc?.addonTotal ? <p className="booking-help">Add-ons total: ${priceCalc.addonTotal.toFixed(2)}</p> : null}
                  </div>

                  <div style={{ marginTop: 18 }}>
                    <label className="booking-label">Frequency</label>
                    <div className="booking-grid two">
                      {visibleFrequencyOptions.map((f) => (
                        <button key={f.key} onClick={() => setFrequency(f.key)} className={`booking-option green ${frequency === f.key ? 'selected' : ''}`} type="button" style={{ minHeight: 58 }}>
                          <strong>{f.label}</strong>
                          <span>{frequencyText(f.key, false)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {isCarWash && (
                <div className="booking-section">
                  <label className="booking-label">Vehicle type</label>
                  <div className="booking-grid two">
                    {VEHICLE_TYPES.map((v) => (
                      <button key={v.code} onClick={() => setVehicleCode(v.code)} className={`booking-option ${vehicleCode === v.code ? 'selected' : ''}`} type="button">
                        <strong>{v.label}</strong>
                        <span>{v.examples}</span>
                      </button>
                    ))}
                  </div>

                  {vehicleCode && (
                    <div style={{ marginTop: 14 }}>
                      <label className="booking-label">Package</label>
                      <div className="booking-grid three">
                        {Object.entries(CAR_PKG_DETAILS).map(([key, pkg]) => (
                          <button key={key} onClick={() => setCarPkg(key)} className={`booking-option ${carPkg === key ? 'selected' : ''}`} type="button">
                            <strong>{pkg.label}</strong>
                            <span>{pkg.includes}</span>
                            <em>${CAR_WASH_RATES[vehicleCode]?.[key]}</em>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {vehicleCode && carPkg && (
                    <div style={{ marginTop: 14 }}>
                      <label className="booking-label">Add-ons (optional)</label>
                      <div className="booking-grid two">
                        {CAR_ADDONS.map((a) => (
                          <button
                            key={a.code}
                            onClick={() => setSelectedCarAddons((prev) => prev.includes(a.code) ? prev.filter((x) => x !== a.code) : [...prev, a.code])}
                            className={`booking-option green ${selectedCarAddons.includes(a.code) ? 'selected' : ''}`}
                            type="button"
                          >
                            <strong>{a.label}</strong>
                            <span>+${a.price}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isLaundry && (
                <div className="booking-section">
                  <label className="booking-label">Estimated pounds (minimum 10 lbs)</label>
                  <input type="number" min="10" value={weightLbs} onChange={(e) => setWeightLbs(e.target.value)} className="booking-input" />
                  <p className="booking-help">$2.50/lb + $20 pickup and delivery. Minimum $45.</p>
                </div>
              )}

              {priceCalc && (
                <div className="booking-price-card">
                  <p>Estimated price</p>
                  <strong>${priceCalc.price.toFixed(2)}</strong>
                  <div className="booking-price-meta">
                    {priceCalc.marketLabel && <span>{priceCalc.marketLabel}</span>}
                    {priceCalc.hours && <span>{priceCalc.hours} estimated hours</span>}
                    {priceCalc.sqftUsed && <span>{priceCalc.sqftUsed} sqft</span>}
                    {priceCalc.sqftUsed && priceCalc.effectiveRate && <span>{priceCalc.sqftUsed} sqft x ${priceCalc.effectiveRate.toFixed(2)}/sqft</span>}
                    {priceCalc.minimumApplied && <span>Minimum ${priceCalc.minPrice.toFixed(2)} applied</span>}
                    {priceCalc.addonTotal ? <span>${priceCalc.addonTotal.toFixed(2)} add-ons</span> : null}
                    <span>{frequencyText(frequency, isCommercialCleaning)}</span>
                    {priceCalc.corrected && <span>Sqft validated</span>}
                  </div>

                  {isCommercialCleaning && (
                    <div className="booking-breakdown">
                      <div className="booking-breakdown-row"><span>State market</span><b>{stateName(state)}</b></div>
                      <div className="booking-breakdown-row"><span>Billable area</span><b>{priceCalc.sqftUsed} sqft x ${priceCalc.effectiveRate?.toFixed(2)} = ${priceCalc.sqftCharge?.toFixed(2)}</b></div>
                      <div className="booking-breakdown-row"><span>Restrooms</span><b>{priceCalc.restroomCount} x ${priceCalc.restroomFee?.toFixed(2)} = ${priceCalc.restroomCharge?.toFixed(2)}</b></div>
                      <div className="booking-breakdown-row"><span>Breakrooms / kitchenettes</span><b>{priceCalc.breakroomCount} x ${priceCalc.breakroomFee?.toFixed(2)} = ${priceCalc.breakroomCharge?.toFixed(2)}</b></div>
                      <div className="booking-breakdown-row"><span>Supplies / operational fee</span><b>${priceCalc.suppliesFee?.toFixed(2)}</b></div>
                      <div className="booking-breakdown-row"><span>Subtotal before minimum</span><b>${priceCalc.subtotalBeforeMinimum?.toFixed(2)}</b></div>
                      <div className="booking-breakdown-row"><span>Minimum</span><b>${priceCalc.minPrice.toFixed(2)} {priceCalc.minimumApplied ? 'applied' : 'not applied'}</b></div>
                      <div className="booking-breakdown-row"><span>Frequency</span><b>{frequencyLabel(frequency)} / factor {priceCalc.frequencyFactor?.toFixed(2)}</b></div>
                      <div className="booking-breakdown-row booking-breakdown-total"><span>Estimated price per visit</span><b>${priceCalc.price.toFixed(2)}</b></div>
                    </div>
                  )}

                  {isResidentialCleaning && (
                    <div className="booking-breakdown">
                      <div className="booking-breakdown-row"><span>State market</span><b>{stateName(state)}</b></div>
                      <div className="booking-breakdown-row"><span>Area charge</span><b>{priceCalc.sqftUsed} sqft x ${priceCalc.effectiveRate?.toFixed(2)} = ${priceCalc.sqftCharge?.toFixed(2)}</b></div>
                      <div className="booking-breakdown-row"><span>Minimum</span><b>${priceCalc.minPrice.toFixed(2)} {priceCalc.minimumApplied ? 'applied' : 'not applied'}</b></div>
                      <div className="booking-breakdown-row"><span>Add-ons</span><b>${priceCalc.addonTotal.toFixed(2)}</b></div>
                      <div className="booking-breakdown-row"><span>Frequency</span><b>{frequencyLabel(frequency)} / factor {priceCalc.frequencyFactor?.toFixed(2)}</b></div>
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => canStep1 && setStep(2)} disabled={!canStep1} className="booking-button" type="button">Continue</button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="booking-summary">
                <div>
                  <strong>{serviceLabel(serviceType)}</strong>
                  {priceCalc?.hours && <span>{priceCalc.sqftUsed} sqft - {priceCalc.hours}h</span>}
                  {priceCalc?.marketLabel && <span>{priceCalc.marketLabel}</span>}
                </div>
                <b>${priceCalc?.price.toFixed(2)}</b>
              </div>

              <div className="booking-grid two">
                <label style={{ gridColumn: '1 / -1' }}><span className="booking-label">Address *</span><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Apt 4B" className="booking-input" /></label>
                <label><span className="booking-label">City</span><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Newark" className="booking-input" /></label>
                <label><span className="booking-label">ZIP</span><input value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="08901" className="booking-input" /></label>
                <label><span className="booking-label">Date *</span><input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="booking-input" /></label>
                <label>
                  <span className="booking-label">Time *</span>
                  <select value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="booking-select">
                    <option value="">Select</option>
                    {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label style={{ gridColumn: '1 / -1' }}><span className="booking-label">Notes (optional)</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Access code, pets, special instructions..." className="booking-textarea" /></label>
              </div>

              {error && <div className="booking-error">{error}</div>}

              <div className="booking-actions" style={{ marginTop: 16 }}>
                <button onClick={() => setStep(1)} className="booking-button secondary" type="button">Back</button>
                <button onClick={handleSubmit} disabled={loading} className="booking-button" type="button">{loading ? 'Creating...' : 'Confirm Booking'}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
// force deploy 1778506052
