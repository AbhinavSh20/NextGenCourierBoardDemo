const QUESTIONS = [
  "Do you have a valid driver's license and a clean driving record?",
  "What vehicle would you use for this job, and do you own or lease it?",
  "Which days and hours are you available to work?",
  "How much delivery or driving experience do you have?",
  "Are you based near this job's location, and how far are you willing to travel?",
];

const field = (v: unknown, max: number) =>
  typeof v === "string" && v.length <= max ? v.trim() : null;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const jobId = field(body?.jobId, 100);
  const name = field(body?.name, 100);
  const email = field(body?.email, 200);
  const sessionId = field(body?.sessionId, 100);
  const message = field(body?.message, 1000);

  if (!jobId || !name || !email || !sessionId || message === null) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  // Stub: swap for the Angie call. Response contract: { reply, step?, total?, done?, outcome? }.
  // `turn` (candidate messages so far) exists only so this stateless stub knows which question is next.
  const turn = Number.isInteger(body?.turn) ? Math.min(Math.max(body.turn, 0), 50) : message ? 1 : 0;
  const total = QUESTIONS.length;
  const first = name.split(" ")[0];

  if (turn >= total) {
    return Response.json({
      reply: `Thanks ${first}, that's everything I need. I'll review your answers and email you the result.`,
      step: total,
      total,
      done: true,
    });
  }

  const lead = turn === 0 ? `Hi ${first}, I'm Angie. Let's get started. ` : "Thanks. ";
  return Response.json({ reply: lead + QUESTIONS[turn], step: turn + 1, total });
}
