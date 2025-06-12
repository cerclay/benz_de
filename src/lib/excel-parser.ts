import * as XLSX from 'xlsx';
import { LogisticsData, SalesData, ExcelParsingOptions } from '@/types/logistics';

// Excel 파일 유효성 검사
export const validateExcelFile = (file: File): { valid: boolean; error?: string } => {
  // 파일 크기 검사 (10MB 제한)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: '파일이 너무 큽니다. 10MB 이하의 파일을 업로드해주세요.' };
  }

  // 파일 형식 검사
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/vnd.ms-excel.sheet.binary.macroEnabled.12', // .xlsb
    'application/vnd.ms-excel.sheet.macroEnabled.12' // .xlsm
  ];

  const allowedExtensions = ['.xlsx', '.xls', '.xlsb', '.xlsm'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
    return { 
      valid: false, 
      error: '지원되지 않는 파일 형식입니다. Excel 파일(.xlsx, .xls, .xlsb, .xlsm)만 업로드 가능합니다.' 
    };
  }

  return { valid: true };
};

// Excel 파일을 워크북으로 읽기
export const readExcelFile = async (file: File): Promise<XLSX.WorkBook> => {
  const arrayBuffer = await file.arrayBuffer();
  return XLSX.read(arrayBuffer, { type: 'array', raw: false });
};

