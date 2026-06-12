import { db } from '$lib/db';
import { polls, pollOptions, pollVotes } from '$lib/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';

export type PollOptionResult = {
  optionId: string;
  label: string;
  position: number;
  votes: number;
  percentage: number;
};

export type PollResults = {
  options: PollOptionResult[];
  totalVoters: number;
};

export async function upsertPoll(data: {
  id: string;
  articleId: string;
  question: string;
  options: { id: string; label: string }[];
  allowMultiple: boolean;
  closed: boolean;
}) {
  const { id, articleId, question, options, allowMultiple, closed } = data;

  await db
    .insert(polls)
    .values({ id, articleId, question, allowMultiple, closed })
    .onConflictDoUpdate({
      target: polls.id,
      set: { question, allowMultiple, closed, updatedAt: new Date() },
    });

  for (let i = 0; i < options.length; i++) {
    await db
      .insert(pollOptions)
      .values({ id: options[i].id, pollId: id, label: options[i].label, position: i })
      .onConflictDoUpdate({
        target: pollOptions.id,
        set: { label: options[i].label, position: i },
      });
  }
}

export async function getPollById(pollId: string) {
  return db.query.polls.findFirst({ where: eq(polls.id, pollId) });
}

export async function getPollResults(pollId: string): Promise<PollResults> {
  const opts = await db
    .select({
      id: pollOptions.id,
      label: pollOptions.label,
      position: pollOptions.position,
      voteCount: sql<number>`cast(count(${pollVotes.id}) as int)`,
    })
    .from(pollOptions)
    .leftJoin(pollVotes, eq(pollVotes.optionId, pollOptions.id))
    .where(eq(pollOptions.pollId, pollId))
    .groupBy(pollOptions.id, pollOptions.label, pollOptions.position)
    .orderBy(pollOptions.position);

  const [{ totalVoters }] = await db
    .select({
      totalVoters: sql<number>`cast(count(distinct ${pollVotes.readerId}) as int)`,
    })
    .from(pollVotes)
    .where(eq(pollVotes.pollId, pollId));

  const total = totalVoters ?? 0;

  return {
    options: opts.map((o) => ({
      optionId: o.id,
      label: o.label,
      position: o.position,
      votes: o.voteCount ?? 0,
      percentage: total > 0 ? Math.round(((o.voteCount ?? 0) / total) * 100) : 0,
    })),
    totalVoters: total,
  };
}

export async function getVoterOptions(pollId: string, readerId: string): Promise<string[]> {
  const rows = await db
    .select({ optionId: pollVotes.optionId })
    .from(pollVotes)
    .innerJoin(pollOptions, eq(pollVotes.optionId, pollOptions.id))
    .where(and(eq(pollOptions.pollId, pollId), eq(pollVotes.readerId, readerId)));
  return rows.map((r) => r.optionId);
}

export async function castVote(
  pollId: string,
  optionIds: string[],
  readerId: string,
): Promise<void> {
  // Validate all submitted options belong to this poll
  const validOpts = await db
    .select({ id: pollOptions.id })
    .from(pollOptions)
    .where(and(eq(pollOptions.pollId, pollId), inArray(pollOptions.id, optionIds)));

  if (validOpts.length !== optionIds.length) {
    throw new Error('Opzioni non valide per questo sondaggio');
  }

  // Delete previous votes for this reader+poll (change vote support)
  const existingVotes = await db
    .select({ optionId: pollVotes.optionId })
    .from(pollVotes)
    .innerJoin(pollOptions, eq(pollVotes.optionId, pollOptions.id))
    .where(and(eq(pollOptions.pollId, pollId), eq(pollVotes.readerId, readerId)));

  if (existingVotes.length > 0) {
    await db.delete(pollVotes).where(
      and(
        eq(pollVotes.readerId, readerId),
        inArray(
          pollVotes.optionId,
          existingVotes.map((v) => v.optionId),
        ),
      ),
    );
  }

  await db.insert(pollVotes).values(
    optionIds.map((optionId) => ({ pollId, optionId, readerId })),
  );
}

export async function getPollExportData(pollId: string) {
  return db
    .select({
      label: pollOptions.label,
      position: pollOptions.position,
      voteCount: sql<number>`cast(count(${pollVotes.id}) as int)`,
    })
    .from(pollOptions)
    .leftJoin(pollVotes, eq(pollVotes.optionId, pollOptions.id))
    .where(eq(pollOptions.pollId, pollId))
    .groupBy(pollOptions.id, pollOptions.label, pollOptions.position)
    .orderBy(pollOptions.position);
}
