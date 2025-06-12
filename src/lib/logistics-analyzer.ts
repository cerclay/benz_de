import { LogisticsData, SalesData, CarModel, AnalysisResult } from '@/types/logistics';

// 모델명 정규화 함수
const normalizeModelName = (model: string): string => {
  let normalized = String(model).trim().toLowerCase();
  
  // Mercedes-AMG, Mercedes-Maybach 등의 접두사 제거
  normalized = normalized.replace(/^mercedes-amg\s+/i, '');
  normalized = normalized.replace(/^mercedes-maybach\s+/i, '');
  normalized = normalized.replace(/^mercedes-benz\s+/i, '');
  normalized = normalized.replace(/^mercedes\s+/i, '');
  
  // 악센트 문자 정규화 (é -> e, ó -> o 등)
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // 4MATIC과 4M 통일
  normalized = normalized.replace(/\b4matic\b/gi, '4m');
  
  // 차량 타입 정규화 (Coupé/Coupe, Cabriolet 등의 다양한 표기 통일)
  normalized = normalized.replace(/\bcoup[eé]\b/gi, 'coupe');
  normalized = normalized.replace(/\bcabriolet\b/gi, 'cabriolet');
  normalized = normalized.replace(/\bsedan\b/gi, 'sedan');
  normalized = normalized.replace(/\bwagon\b/gi, 'wagon');
  normalized = normalized.replace(/\bsuv\b/gi, 'suv');
  
  // 공백 정리
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
};

// 모델 키 생성 함수
export const generateModelKey = (
  model: string, 
  color: string, 
  trim: string, 
  year: string | number
): string => {
  const normalizedModel = normalizeModelName(model);
  const normalizedColor = String(color).trim().toLowerCase();
  const normalizedTrim = String(trim).trim().toLowerCase();
  const normalizedYear = String(year).trim();
  
  return `${normalizedModel}_${normalizedColor}_${normalizedTrim}_${normalizedYear}`;
};

// 물류 데이터 그룹화
export const groupLogisticsData = (logisticsData: LogisticsData[]): Map<string, LogisticsData[]> => {
  const grouped = new Map<string, LogisticsData[]>();
  
  logisticsData.forEach(item => {
    const key = generateModelKey(item.modelDesc, item.colour, item.trim, item.modelYr);
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  });
  
  return grouped;
};

// 판매 데이터 그룹화
export const groupSalesData = (salesData: SalesData[]): Map<string, SalesData[]> => {
  const grouped = new Map<string, SalesData[]>();
  
  salesData.forEach(item => {
    const key = generateModelKey(item.modelDesc, item.colour, item.trim, item.modelYear);
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  });
  
  return grouped;
};

// 상태별 분류 함수
export const categorizeLogisticsStatus = (status: string): 'in_transit' | 'unknown' => {
  const lowerStatus = status.toLowerCase();
  
  if (lowerStatus.includes('운송중') || 
      lowerStatus.includes('vpc입고') || 
      lowerStatus.includes('transit')) {
    return 'in_transit';
  }
  
  return 'unknown';
};

// 배정 상태 확인
export const checkAssignmentStatus = (commNo: string): 'assigned' | 'unassigned' => {
  return commNo && commNo.trim() !== '' ? 'assigned' : 'unassigned';
};

