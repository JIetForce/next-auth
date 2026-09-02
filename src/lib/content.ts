export type FaqEntry = Readonly<{
  value: string;
  question: string;
  answer: string;
}>;

export const sharedFaqs: readonly FaqEntry[] = [
  {
    value: "faq-free",
    question: "Is Siftloom really free?",
    answer:
      "Yes, 100% free. We monetize through careful, relevant sponsorships with tools we actually like and use. We will never hide our core content behind a paywall.",
  },
  {
    value: "faq-frequency",
    question: "How often do you send updates?",
    answer:
      "We typically post high-signal updates on our Telegram channel a few times a week, and send a consolidated email newsletter weekly. We respect your inbox and only send when we have something truly valuable to share.",
  },
  {
    value: "faq-tools",
    question: "What kind of tools do you feature?",
    answer:
      "We feature everything from emerging AI agents and developer utilities to proven marketing platforms and no-code builders. If it saves time, reduces friction, or creates leverage for digital professionals, it's on our radar.",
  },
  {
    value: "faq-submit",
    question: "Can I submit a tool to be featured?",
    answer:
      "Absolutely. We have a dedicated submission process for founders and makers. Reach out to us directly via email and we'll evaluate if your product is a good fit for our audience.",
  },
  {
    value: "faq-different",
    question: "How is this different from other directories?",
    answer:
      "We don't just list tools; we curate them. Every tool we mention has been tested or rigorously vetted by our team to ensure it actually solves a problem without unnecessary bloat.",
  },
];
