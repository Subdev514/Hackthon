import { User, Room, Bug, Message } from './types';

export const MOCK_USER: User = {
  id: '1',
  name: 'Alex Rivera',
  email: 'alex@debugflow.ai',
  avatar: 'https://picsum.photos/seed/alex/100/100',
  role: 'admin',
  status: 'online',
};

export const MOCK_ROOMS: Room[] = [
  {
    id: 'r1',
    name: 'Authentication Service',
    description: 'Debugging JWT expiration issues in production.',
    activeUsers: 4,
    lastActive: '2m ago',
    status: 'active',
    tags: ['Backend', 'Security'],
  },
  {
    id: 'r2',
    name: 'Payment Gateway UI',
    description: 'Fixing checkout button alignment on mobile.',
    activeUsers: 2,
    lastActive: '15m ago',
    status: 'active',
    tags: ['Frontend', 'UI/UX'],
  },
  {
    id: 'r3',
    name: 'Data Pipeline Sync',
    description: 'Investigating latency in Redis cache invalidation.',
    activeUsers: 1,
    lastActive: '1h ago',
    status: 'active',
    tags: ['Infrastructure', 'Redis'],
  },
];

export const MOCK_BUGS: Bug[] = [
  {
    id: 'b1',
    title: 'Memory Leak in API Gateway',
    severity: 'critical',
    status: 'fixing',
    timestamp: '2024-03-20T10:00:00Z',
    room: 'Authentication Service',
  },
  {
    id: 'b2',
    title: 'Broken Image Links in Dashboard',
    severity: 'low',
    status: 'resolved',
    timestamp: '2024-03-20T09:30:00Z',
    room: 'Payment Gateway UI',
  },
  {
    id: 'b3',
    title: 'Slow Database Queries',
    severity: 'high',
    status: 'open',
    timestamp: '2024-03-20T08:45:00Z',
    room: 'Data Pipeline Sync',
  },
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    senderId: '1',
    senderName: 'Alex Rivera',
    senderAvatar: 'https://picsum.photos/seed/alex/100/100',
    content: "I'm seeing a lot of 500 errors in the logs for the auth service. Anyone else?",
    timestamp: '10:05 AM',
  },
  {
    id: 'm2',
    senderId: 'ai',
    senderName: 'DebugAI',
    senderAvatar: 'https://picsum.photos/seed/ai/100/100',
    content: "I've analyzed the logs. It seems the Redis connection is timing out. Would you like me to check the configuration?",
    timestamp: '10:06 AM',
    isAI: true,
  },
];