// 컬럼 문자를 인덱스로 변환 (A=0, B=1, ...)
export const columnToIndex = (column: string): number => {
  let result = 0;
  for (let i = 0; i < column.length; i++) {
    result = result * 26 + (column.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return result - 1;
};

// 인덱스를 컬럼 문자로 변환 (0=A, 1=B, ...)
export const indexToColumn = (index: number): string => {
  let result = '';
  while (index >= 0) {
    result = String.fromCharCode('A'.charCodeAt(0) + (index % 26)) + result;
    index = Math.floor(index / 26) - 1;
  }
  return result;
};

// 파일 구조 감지 함수
const detectLogisticsFileStructure = (jsonData: any[][]): 'individual' | 'aggregated' => {
  if (jsonData.length < 3) return 'individual';
  
  // 집계 데이터 구조 확인: A열(클래스), B열(연식), C열(모델명), D열(VPC입고), E열(운송중)
  const sampleRow = jsonData[2]; // 3번째 행 (데이터 행)
  if (sampleRow && sampleRow.length >= 5) {
    const classField = String(sampleRow[0] || '').toLowerCase();
    const yearField = String(sampleRow[1] || '');
    const modelField = String(sampleRow[2] || '');
    const vpcField = String(sampleRow[3] || '');
    const transitField = String(sampleRow[4] || '');
    
    // 집계 데이터 패턴 확인
    if ((classField.includes('amg') || classField.includes('mercedes') || classField.includes('maybach')) &&
        !isNaN(Number(yearField)) &&
        modelField.length > 0 &&
        (!isNaN(Number(vpcField)) || !isNaN(Number(transitField)))) {
      return 'aggregated';
    }
  }
  
  return 'individual';
};

// 집계 데이터 파싱
const parseAggregatedLogisticsData = (jsonData: any[][]): LogisticsData[] => {
  const data: LogisticsData[] = [];
  
  // 헤더 확인 및 Plan.Deliv.Date 컬럼 찾기
  const headerRow = jsonData[0];
  
  // Plan.Deliv.Date 컬럼 찾기
  let deliveryDateColumnIndex = -1;
  for (let i = 0; i < headerRow.length; i++) {
    const header = String(headerRow[i] || '').toLowerCase().replace(/[.\s_-]/g, '');
    if (header.includes('plan') && header.includes('deliv') ||
        header.includes('plandeliv') ||
        header.includes('도착예정') ||
        header.includes('배송예정') ||
        header.includes('delivery') && header.includes('date')) {
      deliveryDateColumnIndex = i;
      break;
    }
  }
  
  // 실제 데이터 처리 (3행부터 - 헤더가 2개 행)
  for (let i = 2; i < jsonData.length; i++) {
    const row = jsonData[i];
    
    if (!row || row.length === 0) continue;

    const class1 = row[0] || '';
    const modelYr = row[1] || '';
    const modelDesc = row[2] || '';
    const vpcIncoming = row[3] || '';
    const inTransit = row[4] || '';
    
    // Plan.Deliv.Date 데이터 가져오기
    const deliveryDateRaw = deliveryDateColumnIndex >= 0 ? row[deliveryDateColumnIndex] : '';
    const deliveryDate = normalizeDate(deliveryDateRaw);

    // 필수 필드 검증
    if (!modelDesc || !modelYr) continue;

    // VPC입고 수량이 있는 차량들을 LogisticsData로 변환
    const vpcCount = parseInt(String(vpcIncoming)) || 0;
    const transitCount = parseInt(String(inTransit)) || 0;



    // VPC입고 차량들 추가
    for (let j = 0; j < vpcCount; j++) {
      data.push({
        modelDesc: String(modelDesc).trim(),
        colour: '', // 집계 데이터에는 색상 정보 없음
        trim: '', // 집계 데이터에는 트림 정보 없음
        modelYr: String(modelYr).trim(),
        deliveryDate: deliveryDate, // Plan.Deliv.Date 사용
        logisticsStatus: 'VPC입고'
      });
    }

    // 운송중 차량들 추가
    for (let j = 0; j < transitCount; j++) {
      data.push({
        modelDesc: String(modelDesc).trim(),
        colour: '', // 집계 데이터에는 색상 정보 없음
        trim: '', // 집계 데이터에는 트림 정보 없음
        modelYr: String(modelYr).trim(),
        deliveryDate: deliveryDate, // Plan.Deliv.Date 사용
        logisticsStatus: '운송중'
      });
    }


  }
  
  return data;
};



// 물류 데이터 파싱
export const parseLogisticsData = (workbook: XLSX.WorkBook): LogisticsData[] => {
  console.log('🔥🔥🔥 parseLogisticsData 함수 호출됨!');
  console.log('🔥 물류 데이터 파싱 강제 시작!');
  
  try {
    console.log('📊 워크북 시트 목록:', workbook.SheetNames);
    
    // Sheet 1을 우선적으로 선택 (개별 데이터가 있는 시트)
    let sheetName = 'Sheet 1';
    if (!workbook.SheetNames.includes('Sheet 1')) {
      // Sheet 1이 없으면 첫 번째 시트 사용
      sheetName = workbook.SheetNames[0];
    }
    
    console.log('🎯 선택된 시트:', sheetName);
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      console.error('❌ 첫 번째 시트를 찾을 수 없습니다');
      throw new Error('첫 번째 시트를 찾을 수 없습니다.');
    }

    console.log('✅ 시트 선택 완료:', sheetName);

    // 시트를 JSON으로 변환
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      raw: false,
      defval: ''
    }) as any[][];

    console.log('📊 JSON 변환 완료! 총 행 수:', jsonData.length);
    
    if (jsonData.length === 0) {
      console.error('❌ 변환된 데이터가 없습니다');
      return [];
    }

    // 첫 5행 강제 출력
    console.log('🔍 첫 5행 강제 출력:');
    for (let i = 0; i < Math.min(5, jsonData.length); i++) {
      console.log(`행 ${i + 1}:`, jsonData[i]);
    }

    const data: LogisticsData[] = [];
    let totalRows = 0;
    let validRows = 0;
    let filteredRows = 0;
    let statusCounts: Record<string, number> = {};

    // 모든 행 처리 (헤더 제외)
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      totalRows++;
      
      if (!row || row.length === 0) continue;

      // E열(4): 모델명 - 필수 필드
      const modelDesc = row[4];
      if (!modelDesc || String(modelDesc).trim() === '') continue;
      
      validRows++;

      // S열(18): 물류상태 - 1차 필터링 대상
      const logisticsStatus = row[18] ? String(row[18]).trim() : '';
      
      // 물류 상태 통계 수집
      const statusKey = logisticsStatus || '(빈값)';
      statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;

      // 처음 10개만 상세 로그
      if (validRows <= 10) {
        console.log(`🔍 행 ${i+1} 상세:`, {
          'E열_모델명': modelDesc,
          'H열_색상': row[7],
          'I열_트림': row[8], 
          'M열_연식': row[12],
          'P열_배송일': row[15],
          'S열_물류상태': logisticsStatus
        });
      }

      // ⭐ 1차 필터링: S열에서 "VPC입고" 또는 "운송중"만 통과
      const status = logisticsStatus.toLowerCase();
      const isVpcIncoming = status.includes('vpc입고') || status.includes('vpc') && status.includes('입고');
      const isInTransit = status.includes('운송중');
      
      if (!isVpcIncoming && !isInTransit) {
        continue; // 필터링에서 제외
      }

      filteredRows++;

      // 필터링 통과한 데이터 추가
      data.push({
        modelDesc: String(modelDesc).trim(),
        colour: row[7] ? String(row[7]).trim() : '',
        trim: row[8] ? String(row[8]).trim() : '',
        modelYr: row[12] ? String(row[12]).trim() : '',
        deliveryDate: row[15] ? String(row[15]).trim() : '',
        logisticsStatus: logisticsStatus
      });

      // 필터링 통과한 데이터 로그
      if (filteredRows <= 5) {
        console.log(`✅ 필터링 통과 ${filteredRows}번째:`, {
          모델명: modelDesc,
          물류상태: logisticsStatus,
          배송일: row[15]
        });
      }
    }
    
    console.log('📊 S열 물류상태별 통계:', statusCounts);
    console.log(`🎉 파싱 완료! 총 ${totalRows}행, 유효 ${validRows}행, 필터링 통과 ${filteredRows}개`);
    
    if (data.length > 0) {
      console.log('📋 첫 번째 데이터 샘플:', data[0]);
    } else {
      console.log('⚠️ 필터링 통과한 데이터가 없습니다!');
    }
    
    return data;

  } catch (error) {
    console.error('💥 파싱 중 오류:', error);
    throw error;
  }
};

