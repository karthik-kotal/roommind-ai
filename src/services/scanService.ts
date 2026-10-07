import { axiosClient } from '../api/axiosClient';
import { RoomScan, ScanImage, SurfaceType, RoomAnalysis } from '../types';

export const scanService = {
  async getScan(scanId: number | string): Promise<RoomScan> {
    const response = await axiosClient.get<RoomScan>(`/scans/${scanId}`);
    return response.data;
  },

  async uploadSurfaceImage(
    scanId: number | string,
    surfaceType: SurfaceType,
    imageBlob: Blob
  ): Promise<ScanImage> {
    const formData = new FormData();
    formData.append('file', imageBlob, `${surfaceType.toLowerCase()}.jpg`);
    formData.append('surfaceType', surfaceType);

    const response = await axiosClient.post<ScanImage>(
      `/scans/${scanId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async analyzeScan(scanId: number | string): Promise<RoomAnalysis> {
    const response = await axiosClient.post<RoomAnalysis>(`/scans/${scanId}/analyze`);
    return response.data;
  },

  async getAnalysis(scanId: number | string): Promise<RoomAnalysis> {
    const response = await axiosClient.get<RoomAnalysis>(`/scans/${scanId}/analysis`);
    return response.data;
  },
};
