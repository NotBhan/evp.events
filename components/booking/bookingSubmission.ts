/**
 * Client-Side Booking Submission Service
 * Dispatches an authoritative booking creation request to the Next.js API (/api/bookings).
 * Neon PostgreSQL serves as the single authoritative transactional database.
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
  recoveryToken?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';
  paymentStatus?: 'NOT_STARTED' | 'PENDING' | 'FAILED' | 'PAID';
  createdAt?: string;
  expiresAt?: string;
  message?: string;
  error?: string;
  isMocked?: boolean;
}

/**
 * Generates a client-side enquiry request ID (e.g. RU26-REQ-4819).
 * Preserved for client session references prior to server-authoritative issuance.
 */
export function generateBookingRequestId(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `RU26-REQ-${randomDigits}`;
}

/**
 * Submits the booking request payload to the authoritative /api/bookings endpoint.
 */
export async function submitBookingRequest(
  payload: BookingSubmissionPayload
): Promise<BookingSubmissionResponse> {
  // Immediate offline check
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      success: false,
      bookingId: payload.bookingId || generateBookingRequestId(),
      passType: payload.passType,
      quantity: payload.quantity,
      unitPrice: payload.unitPrice,
      total: payload.total,
      error:
        'You appear to be offline. Please check your internet connection or use WhatsApp to send your request.',
    };
  }

  // 20 second timeout for mobile network resilience
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        passId: payload.passId,
        quantity: payload.quantity,
        fullName: payload.fullName,
        phone: payload.phone,
        email: payload.email,
        city: payload.city,
        hp_company_field: payload.hp_company_field,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      return {
        success: false,
        bookingId: payload.bookingId || '',
        passType: payload.passType,
        quantity: payload.quantity,
        unitPrice: payload.unitPrice,
        total: payload.total,
        error:
          data?.error ||
          'Unable to record your booking request in the reservation system. Please try again.',
      };
    }

    // Return authoritative booking details from server
    return {
      success: true,
      bookingId: data.bookingId,
      passType: data.passType || payload.passType,
      quantity: data.quantity ?? payload.quantity,
      unitPrice: data.unitPrice ?? payload.unitPrice,
      total: data.total ?? data.totalAmount ?? payload.total,
      recoveryToken: data.recoveryToken,
      status: data.status,
      paymentStatus: data.paymentStatus,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
      message: data.message || 'Booking request recorded successfully',
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const errorMessage =
      err instanceof Error
        ? err.name === 'AbortError'
          ? 'Network request timed out. On slow networks, requests may take longer. Your details have been preserved — please retry or continue via WhatsApp.'
          : err.message
        : 'Network connection failed. Please check your internet connection.';

    return {
      success: false,
      bookingId: payload.bookingId || '',
      passType: payload.passType,
      quantity: payload.quantity,
      unitPrice: payload.unitPrice,
      total: payload.total,
      error: errorMessage,
    };
  }
}
