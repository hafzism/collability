"use client";

import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/constants/landing";

export function FaqSection() {
  return (
    <section
      id="faqs"
      aria-labelledby="faq-title"
      className="relative overflow-hidden bg-black py-20 sm:py-32"
    >
      <Container className="relative flex flex-col gap-10">
        <SectionHeading
          titleId="faq-title"
          title="Frequently asked questions"
          description="Can't find what you're looking for? Reach out to our community on Discord or check our documentation."
          className="w-full max-w-3xl"
        />

        <Accordion type="single" collapsible className="mx-auto w-full max-w-3xl">
          {faqs.map((faq) => (
            <AccordionItem value={faq.question} key={faq.question}>
              <AccordionTrigger className="text-left text-white/90 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </section>
  );
}
