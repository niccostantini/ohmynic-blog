import { deleteReaderSession } from '$lib/db/queries/readers';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
  const sessionId = cookies.get('reader_session');
  if (sessionId) {
    await deleteReaderSession(sessionId);
    cookies.delete('reader_session', { path: '/' });
  }
  return new Response(null, { status: 204 });
};
