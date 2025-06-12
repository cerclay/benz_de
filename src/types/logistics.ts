// 물류 데이터 스키마
export interface LogisticsData {
  modelDesc: string;          // 모델명 (E열)
  colour: string;             // 외장색상 (H열)
  trim: string;               // 내장색상/트림 (I열)
  modelYr: string | number;   // 연식 (M열)
  deliveryDate: string;       // 인도예정일 (P열)
  logisticsStatus: string;    // 물류상태 (S열)
}

// 판매 데이터 스키마
export interface SalesData {
  modelDesc: string;          // 모델명 (T열)
  colour: string;             // 외장색상 (Y열)
  trim: string;               // 내장색상/트림 (Z열)
  modelYear: string | number; // 연식 (AA열)
  commNo: string;             // 커미션번호 (S열)
  salesmen: string;           // 영업사원 (L열)
}

// 통합 결과 스키마
export interface CarModel {
  model: string;              // 모델명
  color: string;              // 색상
  trim: string;               // 트림
  year: number;               // 연식
  delivery_date: string;      // 인도예정일
  in_transit: number;         // 운송중 수량
  pending_assigned: number;   // 배정대기 수량
  pending_unassigned: number; // 미배정 수량
  total_count: number;        // 총 수량
  salesmen: string[];         // 영업사원 목록
}

// 분석 결과
export interface AnalysisResult {
  models: CarModel[];
  summary: {
    totalModels: number;
    totalVehicles: number;
    inTransit: number;
    pendingAssigned: number;
    pendingUnassigned: number;
    unmatchedModels: number;
  };
}

// 파일 업로드 상태
export interface FileUploadState {
  logistics: File | null;
  sales: File | null;
  logisticsUploaded: boolean;
  salesUploaded: boolean;
  logisticsError: string | null;
  salesError: string | null;
}

// 분석 진행 상태
export interface AnalysisProgress {
  step: 'idle' | 'validating' | 'uploading' | 'analyzing' | 'processing' | 'completed' | 'error';
  message: string;
  progress: number; // 0-100
}

// 필터 옵션
export interface FilterOptions {
  model?: string;
  color?: string;
  trim?: string;
  status?: 'all' | 'in_transit' | 'pending_assigned' | 'pending_unassigned';
  sortBy?: 'model' | 'total_count' | 'delivery_date';
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
}

// API 응답 타입
export interface AnalysisResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
  message?: string;
}

// Excel 파싱 옵션
export interface ExcelParsingOptions {
  sheetName?: string;
  startRow?: number;
  endRow?: number;
  columnMappings?: Record<string, string>;
}

// 에러 타입
export interface LogisticsError {
  type: 'validation' | 'network' | 'parsing' | 'analysis' | 'unknown';
  message: string;
  details?: any;
} 