/**
 * Centralized Cancellation & GST Refund Policy Constants & Financial Calculation
 * Authoritative client-confirmed rules:
 * - Applicable GST: 18% inclusive
 * - Cancellation Deadline: 6 October 2026, 23:59:59 IST
 * - Calculation in integer paise (smallest currency unit)
 */

export const CANCELLATION_DEADLINE_ISO = '2026-10-06T23:59:59+05:30';
export const CANCELLATION_DEADLINE_DISPLAY = '6 October 2026, 11:59 PM IST';
export const GST_RATE_PERCENT = 18;

export interface RefundCalculation {
  grossPaise: number;
  gstPaise: number;
  refundPaise: number;
  grossRupees: number;
  gstRupees: number;
  refundRupees: number;
  grossFormatted: string;
  gstFormatted: string;
  refundFormatted: string;
  gstRate: number;
  formula: string;
}

/**
 * Server-authoritative cancellation deadline validation.
 * Allows cancellation up to and including 2026-10-06T23:59:59+05:30.
 */
export function isCancellationAllowed(currentDate?: Date): boolean {
  const now = currentDate || new Date();
  const deadline = new Date(CANCELLATION_DEADLINE_ISO);
  return now.getTime() <= deadline.getTime();
}

/**
 * Authoritative GST and refund calculation for GST-inclusive pass amounts.
 *
 * Mathematical formula:
 * GST component = Gross Amount × 18 / 118
 * Net refund amount = Gross Amount - GST component = Gross Amount × 100 / 118
 *
 * Implemented in integer paise to completely eliminate floating-point precision error:
 * 1. grossPaise = Math.round(grossRupees * 100)
 * 2. gstPaise = Math.round((grossPaise * 18) / 118)
 * 3. refundPaise = grossPaise - gstPaise
 *
 * Verified exact outputs:
 * - ₹999   -> GST ₹152.39, Refund ₹846.61
 * - ₹1,499 -> GST ₹228.66, Refund ₹1,270.34
 * - ₹1,999 -> GST ₹304.93, Refund ₹1,694.07
 * - ₹3,599 -> GST ₹549.00, Refund ₹3,050.00
 * - ₹4,999 -> GST ₹762.56, Refund ₹4,236.44
 */
export function calculateGstAndRefund(grossRupees: number): RefundCalculation {
  const grossPaise = Math.round(grossRupees * 100);
  const gstPaise = Math.round((grossPaise * GST_RATE_PERCENT) / (100 + GST_RATE_PERCENT));
  const refundPaise = grossPaise - gstPaise;

  const grossCalculated = grossPaise / 100;
  const gstRupees = gstPaise / 100;
  const refundRupees = refundPaise / 100;

  return {
    grossPaise,
    gstPaise,
    refundPaise,
    grossRupees: grossCalculated,
    gstRupees,
    refundRupees,
    grossFormatted: grossCalculated.toFixed(2),
    gstFormatted: gstRupees.toFixed(2),
    refundFormatted: refundRupees.toFixed(2),
    gstRate: GST_RATE_PERCENT,
    formula: 'Gross Paid Amount × 100 / 118',
  };
}
