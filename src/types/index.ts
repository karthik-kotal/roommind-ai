export type RoomType =
  | 'BEDROOM'
  | 'LIVING_ROOM'
  | 'KITCHEN'
  | 'DINING_ROOM'
  | 'OFFICE'
  | 'STUDY_ROOM'
  | 'OTHER';

export type ScanStatus = 'CREATED' | 'IN_PROGRESS' | 'COMPLETED';

export type SurfaceType = 'WALL_1' | 'WALL_2' | 'WALL_3' | 'WALL_4' | 'FLOOR' | 'CEILING';

export type StylePackage = 'STANDARD' | 'MODERN' | 'LUXURY';

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  bio?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface CreateRoomRequest {
  name: string;
  type: RoomType;
  length?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface Room {
  id: number;
  userId: number;
  name: string;
  type: RoomType;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  createdAt: string;
  updatedAt: string;
  scanCount?: number;
}

export interface ScanImage {
  id: number;
  surfaceType: SurfaceType;
  filePath: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  width?: number;
  height?: number;
  blurScore?: number;
  createdAt: string;
}

export interface RoomScan {
  id: number;
  roomId: number;
  status: ScanStatus;
  createdAt: string;
  completedAt?: string;
  images: ScanImage[];
}

export interface RoomAnalysis {
  id: number;
  roomScanId: number;
  detectedWallCategory: string;
  wallModelScore: number;
  detectedFloorCategory: string;
  floorModelScore: number;
  openingsDetectedJson: string;
  furnitureDetectedJson: string;
  rawVisionOutputJson: string;
  createdAt: string;
}

export interface RoomDesign {
  id: number;
  roomId: number;
  stylePackage: StylePackage;
  wallRecommendationsJson: string;
  compatibilityBreakdownJson: string;
  overallCompatibilityScore: number;
  subtotalCostInr: number;
  taxRatePercent: number;
  taxAmountInr: number;
  estimatedTotalCostInr: number;
  versionNumber?: number;
  isFavorite?: boolean;
  parentDesignId?: number | null;
  surfaceCustomizationMapJson?: string;
  costDisclaimer: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ImageQualityResult {
  isValid: boolean;
  isUsable?: boolean;
  blurScore: number;
  brightness: number;
  contrast: number;
  width: number;
  height: number;
  message?: string;
}

export interface OrientationData {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  isSupported?: boolean;
  permissionGranted?: boolean;
}

export interface SurfaceInstruction {
  surfaceType: SurfaceType;
  stepNumber: string;
  title: string;
  instruction: string;
  targetYaw: number;
  targetPitch: number;
}

export interface BomItem {
  surfaceKey: string;
  materialName: string;
  quantity: number;
  unit: string;
  materialRate: number;
  materialCost: number;
  laborRate: number;
  laborCost: number;
  totalCost: number;
}

export interface BomResponse {
  designId: number;
  versionNumber: number;
  stylePackage: string;
  roomId: number;
  roomName: string;
  items: BomItem[];
  subtotalCostInr: number;
  taxRatePercent: number;
  taxAmountInr: number;
  estimatedTotalCostInr: number;
}

export interface FeedbackRequest {
  rating: number;
  comment?: string;
}

export interface FeedbackResponse {
  id: number;
  userId: number;
  designId: number;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackAnalyticsResponse {
  averageRating: number;
  totalFeedbackCount: number;
  ratingDistribution: Record<number, number>;
}

