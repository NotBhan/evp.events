/**
 * Client-Side Booking Submission Service
 * Dispatches a CORS-safe simple POST request to the Google Apps Script Web App endpoint.
 *
 * NOTE: Uses 'Content-Type': 'text/plain;charset=utf-8' to bypass CORS preflight (OPTIONS)
 * as per Google Apps Script browser compatibility requirements.
 */

export interface BookingSubmissionPayload {
  passId: string;
  passType: string;
  quantity: number;
  unitPrice: number;
  total: number;
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  hp_company_field?: string; // Anti-spam honeypot
  bookingId?: string;
  timestamp?: string;
  source?: string;
}

export interface BookingSubmissionResponse {
  success: boolean;
  bookingId: string;
  passType: string;
  quantity: number;
  unitPrice: number;
  total: number;
  message?: string;
  error?: string;
  isMocked?: boolean;
}

/**
 * Generates a client-side enquiry request ID (e.g. RU26-REQ-4819).
 * Explicitly treated as an enquiry request identifier, not a confirmed ticket number.
 */
export function generateBookingRequestId(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `RU26-REQ-${randomDigits}`;
}

/**
 * Submits the booking request payload to the configured Google Apps Script Web App.
 */
export async function submitBookingRequest(
  payload: BookingSubmissionPayload
): Promise<BookingSubmissionResponse> {
  const bookingId = payload.bookingId || generateBookingRequestId();
  const timestamp = new Date().toISOString();
  const endpointUrl = process.env.NEXT_PUBLIC_BOOKING_SHEETS_ENDPOINT;

  // Preserve trimmed phone string (Code.gs validates and formats as plain text)
  const phone = payload.phone.trim();

  const submissionData = {
    ...payload,
    phone,
    bookingId,
    timestamp,
    source: 'Web Booking Desk (/booking)',
    hp_company_field: payload.hp_company_field || '', // Anti-spam honeypot
  };

  // If endpoint is not configured in local environment, provide transparent, safe fallback
  if (!endpointUrl || endpointUrl.trim() === '') {
    console.info(
      'NEXT_PUBLIC_BOOKING_SHEETS_ENDPOINT is not configured. Simulating successful Google Sheets record for development.'
    );
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate brief network delay
    return {
      success: true,
      bookingId,
      passType: payload.passType,
      quantity: payload.quantity,
      unitPrice: payload.unitPrice,
      total: payload.total,
      message: 'Booking request recorded successfully (Dev Mode)',
      isMocked: true,
    };
  }

  // Immediate offline check
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      success: false,
      bookingId,
      passType: payload.passType,
      quantity: payload.quantity,
      unitPrice: payload.unitPrice,
      total: payload.total,
      error: 'You appear to be offline. Please check your internet connection or use WhatsApp to send your request.',
    };
  }

  // 25 second timeout to safely accommodate high-latency mobile networks (2G/3G with Google Apps Script redirects)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    // Dispatch CORS-safe simple POST (text/plain;charset=utf-8 bypasses preflight OPTIONS)
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(submissionData),
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok && response.type !== 'opaque') {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    // Google Apps Script returns JSON or redirects
    let result: { status?: string; message?: string; total?: number; unitPrice?: number } = {};
    try {
      result = await response.json();
    } catch {
      // If response is opaque or plain text on redirect, assume successful reach if status is 200
      result = { status: 'success' };
    }

    const legacyPassIdMap: Record<string, string> = {
      'solo-female': 'pass-single',
      couple: 'pass-couple',
      vip: 'pass-vip',
      family: 'pass-season',
      group: 'pass-group',
    };

    if (result.status === 'error') {
      // Resilient fallback: If currently deployed Apps Script has older pass catalog, retry with mapped legacy ID
      const legacyId = legacyPassIdMap[payload.passId];
      if (result.message && result.message.toLowerCase().includes('unrecognized') && legacyId && legacyId !== payload.passId) {
        return submitBookingRequest({ ...payload, passId: legacyId });
      }

      return {
        success: false,
        bookingId,
        passType: payload.passType,
        quantity: payload.quantity,
        unitPrice: payload.unitPrice,
        total: payload.total,
        error: result.message || 'The reservation sheet could not process your request.',
      };
    }

    return {
      success: true,
      bookingId,
      passType: payload.passType,
      quantity: payload.quantity,
      unitPrice: result.unitPrice ?? payload.unitPrice,
      total: result.total ?? payload.total,
      message: result.message || 'Booking request recorded successfully',
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const errorMessage =
      err instanceof Error
        ? err.name === 'AbortError'
          ? 'Network request timed out. On slow networks (2G/3G), requests take longer. Your details have been preserved — please retry or continue via WhatsApp.'
          : err.message
        : 'Network connection failed. Please check your internet connection.';

    return {
      success: false,
      bookingId,
      passType: payload.passType,
      quantity: payload.quantity,
      unitPrice: payload.unitPrice,
      total: payload.total,
      error: errorMessage,
    };
  }
}
