import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Room, RoomEvent, TokenSource } from 'livekit-client';
import { AppConfig } from '@/app-config';
import { toastAlert } from '@/components/livekit/alert-toast';

export const DEFAULT_PROFANITY: string[] = [
  'ass',
  'asses',
  'asshole',
  'bastard',
  'bitch',
  'bloody',
  'bollocks',
  'bugger',
  'cock',
  'cocks',
  'cocksucker',
  'crap',
  'cunt',
  'damn',
  'dick',
  'douche',
  'dumb',
  'dumber',
  'dumbest',
  'fag',
  'faggot',
  'fuck',
  'fucked',
  'fucker',
  'fucking',
  'goddam',
  'goddamn',
  'goddamned',
  'hell',
];

// Embedded noun and adjective lists to avoid depending on 'next/data'
const nouns: string[] = [
  'river',
  'mountain',
  'forest',
  'ocean',
  'field',
  'cloud',
  'stone',
  'tree',
  'bridge',
  'valley',
  'star',
  'island',
  'meadow',
  'desert',
  'canyon',
  'harbor',
  'grove',
  'prairie',
  'hill',
  'peak',
];

const adjectives: string[] = [
  'bright',
  'calm',
  'brave',
  'quiet',
  'swift',
  'gentle',
  'bold',
  'happy',
  'sly',
  'keen',
  'merry',
  'vivid',
  'lively',
  'fresh',
  'clear',
  'calm',
  'soft',
  'warm',
  'wild',
  'firm',
];

export type RandomIntFunction = (minInclusive: number, maxInclusive: number) => number;

function getCrypto(): Crypto | undefined {
  const g =
    typeof globalThis !== 'undefined' ? (globalThis as unknown as { crypto?: Crypto }) : undefined;
  return g && g.crypto ? (g.crypto as Crypto) : undefined;
}

// Persistent fallback seed to avoid re-seeding within the same millisecond
let fallbackSeed: number = (Date.now() ^ 0x9e3779b9) >>> 0;

function nextFallback32(): number {
  // xorshift32 advancing persistent state
  fallbackSeed ^= fallbackSeed << 13;
  fallbackSeed >>>= 0;
  fallbackSeed ^= fallbackSeed >>> 17;
  fallbackSeed >>>= 0;
  fallbackSeed ^= fallbackSeed << 5;
  fallbackSeed >>>= 0;
  return fallbackSeed >>> 0;
}

function getRandomValues(length: number): Uint32Array {
  const cryptoApi = getCrypto();
  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
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

export const getRandomInt: RandomIntFunction = (
  minInclusive: number,
  maxInclusive: number
): number => {
  if (!Number.isFinite(minInclusive) || !Number.isFinite(maxInclusive)) {
    throw new Error('Invalid bounds for getRandomInt');
  }
  if (maxInclusive < minInclusive) {
    throw new Error('maxInclusive must be >= minInclusive');
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
      randomNumberString = '';
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
  const nounList = safeNouns();
  const profanityFilter = buildProfanityFilter(DEFAULT_PROFANITY);
  const adjectiveList = adjectives.filter((w) => !profanityFilter(w));
  const noun = nounList[Math.floor(Math.random() * Math.max(1, nounList.length))];
  const adjective = prefix
    ? prefix
        .replace(/\s{2,}/g, ' ')
        .replace(/\s/g, separator ?? '')
        .toLocaleLowerCase()
    : adjectiveList[Math.floor(Math.random() * Math.max(1, adjectiveList.length))];

  let username = '';
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
  const boundary = options?.wordBoundary ?? '(?:^|[^a-z0-9])(?:%s)(?:$|[^a-z0-9])';

  const patterns: RegExp[] = unique.map((token) => {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (useSubstring) {
      return new RegExp(escaped, 'i');
    }
    const pattern = boundary.replace('%s', escaped);
    return new RegExp(pattern, 'i');
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

export function useRoom(appConfig: AppConfig) {
  const aborted = useRef(false);
  const room = useMemo(() => new Room(), []);
  const [isSessionActive, setIsSessionActive] = useState(false);

  useEffect(() => {
    function onDisconnected() {
      setIsSessionActive(false);
    }

    function onMediaDevicesError(error: Error) {
      toastAlert({
        title: 'Encountered an error with your media devices',
        description: `${error.name}: ${error.message}`,
      });
    }

    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);

    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room]);

  useEffect(() => {
    return () => {
      aborted.current = true;
      room.disconnect();
    };
  }, [room]);

  const tokenSource = useMemo(
    () =>
      TokenSource.custom(async () => {
        const url = new URL(
          process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details',
          window.location.origin
        );

        try {
          let identity = localStorage.getItem('username');
          if (!identity) {
            identity = generateUsername('_', 3, 20);
            localStorage.setItem('username', identity);
          }

          const res = await fetch(url.toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Sandbox-Id': appConfig.sandboxId ?? '',
            },
            body: JSON.stringify({
              participant_identity: identity,
              room_config: appConfig.agentName
                ? {
                    agents: [{ agent_name: appConfig.agentName }],
                  }
                : undefined,
            }),
          });
          return await res.json();
        } catch (error) {
          console.error('Error fetching connection details:', error);
          throw new Error('Error fetching connection details!');
        }
      }),
    [appConfig]
  );

  const startSession = useCallback(() => {
    setIsSessionActive(true);

    if (room.state === 'disconnected') {
      const { isPreConnectBufferEnabled } = appConfig;
      Promise.all([
        room.localParticipant.setMicrophoneEnabled(true, undefined, {
          preConnectBuffer: isPreConnectBufferEnabled,
        }),
        tokenSource
          .fetch({ agentName: appConfig.agentName })
          .then((connectionDetails) =>
            room.connect(connectionDetails.serverUrl, connectionDetails.participantToken)
          ),
      ]).catch((error) => {
        if (aborted.current) {
          // Once the effect has cleaned up after itself, drop any errors
          //
          // These errors are likely caused by this effect rerunning rapidly,
          // resulting in a previous run `disconnect` running in parallel with
          // a current run `connect`
          return;
        }

        toastAlert({
          title: 'There was an error connecting to the agent',
          description: `${error.name}: ${error.message}`,
        });
      });
    }
  }, [room, appConfig, tokenSource]);

  const endSession = useCallback(() => {
    setIsSessionActive(false);
  }, []);

  return { room, isSessionActive, startSession, endSession };
}
