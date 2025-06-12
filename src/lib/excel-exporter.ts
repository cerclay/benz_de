import * as XLSX from 'xlsx';
import { AnalysisResult, CarModel } from '@/types/logistics';

// Excel 파일로 내보내기
export const exportToExcel = (data: AnalysisResult, filename?: string) => {
  try {
    // 워크북 생성
    const workbook = XLSX.utils.book_new();

    // 1. 요약 시트 생성
    const summaryData = [
      ['항목', '값'],
      ['총 모델 수', data.summary.totalModels],
      ['총 차량 수', data.summary.totalVehicles],
      ['운송중 차량', data.summary.inTransit],
      ['배정 완료 차량', data.summary.pendingAssigned],
      ['배정 대기 차량', data.summary.pendingUnassigned],
      ['미매치 모델', data.summary.unmatchedModels],
      [''],
      ['분석 일시', new Date().toLocaleString('ko-KR')],
      [''],
      ['주요 지표', ''],
      ['배정률 (%)', data.summary.pendingAssigned + data.summary.pendingUnassigned > 0 
        ? Math.round((data.summary.pendingAssigned / (data.summary.pendingAssigned + data.summary.pendingUnassigned)) * 100)
        : 0
      ],
      ['차량 가용률 (%)', data.summary.totalVehicles > 0 
        ? Math.round(((data.summary.inTransit + data.summary.pendingAssigned) / data.summary.totalVehicles) * 100)
        : 0
      ],
      ['데이터 매칭률 (%)', data.summary.totalModels > 0 
        ? Math.round(((data.summary.totalModels - data.summary.unmatchedModels) / data.summary.totalModels) * 100)
        : 0
      ]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // 요약 시트 스타일링
    summarySheet['!cols'] = [
      { width: 20 },
      { width: 15 }
    ];

    XLSX.utils.book_append_sheet(workbook, summarySheet, '요약');

    // 2. 상세 데이터 시트 생성
    const detailHeaders = [
      '모델명',
      '외장색상',
      '내장/트림',
      '연식',
      '인도예정일',
      '운송중',
      '배정완료',
      '배정대기',
      '총수량',
      '담당영업사원',
      '배정률(%)',
      '가용률(%)'
    ];

    const detailData = [
      detailHeaders,
      ...data.models.map(model => [
        model.model,
        model.color,
        model.trim,
        model.year,
        model.delivery_date || '미정',
        model.in_transit,
        model.pending_assigned,
        model.pending_unassigned,
        model.total_count,
        model.salesmen.join(', ') || '없음',
        model.pending_assigned + model.pending_unassigned > 0 
          ? Math.round((model.pending_assigned / (model.pending_assigned + model.pending_unassigned)) * 100)
          : 0,
        model.in_transit + model.pending_assigned + model.pending_unassigned > 0
          ? Math.round(((model.in_transit + model.pending_assigned) / (model.in_transit + model.pending_assigned + model.pending_unassigned)) * 100)
          : 0
      ])
    ];

    const detailSheet = XLSX.utils.aoa_to_sheet(detailData);

    // 상세 시트 컬럼 너비 설정
    detailSheet['!cols'] = [
      { width: 25 }, // 모델명
      { width: 15 }, // 외장색상
      { width: 15 }, // 내장/트림
      { width: 10 }, // 연식
      { width: 12 }, // 인도예정일
      { width: 10 }, // 운송중
      { width: 10 }, // 배정완료
      { width: 10 }, // 배정대기
      { width: 10 }, // 총수량
      { width: 20 }, // 담당영업사원
      { width: 12 }, // 배정률
      { width: 12 }  // 가용률
    ];

    XLSX.utils.book_append_sheet(workbook, detailSheet, '상세데이터');

    // 3. 상태별 시트 생성
    
    // 운송중 차량
    const transitModels = data.models.filter(model => model.in_transit > 0);
    if (transitModels.length > 0) {
      const transitData = [
        ['모델명', '색상', '트림', '연식', '인도예정일', '운송중수량'],
        ...transitModels.map(model => [
          model.model,
          model.color,
          model.trim,
          model.year,
          model.delivery_date || '미정',
          model.in_transit
        ])
      ];
      const transitSheet = XLSX.utils.aoa_to_sheet(transitData);
      transitSheet['!cols'] = [
        { width: 25 },
        { width: 15 },
        { width: 15 },
        { width: 10 },
        { width: 12 },
        { width: 12 }
      ];
      XLSX.utils.book_append_sheet(workbook, transitSheet, '운송중차량');
    }

    // 배정대기 차량
    const unassignedModels = data.models.filter(model => model.pending_unassigned > 0);
    if (unassignedModels.length > 0) {
      const unassignedData = [
        ['모델명', '색상', '트림', '연식', '배정대기수량', '담당영업사원'],
        ...unassignedModels.map(model => [
          model.model,
          model.color,
          model.trim,
          model.year,
          model.pending_unassigned,
          model.salesmen.join(', ') || '없음'
        ])
      ];
      const unassignedSheet = XLSX.utils.aoa_to_sheet(unassignedData);
      unassignedSheet['!cols'] = [
        { width: 25 },
        { width: 15 },
        { width: 15 },
        { width: 10 },
        { width: 12 },
        { width: 20 }
      ];
      XLSX.utils.book_append_sheet(workbook, unassignedSheet, '배정대기차량');
    }

    // 미매치 모델 (물류 데이터는 있지만 판매 데이터가 없는 경우)
    const unmatchedModels = data.models.filter(model => 
      model.in_transit > 0 && model.pending_assigned === 0 && model.pending_unassigned === 0
    );
    if (unmatchedModels.length > 0) {
      const unmatchedData = [
        ['모델명', '색상', '트림', '연식', '인도예정일', '운송중수량', '상태'],
        ...unmatchedModels.map(model => [
          model.model,
          model.color,
          model.trim,
          model.year,
          model.delivery_date || '미정',
          model.in_transit,
          '판매데이터 없음'
        ])
      ];
      const unmatchedSheet = XLSX.utils.aoa_to_sheet(unmatchedData);
      unmatchedSheet['!cols'] = [
        { width: 25 },
        { width: 15 },
        { width: 15 },
        { width: 10 },
        { width: 12 },
        { width: 12 },
        { width: 15 }
      ];
      XLSX.utils.book_append_sheet(workbook, unmatchedSheet, '미매치모델');
    }

    // 파일명 생성
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const finalFilename = filename || `차량_대기_현황_${dateStr}.xlsx`;

    // 파일 다운로드
    XLSX.writeFile(workbook, finalFilename);

    return {
      success: true,
      filename: finalFilename,
      sheetsCount: workbook.SheetNames.length
    };

  } catch (error) {
    console.error('Excel 내보내기 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
};

// 특정 상태의 데이터만 내보내기
export const exportFilteredData = (
  models: CarModel[], 
  filterType: 'all' | 'in_transit' | 'pending_assigned' | 'pending_unassigned',
  filename?: string
) => {
  try {
    let filteredModels = models;
    let sheetName = '전체데이터';

    switch (filterType) {
      case 'in_transit':
        filteredModels = models.filter(model => model.in_transit > 0);
        sheetName = '운송중차량';
        break;
      case 'pending_assigned':
        filteredModels = models.filter(model => model.pending_assigned > 0);
        sheetName = '배정완료차량';
        break;
      case 'pending_unassigned':
        filteredModels = models.filter(model => model.pending_unassigned > 0);
        sheetName = '배정대기차량';
        break;
    }

    if (filteredModels.length === 0) {
      return {
        success: false,
        error: '내보낼 데이터가 없습니다.'
      };
    }

    const workbook = XLSX.utils.book_new();

    const headers = [
      '모델명',
      '외장색상',
      '내장/트림',
      '연식',
      '인도예정일',
      '운송중',
      '배정완료',
      '배정대기',
      '총수량',
      '담당영업사원'
    ];

    const data = [
      headers,
      ...filteredModels.map(model => [
        model.model,
        model.color,
        model.trim,
        model.year,
        model.delivery_date || '미정',
        model.in_transit,
        model.pending_assigned,
        model.pending_unassigned,
        model.total_count,
        model.salesmen.join(', ') || '없음'
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet['!cols'] = [
      { width: 25 },
      { width: 15 },
      { width: 15 },
      { width: 10 },
      { width: 12 },
      { width: 10 },
      { width: 10 },
      { width: 10 },
      { width: 10 },
      { width: 20 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const finalFilename = filename || `${sheetName}_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, finalFilename);

    return {
      success: true,
      filename: finalFilename,
      recordsCount: filteredModels.length
    };

  } catch (error) {
    console.error('필터된 데이터 내보내기 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
};

// CSV 형식으로 내보내기 (가벼운 버전)
export const exportToCSV = (models: CarModel[], filename?: string) => {
  try {
    const headers = [
      '모델명',
      '외장색상',
      '내장/트림',
      '연식',
      '인도예정일',
      '운송중',
      '배정완료',
      '배정대기',
      '총수량',
      '담당영업사원'
    ];

    const csvContent = [
      headers.join(','),
      ...models.map(model => [
        `"${model.model}"`,
        `"${model.color}"`,
        `"${model.trim}"`,
        model.year,
        `"${model.delivery_date || '미정'}"`,
        model.in_transit,
        model.pending_assigned,
        model.pending_unassigned,
        model.total_count,
        `"${model.salesmen.join(', ') || '없음'}"`
      ].join(','))
    ].join('\n');

    // BOM 추가 (Excel에서 한글 깨짐 방지)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const finalFilename = filename || `차량_대기_현황_${dateStr}.csv`;
      
      link.setAttribute('download', finalFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return {
        success: true,
        filename: finalFilename,
        recordsCount: models.length
      };
    }

    return {
      success: false,
      error: '브라우저에서 다운로드를 지원하지 않습니다.'
    };

  } catch (error) {
    console.error('CSV 내보내기 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
}; 