export const partnerStats = [
  {
    value: "10,000+",
    label: "Engaged newsletter subscribers",
    highlight: true,
  },
  {
    value: "48%",
    label: "Avg. open rate",
    highlight: false,
  },
  {
    value: "5,000+",
    label: "Community members",
    highlight: false,
  },
] as const;

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
];
