export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'member';
  status: 'online' | 'offline' | 'away';
}

export interface Room {
  id: string;
  name: string;
  description: string;
  activeUsers: number;
  lastActive: string;
  status: 'active' | 'archived';
  tags: string[];
}

export interface Bug {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'fixing' | 'resolved';
  timestamp: string;
  room: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isAI?: boolean;
}

export interface NavItem {
  label: string;
  icon: string;
  path: string;
}
