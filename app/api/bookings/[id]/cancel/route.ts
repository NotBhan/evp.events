import 'server-only';
import { prisma } from '@/lib/db';
import { getAuthorizedBookingIdsFromCookie } from '@/lib/session';
import { cancelConfirmedBooking, CancellationError } from '@/lib/cancellation';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const requestedId = resolvedParams.id?.trim();

  if (!requestedId) {
    return Response.json(
      { success: false, error: 'Booking ID parameter is required.' },
      { status: 400 }
    );
  }

  // 1. Validate temporary lookup session from HTTP-only cookie
  const authorizedIds = await getAuthorizedBookingIdsFromCookie();
  if (!authorizedIds || authorizedIds.length === 0) {
    return Response.json(
      {
        success: false,
        error: 'Unauthorized: Lookup session required to cancel booking.',
      },
      { status: 401 }
    );
  }

  // 2. Strict authorization check: requested ID must be authorized by this session
  let targetPublicId = requestedId;
  if (!authorizedIds.includes(requestedId)) {
    const matchingBooking = await prisma.booking.findUnique({
      where: { id: requestedId },
      select: { publicId: true },
    });
    if (!matchingBooking || !authorizedIds.includes(matchingBooking.publicId)) {
      return Response.json(
        {
          success: false,
          error: 'Forbidden: You do not have permission to cancel this reservation.',
        },
        { status: 403 }
      );
    }
    targetPublicId = matchingBooking.publicId;
  }

  try {
    const result = await cancelConfirmedBooking(targetPublicId, authorizedIds);

    return Response.json({
      success: true,
      alreadyCancelled: result.alreadyCancelled,
      message: result.message,
      booking: result.booking,
      refund: result.refund,
    });
  } catch (err: unknown) {
    if (err instanceof CancellationError) {
      return Response.json(
        { success: false, error: err.message },
        { status: err.statusCode }
      );
    }

    console.error(
      '[Cancellation Error]',
      err instanceof Error ? err.message : 'Unknown server error'
    );
    return Response.json(
      {
        success: false,
        error: 'An unexpected error occurred while processing cancellation. Please try again.',
      },
      { status: 500 }
    );
  }
}
