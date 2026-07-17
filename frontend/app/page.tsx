'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Map, LifeBuoy, DoorOpen } from 'lucide-react';
import { copy } from '../lib/copy';
import { Card, CardBody } from '../components/ui/Card';

const features = [
  { icon: Map, ...copy.landing.features.crowd },
  { icon: LifeBuoy, ...copy.landing.features.help },
  { icon: DoorOpen, ...copy.landing.features.exits },
];

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-screen-xl items-center justify-between px-6 py-5">
        <span className="text-lg font-semibold tracking-tight text-foreground">
          {copy.app.name}
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            {copy.landing.signIn}
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            {copy.landing.getStarted}
          </Link>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col items-center px-6 py-16 text-center sm:py-24">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
        >
          {copy.landing.heroTitle}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="mt-5 max-w-2xl text-lg text-muted-foreground"
        >
          {copy.landing.heroSubtitle}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          className="mt-8"
        >
          <Link
            href="/signup"
            className="inline-flex rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition hover:opacity-90"
          >
            {copy.landing.getStarted}
          </Link>
        </motion.div>

        <div className="mt-16 grid w-full gap-4 sm:mt-24 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
            >
              <Card className="h-full text-left">
                <CardBody>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 font-semibold text-foreground">{title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
