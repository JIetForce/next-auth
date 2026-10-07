export const CONTACT_EMAIL = "hello@siftloom.xyz";

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
      "Yes. Siftloom is free to read and always will be. We plan to fund it through clearly labelled sponsorships, never a paywall.",
  },
  {
    value: "faq-follow",
    question: "Where can I follow Siftloom?",
    answer:
      "On X at @siftloom. That's where new finds are shared first, along with a short note on why each one made the cut.",
  },
  {
    value: "faq-tools",
    question: "What kind of tools do you feature?",
    answer:
      "Anything that saves time or removes friction for people who build and sell online: AI agents, developer utilities, automation platforms, SaaS apps and growth tools.",
  },
  {
    value: "faq-submit",
    question: "Can I submit a tool to be featured?",
    answer: `Yes. Email it to ${CONTACT_EMAIL} or send it to us on X. Every submission is judged against the same criteria as everything else we feature, and sponsorship never buys a spot.`,
  },
  {
    value: "faq-different",
    question: "How is this different from other directories?",
    answer:
      "We don't try to list everything. A tool is featured only when it solves a concrete problem, does it without unnecessary bloat, and is worth what it costs.",
  },
];
