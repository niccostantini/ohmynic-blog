import { error } from '@sveltejs/kit';
import { getPollById, getPollExportData } from '$lib/db/queries/polls';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');

  const poll = await getPollById(params.pollId);
  if (!poll) error(404, 'Sondaggio non trovato');

  const rows = await getPollExportData(params.pollId);
  const totalOptionVotes = rows.reduce((sum, r) => sum + (r.voteCount ?? 0), 0);

  const lines = [
    'Opzione,Voti,Percentuale',
    ...rows.map((r) => {
      const pct = totalOptionVotes > 0 ? Math.round(((r.voteCount ?? 0) / totalOptionVotes) * 100) : 0;
      return `"${r.label.replace(/"/g, '""')}",${r.voteCount ?? 0},${pct}%`;
    }),
    `"TOTALE",${totalOptionVotes},100%`,
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sondaggio-${params.pollId.slice(0, 8)}.csv"`,
    },
  });
};