// 판매 데이터 파싱
export const parseSalesData = (workbook: XLSX.WorkBook): SalesData[] => {
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  if (!worksheet) {
    throw new Error('첫 번째 시트를 찾을 수 없습니다.');
  }

  // 컬럼 매핑 (PRD에 따른 컬럼 위치)
  const columnMapping = {
    modelDesc: 'T',      // 모델명
    colour: 'Y',         // 외장색상
    trim: 'Z',           // 내장색상/트림
    modelYear: 'AA',     // 연식
    commNo: 'S',         // 커미션번호 (배정여부)
    salesmen: 'L'        // 영업사원
  };

  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    raw: true, // raw: true로 변경하여 원본 데이터 유지
    defval: ''
  }) as any[][];

  const data: SalesData[] = [];

  // 헤더 행을 건너뛰고 데이터 처리 (2행부터)
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    
    if (!row || row.length === 0) continue;

    const modelDesc = row[columnToIndex(columnMapping.modelDesc)] || '';
    const colour = row[columnToIndex(columnMapping.colour)] || '';
    const trim = row[columnToIndex(columnMapping.trim)] || '';
    const modelYear = row[columnToIndex(columnMapping.modelYear)] || '';
    const commNo = row[columnToIndex(columnMapping.commNo)] || '';
    const salesmen = row[columnToIndex(columnMapping.salesmen)] || '';

    // 필수 필드 검증
    if (!modelDesc) continue;

    data.push({
      modelDesc: String(modelDesc).trim(),
      colour: String(colour).trim(),
      trim: String(trim).trim(),
      modelYear: String(modelYear).trim(),
      commNo: String(commNo).trim(),
      salesmen: String(salesmen).trim()
    });
  }

  return data;
};

// Plan.Deliv.Date 날짜 정규화 함수
export const normalizeDate = (dateValue: any): string => {
  if (!dateValue) return '';
  
  try {
    // 이미 Date 객체인 경우
    if (dateValue instanceof Date) {
      if (!isNaN(dateValue.getTime())) {
        return dateValue.toISOString().split('T')[0];
      }
      return '';
    }
    
    const trimmed = String(dateValue).trim();
    if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') return '';
    
    // Excel 시리얼 날짜 처리 (숫자 형태) - 강화된 버전
    if (!isNaN(Number(trimmed)) && Number(trimmed) > 0) {
      const serialDate = Number(trimmed);
      
      // Excel 시리얼 날짜 범위 검증 (1900년 이후 ~ 2100년 이전)
      if (serialDate >= 1 && serialDate <= 73050) { // 대략 1900~2100년 범위
        // Excel의 1900년 1월 1일을 기준으로 계산
        // Excel bug 고려: 1900년을 윤년으로 잘못 계산하므로 보정
        let adjustedSerial = serialDate;
        if (serialDate >= 60) { // 1900년 2월 29일(존재하지 않는 날짜) 이후
          adjustedSerial = serialDate - 1;
        }
        
        // 1900년 1월 1일을 기준으로 날짜 계산
        const baseDate = new Date(1900, 0, 1); // JavaScript Date: 1900년 1월 1일
        const jsDate = new Date(baseDate.getTime() + (adjustedSerial - 1) * 24 * 60 * 60 * 1000);
        
        if (!isNaN(jsDate.getTime())) {
          return jsDate.toISOString().split('T')[0];
        }
      }
    }
    
    // 이미 YYYY-MM-DD 형태인 경우
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    
    // YYYY.MM.DD 형식 처리
    const yyyymmddDotMatch = trimmed.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
    if (yyyymmddDotMatch) {
      const [, year, month, day] = yyyymmddDotMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // MM/DD/YYYY 형식 처리
    const mmddyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddyyyyMatch) {
      const [, month, day, year] = mmddyyyyMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // DD/MM/YYYY 형식 처리 (유럽식)
    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      // 월이 12보다 크거나 일이 31보다 크면 MM/DD/YYYY로 간주
      if (Number(day) <= 12 && Number(month) <= 31) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    // 한국어 날짜 형식 처리 (예: 2024년 12월 15일)
    const koreanDateMatch = trimmed.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
    if (koreanDateMatch) {
      const [, year, month, day] = koreanDateMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // YYYYMMDD 형식 처리 (8자리 숫자)
    if (/^\d{8}$/.test(trimmed)) {
      const year = trimmed.substring(0, 4);
      const month = trimmed.substring(4, 6);
      const day = trimmed.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    
    // 다른 문자열 날짜 형식 처리
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return ''; // 파싱 실패시 빈 문자열 반환
  } catch (error) {
    return '';
  }
};

// 데이터 정리 및 검증
export const cleanAndValidateData = <T extends LogisticsData | SalesData>(
  data: T[]
): T[] => {
  return data
    .filter(item => item.modelDesc) // 모델명이 있는 것만
    .map(item => ({
      ...item,
      modelDesc: item.modelDesc.trim(),
      colour: item.colour.trim(),
      trim: item.trim.trim(),
      // 날짜 정규화 (물류 데이터의 경우)
      ...(('deliveryDate' in item) && {
        deliveryDate: normalizeDate(item.deliveryDate)
      })
    }));
}; 