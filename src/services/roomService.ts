import { axiosClient } from '../api/axiosClient';
import { CreateRoomRequest, Room, RoomScan, RoomDesign, StylePackage } from '../types';
import { SurfaceCustomizationMap } from '../components/room3d/materials';

export interface SurfaceCostDetail {
  surfaceKey: string;
  areaSqFt: number;
  materialCostInr: number;
  laborCostInr: number;
  totalSurfaceCostInr: number;
}

export interface RecalculationRequestPayload {
  stylePackage: StylePackage;
  customTaxRatePercent: number;
  surfaceMap: SurfaceCustomizationMap;
}

export interface RecalculationResponseData {
  overallCompatibilityScore: number;
  compatibilityBreakdownJson: string;
  subtotalCostInr: number;
  taxRatePercent: number;
  taxAmountInr: number;
  estimatedTotalCostInr: number;
  surfaceCostBreakdown: SurfaceCostDetail[];
  costDisclaimer: string;
}

export interface BomResponseData {
  designId: number;
  versionNumber: number;
  stylePackage: StylePackage;
  roomId: number;
  roomName: string;
  subtotalCostInr: number;
  taxRatePercent: number;
  taxAmountInr: number;
  estimatedTotalCostInr: number;
  surfaceItems: SurfaceCostDetail[];
  costDisclaimer: string;
}

export interface FeedbackResponseData {
  id: number;
  designId: number;
  userId: number;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackAnalyticsData {
  designId: number;
  averageRating: number;
  totalFeedbackCount: number;
}

export const roomService = {
  async createRoom(data: CreateRoomRequest): Promise<Room> {
    const response = await axiosClient.post<Room>('/rooms', data);
    return response.data;
  },

  async getRooms(): Promise<Room[]> {
    const response = await axiosClient.get<Room[]>('/rooms');
    return response.data;
  },

  async getRoomById(id: number | string): Promise<Room> {
    const response = await axiosClient.get<Room>(`/rooms/${id}`);
    return response.data;
  },

  async deleteRoom(id: number | string): Promise<void> {
    await axiosClient.delete(`/rooms/${id}`);
  },

  async createScan(roomId: number | string): Promise<RoomScan> {
    const response = await axiosClient.post<RoomScan>(`/rooms/${roomId}/scans`);
    return response.data;
  },

  async createDesign(
    roomId: number | string,
    stylePackage: StylePackage = 'MODERN',
    customTaxRatePercent: number = 18.0,
    surfaceMap?: SurfaceCustomizationMap | null
  ): Promise<RoomDesign> {
    const response = await axiosClient.post<RoomDesign>(`/rooms/${roomId}/designs`, {
      stylePackage,
      customTaxRatePercent,
      surfaceMap,
    });
    return response.data;
  },

  async recalculateDesign(
    roomId: number | string,
    payload: RecalculationRequestPayload,
    signal?: AbortSignal
  ): Promise<RecalculationResponseData> {
    const response = await axiosClient.post<RecalculationResponseData>(
      `/rooms/${roomId}/designs/recalculate`,
      payload,
      { signal }
    );
    return response.data;
  },

  async getRoomDesigns(roomId: number | string): Promise<RoomDesign[]> {
    const response = await axiosClient.get<RoomDesign[]>(`/rooms/${roomId}/designs`);
    return response.data;
  },

  async getDesignById(roomId: number | string, designId: number | string): Promise<RoomDesign> {
    const response = await axiosClient.get<RoomDesign>(`/rooms/${roomId}/designs/${designId}`);
    return response.data;
  },

  async restoreDesign(roomId: number | string, designId: number | string): Promise<RoomDesign> {
    const response = await axiosClient.post<RoomDesign>(`/rooms/${roomId}/designs/${designId}/restore`);
    return response.data;
  },

  async toggleFavoriteDesign(
    roomId: number | string,
    designId: number | string,
    favorite: boolean
  ): Promise<RoomDesign> {
    const response = await axiosClient.put<RoomDesign>(`/rooms/${roomId}/designs/${designId}/favorite`, {
      favorite,
    });
    return response.data;
  },

  async cloneDesign(roomId: number | string, designId: number | string): Promise<RoomDesign> {
    const response = await axiosClient.post<RoomDesign>(`/rooms/${roomId}/designs/${designId}/clone`);
    return response.data;
  },

  async getBom(roomId: number | string, designId: number | string): Promise<BomResponseData> {
    const response = await axiosClient.get<BomResponseData>(`/rooms/${roomId}/designs/${designId}/bom`);
    return response.data;
  },

  async downloadPdfReport(roomId: number | string, designId: number | string, versionNumber: number = 1): Promise<void> {
    const response = await axiosClient.get(`/rooms/${roomId}/designs/${designId}/report`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `roommind-design-v${versionNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async submitFeedback(
    roomId: number | string,
    designId: number | string,
    rating: number,
    comment?: string
  ): Promise<FeedbackResponseData> {
    const response = await axiosClient.post<FeedbackResponseData>(
      `/rooms/${roomId}/designs/${designId}/feedback`,
      { rating, comment }
    );
    return response.data;
  },

  async getFeedback(roomId: number | string, designId: number | string): Promise<FeedbackResponseData | null> {
    try {
      const response = await axiosClient.get<FeedbackResponseData>(`/rooms/${roomId}/designs/${designId}/feedback`);
      return response.data;
    } catch (e) {
      return null;
    }
  },

  async getFeedbackAnalytics(roomId: number | string, designId: number | string): Promise<FeedbackAnalyticsData> {
    const response = await axiosClient.get<FeedbackAnalyticsData>(`/rooms/${roomId}/designs/${designId}/feedback/analytics`);
    return response.data;
  },
};


