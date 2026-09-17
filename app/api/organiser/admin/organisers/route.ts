import 'server-only';
import { prisma } from '@/lib/db';
import { getActiveOrganiserFromRequest } from '@/lib/organiser-auth';
import {
  hashCredential,
  validatePassword,
  normalizeLoginId,
  normalizeGateId,
  isGateIdAllowed,
} from '@/lib/organiser-credentials';
import { isSameOriginRequest } from '@/lib/request-origin';

const ROLES = new Set(['ENTRY_SCANNER', 'ADMIN']);

function unauthorized() {
  return Response.json(
    { success: false, code: 'ORGANISER_SESSION_EXPIRED', error: 'Organiser session required.' },
    { status: 401 }
  );
}

function forbidden() {
  return Response.json(
    { success: false, code: 'FORBIDDEN', error: 'Administrator privileges are required.' },
    { status: 403 }
  );
}

/** ADMIN-only guard: role is re-read from Neon on every request, never trusted from the client. */
async function requireAdmin() {
  const organiser = await getActiveOrganiserFromRequest();
  if (!organiser) return { error: unauthorized() as Response, organiser: null };
  if (organiser.role !== 'ADMIN') return { error: forbidden() as Response, organiser: null };
  return { error: null, organiser };
}

function serializeOrganiser(organiser: {
  loginId: string;
  name: string;
  role: string;
  gateId: string;
  active: boolean;
  lastLoginAt: Date | null;
  lockedUntil: Date | null;
  createdAt: Date;
}) {
  return {
    loginId: organiser.loginId,
    name: organiser.name,
    role: organiser.role,
    gateId: organiser.gateId,
    active: organiser.active,
    lastLoginAt: organiser.lastLoginAt ? organiser.lastLoginAt.toISOString() : null,
    lockedUntil: organiser.lockedUntil ? organiser.lockedUntil.toISOString() : null,
    createdAt: organiser.createdAt.toISOString(),
  };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  // Service/developer accounts are hidden from the organiser-facing panel entirely.
  const organisers = await prisma.organiser.findMany({
    where: { hidden: false },
    orderBy: { loginId: 'asc' },
  });
  return Response.json({ success: true, organisers: organisers.map(serializeOrganiser) });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSameOriginRequest(req)) {
    return Response.json(
      { success: false, code: 'ORIGIN_REJECTED', error: 'Request origin validation failed.' },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { success: false, code: 'INVALID_REQUEST', error: 'Invalid JSON request payload.' },
      { status: 400 }
    );
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 2 || name.length > 80) {
    return Response.json(
      { success: false, code: 'INVALID_NAME', error: 'Name must be 2–80 characters.' },
      { status: 400 }
    );
  }

  const loginId = normalizeLoginId(body.loginId);
  if (!loginId) {
    return Response.json(
      {
        success: false,
        code: 'INVALID_LOGIN_ID',
        error: 'Login id must be 3–64 characters (a–z, 0–9, ".", "_", "-").',
      },
      { status: 400 }
    );
  }

  const role = typeof body.role === 'string' ? body.role.toUpperCase() : 'ENTRY_SCANNER';
  if (!ROLES.has(role)) {
    return Response.json(
      { success: false, code: 'INVALID_ROLE', error: 'Role must be ENTRY_SCANNER or ADMIN.' },
      { status: 400 }
    );
  }

  const gateId = normalizeGateId(body.gateId);
  if (!gateId) {
    return Response.json(
      { success: false, code: 'INVALID_GATE_ID', error: 'Provide a valid gate id (e.g. GATE-01).' },
      { status: 400 }
    );
  }
  if (!isGateIdAllowed(gateId)) {
    return Response.json(
      { success: false, code: 'GATE_NOT_ALLOWED', error: 'This gate id is not permitted.' },
      { status: 400 }
    );
  }

  const passwordError = validatePassword(body.password);
  if (passwordError) {
    return Response.json({ success: false, code: 'INVALID_PASSWORD', error: passwordError }, { status: 400 });
  }

  const existing = await prisma.organiser.findUnique({ where: { loginId } });
  if (existing) {
    return Response.json(
      { success: false, code: 'LOGIN_ID_TAKEN', error: 'An organiser with this login id already exists.' },
      { status: 409 }
    );
  }

  const created = await prisma.organiser.create({
    data: {
      name,
      loginId,
      credentialHash: await hashCredential(String(body.password)),
      role: role as 'ENTRY_SCANNER' | 'ADMIN',
      gateId,
      active: true,
    },
  });

  return Response.json({ success: true, organiser: serializeOrganiser(created) }, { status: 201 });
}

export async function PATCH(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSameOriginRequest(req)) {
    return Response.json(
      { success: false, code: 'ORIGIN_REJECTED', error: 'Request origin validation failed.' },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { success: false, code: 'INVALID_REQUEST', error: 'Invalid JSON request payload.' },
      { status: 400 }
    );
  }

  const loginId = normalizeLoginId(body.loginId);
  if (!loginId) {
    return Response.json(
      { success: false, code: 'INVALID_LOGIN_ID', error: 'A valid organiser login id is required.' },
      { status: 400 }
    );
  }

  // Hidden (service/developer) accounts cannot be targeted from the panel either.
  const organiser = await prisma.organiser.findFirst({ where: { loginId, hidden: false } });
  if (!organiser) {
    return Response.json(
      { success: false, code: 'NOT_FOUND', error: 'Organiser not found.' },
      { status: 404 }
    );
  }

  const action = typeof body.action === 'string' ? body.action : '';
  const data: Record<string, unknown> = {};

  switch (action) {
    case 'deactivate':
      data.active = false;
      break;
    case 'reactivate':
      data.active = true;
      break;
    case 'set-gate': {
      const gateId = normalizeGateId(body.gateId);
      if (!gateId) {
        return Response.json(
          { success: false, code: 'INVALID_GATE_ID', error: 'Provide a valid gate id (e.g. GATE-01).' },
          { status: 400 }
        );
      }
      if (!isGateIdAllowed(gateId)) {
        return Response.json(
          { success: false, code: 'GATE_NOT_ALLOWED', error: 'This gate id is not permitted.' },
          { status: 400 }
        );
      }
      data.gateId = gateId;
      break;
    }
    case 'reset-credential': {
      const passwordError = validatePassword(body.password);
      if (passwordError) {
        return Response.json(
          { success: false, code: 'INVALID_PASSWORD', error: passwordError },
          { status: 400 }
        );
      }
      data.credentialHash = await hashCredential(String(body.password));
      data.failedLoginAttempts = 0;
      data.lockedUntil = null;
      break;
    }
    default:
      return Response.json(
        {
          success: false,
          code: 'INVALID_ACTION',
          error: 'action must be one of: deactivate, reactivate, set-gate, reset-credential.',
        },
        { status: 400 }
      );
  }

  const updated = await prisma.organiser.update({ where: { id: organiser.id }, data });
  return Response.json({ success: true, organiser: serializeOrganiser(updated) });
}
