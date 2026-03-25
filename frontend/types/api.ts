export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  errorCode: string | null;
  timestamp: string;
}
