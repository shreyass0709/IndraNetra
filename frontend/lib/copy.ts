/**
 * Every user-facing string lives here (REBUILD_SPEC.md §11).
 *
 * The rule: 8th-grade English. No "telemetry", "vectors", "HUD", "provision",
 * "distress signal", "operational role". Say what happened and what to do about it.
 * Errors never blame the user and always suggest the fix.
 *
 * Phase 1 covers auth. Later phases extend this file rather than inlining strings.
 */

export const copy = {
  app: {
    name: 'IndraNetra',
    tagline: 'See how crowded your event is, in real time, and keep people safe.',
  },

  landing: {
    heroTitle: 'See how crowded your event is, in real time.',
    heroSubtitle:
      'IndraNetra shows where crowds are building, helps people get help fast, and points everyone to the nearest safe exit.',
    signIn: 'Sign in',
    getStarted: 'Create an account',
    features: {
      crowd: {
        title: 'Live crowd view',
        body: 'Watch how busy each area is as it happens, on one simple map.',
      },
      help: {
        title: 'Instant help',
        body: 'Attendees send an SOS in one tap; volunteers are sent straight to them.',
      },
      exits: {
        title: 'Safe exits',
        body: 'When an area gets crowded, everyone is guided to the nearest clear way out.',
      },
    },
  },

  login: {
    title: 'Sign in',
    subtitle: 'Welcome back.',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    submitting: 'Signing in…',
    forgot: 'Forgot your password?',
    noAccount: "Don't have an account?",
    signupLink: 'Create one',
    orGoogle: 'or',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    // Fallback only. The server's message is preferred when it sends one, because
    // it knows the actual reason (not verified, waiting for approval, and so on).
    failed: 'Could not sign you in. Please check your email and password.',
  },

  signup: {
    title: 'Create your account',
    subtitle: 'It takes about a minute.',
    name: 'Your name',
    email: 'Email',
    password: 'Password',
    passwordHint: 'At least 8 characters, with a letter and a number.',
    roleLabel: 'How will you use IndraNetra?',
    submit: 'Create account',
    submitting: 'Creating your account…',
    haveAccount: 'Already have an account?',
    loginLink: 'Sign in',
    failed: 'Could not create your account. Please try again.',
    checkEmail: {
      title: 'Check your email',
      body: (email: string) =>
        `We sent a confirmation link to ${email}. Click it to finish setting up your account.`,
      hint: "Can't find it? Look in your spam folder.",
    },
  },

  roles: {
    PUBLIC: {
      label: 'I am attending an event',
      description: 'See how busy it is, find the nearest exit, and ask for help.',
    },
    VOLUNTEER: {
      label: 'I want to help at an event',
      description: 'Respond to people who need help. An organizer adds you to their event.',
    },
    ORGANIZER: {
      label: 'I run events',
      description: 'Set up events, cameras, and your team. An admin approves your account.',
    },
  },

  waiting: {
    organizer: {
      title: 'Your account is waiting for approval',
      body: 'An administrator needs to approve your organizer account before you can set up events. We will email you as soon as that happens.',
    },
    volunteer: {
      title: 'You are not on an event yet',
      body: 'An organizer needs to add you to their event before you can start helping. We will email you when you are added.',
    },
  },

  errors: {
    network: 'Cannot reach the server. Check your connection and try again.',
    generic: 'Something went wrong. Please try again.',
  },

  common: {
    signOut: 'Sign out',
    back: 'Back',
  },

  // Sidebar labels. One label per feature (§2), plain English, reused across roles.
  nav: {
    dashboard: 'Overview',
    events: 'Events',
    monitoring: 'Live monitoring',
    emergency: 'Emergency',
    analytics: 'Analytics',
    users: 'People',
    settings: 'Settings',
    tasks: 'My tasks',
    report: 'Report an incident',
    sos: 'Get help',
    soon: 'Soon',
  },

  shell: {
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    collapse: 'Collapse sidebar',
    expand: 'Expand sidebar',
    toLight: 'Switch to light mode',
    toDark: 'Switch to dark mode',
    profile: 'Your profile',
    notifications: 'Notifications',
    noNotifications: "You're all caught up.",
    // Placeholder body for the per-role dashboards until their real pages land.
    comingSoon: 'This page is being built. Check back soon.',
  },
} as const;
