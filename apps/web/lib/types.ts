export type UserRole = 'owner' | 'family';
export type MemberStatus = 'pending' | 'approved' | 'revoked';
export type DeviceType = 'tv' | 'browser' | 'mobile';
export type PairingStatus = 'pending' | 'paired' | 'expired';
export type TransitionStyle = 'fade' | 'crossfade' | 'slide' | 'ken_burns';
export type SlideshowFit = 'cover' | 'contain' | 'smart_fill';

export interface Profile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  id: string;
  ownerId: string;
  userId: string | null;
  invitedEmail: string;
  role: UserRole;
  status: MemberStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DriveConnection {
  id: string;
  ownerId: string;
  driveUserEmail: string;
  rootFolderId: string;
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncedAt: string | null;
  syncErrorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DriveItem {
  id: string;
  fileId: string;
  ownerId?: string;
  name: string;
  mimeType: string;
  parentId: string | null;
  size: number;
  driveCreatedTime?: string | null;
  driveModifiedTime?: string | null;
  thumbnailLink: string | null;
  width: number | null;
  height: number | null;
  isFolder: boolean;
  trashed: boolean;
  metadataJson?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Album {
  id: string;
  ownerId?: string;
  folderId: string;
  title: string;
  description: string | null;
  coverFileId: string | null;
  coverThumbnailUrl?: string | null;
  photoCount: number;
  isHidden: boolean;
  customOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TVFocusableNode {
  id: string;
  ref: HTMLElement;
  row: number;
  col: number;
  label?: string;
  onSelect?: () => void;
  onBack?: () => void;
}
