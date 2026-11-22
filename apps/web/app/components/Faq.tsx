const FAQS = [
  {
    question: "Does Cognitive Mode work with the free version of ChatGPT?",
    answer:
      "Yes. It works in the browser with ChatGPT, Claude, Gemini, Perplexity and DeepSeek, on free or paid accounts. It adds a short hint-level instruction to the message you send, so the AI you already use writes the hint.",
  },
  {
    question: "Do I need an API key or an account?",
    answer: "No. There is no API key, no sign-up and no paid tier. Install the extension and open a problem.",
  },
  {
    question: "Which practice sites does it support?",
    answer:
      "LeetCode, GeeksforGeeks and takeUforward practice pages, including the problems on Striver's A2Z sheet.",
  },
  {
    question: "What data leaves my browser?",
    answer:
      "Nothing from Cognitive Mode. Your practice history, settings and notes are stored in Chrome's local extension storage on your device. The only thing an AI sees is the message you choose to send, including the hint instructions, which stay visible in the chat.",
  },
  {
    question: "How is this different from LeetCode's built-in hints or ChatGPT Study Mode?",
    answer:
      "Built-in hints are fixed, and Study Mode is a separate tutoring mode you switch on per chat. Cognitive Mode works across the AIs you already use, lets you choose exactly how much help each question gets, and remembers which problems you solved clean so it can bring the others back.",
  },
  {
    question: "Will it slow me down?",
    answer:
      "No. Practice mode has no timers or forms. When you ask an AI about the problem you're on, you pick a hint level with one keypress, or send your message as is.",
  },
  {
    question: "What if I really need the full solution?",
    answer:
      "Pick level 4. It's logged as needing the solution, and the problem comes back in 3 days for a clean re-solve. Reading a solution once isn't the same as being able to write it in an interview.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default function Faq() {
  return (
    <section aria-labelledby="faq-title" className="mx-auto w-full max-w-5xl px-6 pb-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="mb-8 flex flex-col gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">questions</p>
        <h2 id="faq-title" className="font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Frequently asked
        </h2>
      </div>
      <div className="divide-y divide-border rounded-2xl border border-border">
        {FAQS.map((item) => (
          <details key={item.question} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-foreground">
              {item.question}
              <span aria-hidden className="font-mono text-muted transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