// 데이터 통합 및 분석
export const analyzeLogisticsData = (
  logisticsData: LogisticsData[], 
  salesData: SalesData[]
): AnalysisResult => {
  // 데이터 그룹화
  const logisticsGrouped = groupLogisticsData(logisticsData);
  const salesGrouped = groupSalesData(salesData);
  
  // 모든 고유한 모델 키 수집
  const allKeys = new Set([
    ...Array.from(logisticsGrouped.keys()),
    ...Array.from(salesGrouped.keys())
  ]);
  
  const models: CarModel[] = [];
  let totalVehicles = 0;
  let inTransit = 0;
  let pendingAssigned = 0;
  let pendingUnassigned = 0;
  let unmatchedModels = 0;
  
  allKeys.forEach(key => {
    const logistics = logisticsGrouped.get(key) || [];
    const sales = salesGrouped.get(key) || [];
    
    // 기본 모델 정보 (물류 데이터 우선, 없으면 판매 데이터)
    const sampleData = logistics[0] || sales[0];
    if (!sampleData) return;
    
    // G 63 모델 특별 디버깅
    if (sampleData.modelDesc.toLowerCase().includes('g 63')) {
      console.log(`🔍 G 63 분석:`, {
        키: key,
        물류_데이터_수: logistics.length,
        판매_데이터_수: sales.length,
        원본_모델명: sampleData.modelDesc
      });
    }
    
    // 운송중 수량 계산
    const inTransitCount = logistics.filter(item => 
      categorizeLogisticsStatus(item.logisticsStatus) === 'in_transit'
    ).length;
    
    // 배정 상태별 수량 계산
    const assignedSales = sales.filter(item => 
      checkAssignmentStatus(item.commNo) === 'assigned'
    );
    const unassignedSales = sales.filter(item => 
      checkAssignmentStatus(item.commNo) === 'unassigned'
    );
    
    const pendingAssignedCount = assignedSales.length;
    const pendingUnassignedCount = unassignedSales.length;
    
    // 총 수량 계산: (운송중 + 배정완료) - 배정대기
    const totalCount = inTransitCount + pendingAssignedCount - pendingUnassignedCount;
    
    // 영업사원 목록 수집 (배정대기 차량의 영업사원)
    const salesmen = Array.from(new Set(
      unassignedSales
        .map(item => item.salesmen)
        .filter(salesmen => salesmen && salesmen.trim() !== '')
    ));
    
    // Plan.Deliv.Date (P열 도착예정일) - 모든 물류 데이터에서 수집
    const allDeliveryDates = logistics
      .map(item => item.deliveryDate)
      .filter(date => date && date.trim() !== '' && date !== 'undefined' && date !== 'null');
    
    // 운송중 차량의 도착예정일만 추출
    const inTransitItems = logistics.filter(item => categorizeLogisticsStatus(item.logisticsStatus) === 'in_transit');
    const inTransitDeliveryDates = inTransitItems
      .map(item => item.deliveryDate)
      .filter(date => date && date.trim() !== '' && date !== 'undefined' && date !== 'null')
      .sort();
    
    // 운송중 차량들의 고유한 도착예정일들 (중복 제거)
    const uniqueInTransitDates = Array.from(new Set(inTransitDeliveryDates)).sort();
    
    // 표시할 도착예정일: 운송중 차량이 있으면 모든 운송중 날짜, 없으면 가장 빠른 날짜
    const displayDeliveryDate = uniqueInTransitDates.length > 0 
      ? uniqueInTransitDates.join(', ') // 여러 날짜를 쉼표로 구분
      : allDeliveryDates.sort()[0] || '';
    
    // Plan.Deliv.Date 디버깅 (상세 분석)
    console.log(`📅 ${sampleData.modelDesc} Plan.Deliv.Date 상세 분석:`, {
      전체_물류_데이터: logistics.length,
      모든_배송일: allDeliveryDates,
      운송중_차량수: inTransitItems.length,
      운송중_차량_배송일: inTransitItems.map(item => ({ 상태: item.logisticsStatus, 배송일: item.deliveryDate, 원본: item })),
      운송중_유효한_배송일: inTransitDeliveryDates,
      최종_선택된_배송일: displayDeliveryDate,
      물류_원본_데이터_일부: logistics.slice(0, 2)
    });
    
    // 모델 데이터 생성
    const model: CarModel = {
      model: sampleData.modelDesc,
      color: 'colour' in sampleData ? sampleData.colour : (sampleData as SalesData).colour,
      trim: sampleData.trim,
      year: parseInt(String('modelYr' in sampleData ? sampleData.modelYr : (sampleData as SalesData).modelYear)) || 0,
      delivery_date: displayDeliveryDate,
      in_transit: inTransitCount,
      pending_assigned: pendingAssignedCount,
      pending_unassigned: pendingUnassignedCount,
      total_count: totalCount, // 음수 허용
      salesmen
    };
    
    models.push(model);
    
    // 통계 업데이트
    totalVehicles += totalCount;
    inTransit += inTransitCount;
    pendingAssigned += pendingAssignedCount;
    pendingUnassigned += pendingUnassignedCount;
    
    // 매치되지 않은 모델 확인 (물류 데이터는 있지만 판매 데이터가 없는 경우)
    if (logistics.length > 0 && sales.length === 0) {
      unmatchedModels++;
    }
  });
  
  // 모델명으로 정렬
  models.sort((a, b) => a.model.localeCompare(b.model, 'ko'));
  
  const result: AnalysisResult = {
    models,
    summary: {
      totalModels: models.length,
      totalVehicles,
      inTransit,
      pendingAssigned,
      pendingUnassigned,
      unmatchedModels
    }
  };
  
  return result;
};

