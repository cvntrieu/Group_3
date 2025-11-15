import { NextResponse } from 'next/server';
import { AccessToken, type AccessTokenOptions, type VideoGrant } from 'livekit-server-sdk';
import { RoomConfiguration } from '@livekit/protocol';

export const DEFAULT_PROFANITY: string[] = ["ass",
  "asses",
  "asshole",
  "bastard",
  "bitch",
  "bloody",
  "bollocks",
  "bugger",
  "cock",
  "cocks",
  "cocksucker",
  "crap",
  "cunt",
  "damn",
  "dick",
  "douche",
  "dumb",
  "dumber",
  "dumbest",
  "fag",
  "faggot",
  "fuck",
  "fucked",
  "fucker",
  "fucking",
  "goddam",
  "goddamn",
  "goddamned",
  "hell"];

// Embedded noun and adjective lists to avoid depending on 'next/data'
const nouns: string[] = [
  "river", "mountain", "forest", "ocean", "field",
  "cloud", "stone", "tree", "bridge", "valley",
  "star", "island", "meadow", "desert", "canyon",
  "harbor", "grove", "prairie", "hill", "peak"
];

const adjectives: string[] = [
  "bright", "calm", "brave", "quiet", "swift",
  "gentle", "bold", "happy", "sly", "keen",
  "merry", "vivid", "lively", "fresh", "clear",
  "calm", "soft", "warm", "wild", "firm"
];

type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

// NOTE: you are expected to define the following environment variables in `.env.local`:
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

export type RandomIntFunction = (minInclusive: number, maxInclusive: number) => number;

function getCrypto(): Crypto | undefined {
  const g = typeof globalThis !== "undefined" ? (globalThis as unknown as { crypto?: Crypto }) : undefined;
  return g && g.crypto ? (g.crypto as Crypto) : undefined;
}

// Persistent fallback seed to avoid re-seeding within the same millisecond
let fallbackSeed: number = (Date.now() ^ 0x9e3779b9) >>> 0;

function nextFallback32(): number {
  // xorshift32 advancing persistent state
  fallbackSeed ^= fallbackSeed << 13; fallbackSeed >>>= 0;
  fallbackSeed ^= fallbackSeed >>> 17; fallbackSeed >>>= 0;
  fallbackSeed ^= fallbackSeed << 5; fallbackSeed >>>= 0;
  return fallbackSeed >>> 0;
}

function getRandomValues(length: number): Uint32Array {
  const cryptoApi = getCrypto();
  if (cryptoApi && typeof cryptoApi.getRandomValues === "function") {
    const buffer = new Uint32Array(length);
    cryptoApi.getRandomValues(buffer);
    return buffer;
  }
  const buffer = new Uint32Array(length);
  for (let i = 0; i < length; i++) {
    buffer[i] = nextFallback32();
  }
  return buffer;
}

export const getRandomInt: RandomIntFunction = (minInclusive: number, maxInclusive: number): number => {
  if (!Number.isFinite(minInclusive) || !Number.isFinite(maxInclusive)) {
    throw new Error("Invalid bounds for getRandomInt");
  }
  if (maxInclusive < minInclusive) {
    throw new Error("maxInclusive must be >= minInclusive");
  }
  if (minInclusive === maxInclusive) return minInclusive;

  const [rand] = getRandomValues(1);
  const range = maxInclusive - minInclusive + 1;
  return minInclusive + (rand % range);
};

const randomNumber = (maxNumber: number | undefined) => {
  let randomNumberString;
  switch (maxNumber) {
    case 1:
      randomNumberString = Math.floor(getRandomInt(1, 9)).toString();
      break;
    case 2:
      randomNumberString = Math.floor(getRandomInt(10, 90)).toString();
      break;
    case 3:
      randomNumberString = Math.floor(getRandomInt(100, 900)).toString();
      break;
    case 4:
      randomNumberString = Math.floor(getRandomInt(1000, 9000)).toString();
      break;
    case 5:
      randomNumberString = Math.floor(getRandomInt(10000, 90000)).toString();
      break;
    case 6:
      randomNumberString = Math.floor(getRandomInt(100000, 900000)).toString();
      break;
    default:
      randomNumberString = "";
      break;
  }
  return randomNumberString;
};

export function generateUsername(
  separator?: string,
  randomDigits?: number,
  length?: number,
  prefix?: string
): string {
  const nouns = safeNouns();
  const adjectives = safeAdjectives();
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const adjective = prefix ? prefix.replace(/\s{2,}/g, " ").replace(/\s/g, separator ?? "").toLocaleLowerCase() : adjectives[Math.floor(Math.random() * adjectives.length)];

  let username;
function safeNouns(): string[] {
  // Simple passthrough list; avoid reliance on an external profanity filter here.
  return nouns;
}

function safeAdjectives(): string[] {
  // Simple passthrough list for adjectives.
  return adjectives;
}
    
  username = adjective + noun + randomNumber(randomDigits);

  if (length) {
    return username.substring(0, length);
  }

  return username;
}

export interface ProfanityFilterOptions {
  // Treat substrings as matches (e.g., blacklist "ass" would filter "passion")
  // Defaults to false to avoid false positives. If true, checks for word boundaries when possible.
  matchSubstrings?: boolean;
  // Word boundary regex to use when matchSubstrings=false; default matches start/end or non-word chars
  wordBoundary?: string;
}

export function buildProfanityFilter(
  blocklist: string[],
  options?: ProfanityFilterOptions
): (word: string) => boolean {
  const normalized = blocklist
    .filter(Boolean)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0);

  const unique = Array.from(new Set(normalized));
  const useSubstring = options?.matchSubstrings === true;
  const boundary = options?.wordBoundary ?? "(?:^|[^a-z0-9])(?:%s)(?:$|[^a-z0-9])";

  const patterns: RegExp[] = unique.map((token) => {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (useSubstring) {
      return new RegExp(escaped, "i");
    }
    const pattern = boundary.replace("%s", escaped);
    return new RegExp(pattern, "i");
  });

  return (word: string): boolean => {
    if (!word) return false;
    const text = String(word).toLowerCase();
    return patterns.some((rx) => rx.test(text));
  };
}

function safeNouns(): string[] {
  const isBlocked = buildProfanityFilter(DEFAULT_PROFANITY);
  return nouns.filter((w) => !isBlocked(w));
}

// don't cache the results
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    if (LIVEKIT_URL === undefined) {
      throw new Error('LIVEKIT_URL is not defined');
    }
    if (API_KEY === undefined) {
      throw new Error('LIVEKIT_API_KEY is not defined');
    }
    if (API_SECRET === undefined) {
      throw new Error('LIVEKIT_API_SECRET is not defined');
    }

    // Parse agent configuration from request body
    const body = await req.json();
    const agentName: string = body?.room_config?.agents?.[0]?.agent_name;

    // Generate participant token
    let participantName = 'user';
    // const participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
    const participantIdentity = localStorage.getItem("chat_username");
    const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;

    if (!participantIdentity) {
      participantName = generateUsername();
      localStorage.setItem("chat_username", participantName);
    }
    else {
        // send_to_agent();
    }
    
    const participantToken = await createParticipantToken(
      { identity: participantIdentity, name: participantName },
      roomName,
      agentName
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName,
    };
    const headers = new Headers({
      'Cache-Control': 'no-store',
    });
    return NextResponse.json(data, { headers });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  agentName?: string
): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: '15m',
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);

  if (agentName) {
    at.roomConfig = new RoomConfiguration({
      agents: [{ agentName }],
    });
  }

  return at.toJwt();
}