// 필터링 함수
export const filterModels = (
  models: CarModel[],
  filters: {
    model?: string;
    color?: string;
    trim?: string;
    status?: 'all' | 'in_transit' | 'pending_assigned' | 'pending_unassigned';
    searchQuery?: string;
  }
): CarModel[] => {
  let filteredModels = [...models];
  
  // 모델명 필터
  if (filters.model) {
    filteredModels = filteredModels.filter(model => 
      model.model.toLowerCase().includes(filters.model!.toLowerCase())
    );
  }
  
  // 색상 필터
  if (filters.color) {
    filteredModels = filteredModels.filter(model => 
      model.color.toLowerCase().includes(filters.color!.toLowerCase())
    );
  }
  
  // 트림 필터
  if (filters.trim) {
    filteredModels = filteredModels.filter(model => 
      model.trim.toLowerCase().includes(filters.trim!.toLowerCase())
    );
  }
  
  // 상태 필터
  if (filters.status && filters.status !== 'all') {
    switch (filters.status) {
      case 'in_transit':
        filteredModels = filteredModels.filter(model => model.in_transit > 0);
        break;
      case 'pending_assigned':
        filteredModels = filteredModels.filter(model => model.pending_assigned > 0);
        break;
      case 'pending_unassigned':
        filteredModels = filteredModels.filter(model => model.pending_unassigned > 0);
        break;
    }
  }
  
  // 검색 쿼리 (통합 검색)
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filteredModels = filteredModels.filter(model => 
      model.model.toLowerCase().includes(query) ||
      model.color.toLowerCase().includes(query) ||
      model.trim.toLowerCase().includes(query) ||
      model.year.toString().includes(query)
    );
  }
  
  return filteredModels;
};

// 정렬 함수
export const sortModels = (
  models: CarModel[],
  sortBy: 'model' | 'total_count' | 'delivery_date',
  sortOrder: 'asc' | 'desc' = 'asc'
): CarModel[] => {
  const sorted = [...models].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'model':
        comparison = a.model.localeCompare(b.model, 'ko');
        break;
      case 'total_count':
        comparison = a.total_count - b.total_count;
        break;
      case 'delivery_date':
        comparison = a.delivery_date.localeCompare(b.delivery_date);
        break;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
  
  return sorted;
};

// 통계 재계산
export const recalculateSummary = (models: CarModel[]) => {
  return {
    totalModels: models.length,
    totalVehicles: models.reduce((sum, model) => sum + model.total_count, 0),
    inTransit: models.reduce((sum, model) => sum + model.in_transit, 0),
    pendingAssigned: models.reduce((sum, model) => sum + model.pending_assigned, 0),
    pendingUnassigned: models.reduce((sum, model) => sum + model.pending_unassigned, 0),
    unmatchedModels: models.filter(model => model.in_transit > 0 && model.pending_assigned === 0 && model.pending_unassigned === 0).length
  };
}; 