import { NextRequest, NextResponse } from 'next/server';
import { readExcelFile, parseLogisticsData, parseSalesData, cleanAndValidateData } from '@/lib/excel-parser';
import { analyzeLogisticsData } from '@/lib/logistics-analyzer';
import { AnalysisResponse } from '@/types/logistics';

export const maxDuration = 60; // 60초 타임아웃 (Vercel hobby 플랜 최대값)

// 파일 크기 제한 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const logisticsFile = formData.get('logistics') as File;
    const salesFile = formData.get('sales') as File;

    if (!logisticsFile || !salesFile) {
      return NextResponse.json<AnalysisResponse>({
        success: false,
        error: '물류 파일과 판매 파일이 모두 필요합니다.'
      }, { status: 400 });
    }

    // 파일 크기 검증
    if (logisticsFile.size > MAX_FILE_SIZE) {
      return NextResponse.json<AnalysisResponse>({
        success: false,
        error: `물류 파일이 너무 큽니다. 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 업로드 가능합니다.`
      }, { status: 400 });
    }

    if (salesFile.size > MAX_FILE_SIZE) {
      return NextResponse.json<AnalysisResponse>({
        success: false,
        error: `판매 파일이 너무 큽니다. 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 업로드 가능합니다.`
      }, { status: 400 });
    }

    console.log('파일 수신 완료:', {
      logistics: { name: logisticsFile.name, size: logisticsFile.size },
      sales: { name: salesFile.name, size: salesFile.size }
    });

    // 처리 시작 시간 기록
    const startTime = Date.now();

    // 1단계: 물류 파일 파싱
    console.log('1단계: 물류 파일 파싱 시작');
    const logisticsWorkbook = await readExcelFile(logisticsFile);
    console.log('물류 파일 워크북 로드 완료, 시트 개수:', logisticsWorkbook.SheetNames.length);
    
    const rawLogisticsData = parseLogisticsData(logisticsWorkbook);
    const logisticsData = cleanAndValidateData(rawLogisticsData);
    
    console.log(`물류 데이터 파싱 완료: ${logisticsData.length}개 레코드 (${Date.now() - startTime}ms)`);

    // 2단계: 판매 파일 파싱
    console.log('2단계: 판매 파일 파싱 시작');
    const salesWorkbook = await readExcelFile(salesFile);
    const rawSalesData = parseSalesData(salesWorkbook);
    const salesData = cleanAndValidateData(rawSalesData);
    
    console.log(`판매 데이터 파싱 완료: ${salesData.length}개 레코드 (${Date.now() - startTime}ms)`);

    // 3단계: 데이터 분석
    console.log('3단계: 데이터 분석 시작');
    const analysisResult = analyzeLogisticsData(logisticsData, salesData);
    
    const totalTime = Date.now() - startTime;
    console.log(`분석 완료 (총 ${totalTime}ms):`, {
      totalModels: analysisResult.summary.totalModels,
      totalVehicles: analysisResult.summary.totalVehicles,
      inTransit: analysisResult.summary.inTransit,
      pendingAssigned: analysisResult.summary.pendingAssigned,
      pendingUnassigned: analysisResult.summary.pendingUnassigned,
      unmatchedModels: analysisResult.summary.unmatchedModels
    });

    // 처리 시간이 50초를 넘으면 경고
    if (totalTime > 50000) {
      console.warn(`⚠️ 처리 시간이 ${totalTime}ms로 길었습니다. 파일 크기를 줄이는 것을 고려해주세요.`);
    }

    return NextResponse.json<AnalysisResponse>({
      success: true,
      data: analysisResult,
      message: `분석이 성공적으로 완료되었습니다. (처리시간: ${(totalTime / 1000).toFixed(1)}초)`
    });

  } catch (error) {
    console.error('분석 중 오류 발생:', error);
    
    let errorMessage = '분석 중 오류가 발생했습니다.';
    
    if (error instanceof Error) {
      if (error.message.includes('시트를 찾을 수 없습니다')) {
        errorMessage = 'Excel 파일의 첫 번째 시트를 읽을 수 없습니다. 파일 형식을 확인해주세요.';
      } else if (error.message.includes('parsing')) {
        errorMessage = 'Excel 파일 파싱 중 오류가 발생했습니다. 파일 내용을 확인해주세요.';
      } else if (error.message.includes('network')) {
        errorMessage = '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message.includes('timeout')) {
        errorMessage = '처리 시간이 초과되었습니다. 파일 크기를 줄여서 다시 시도해주세요.';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json<AnalysisResponse>({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

// GET 메서드는 지원하지 않음
export async function GET() {
  return NextResponse.json({
    error: 'GET 메서드는 지원되지 않습니다. POST 메서드를 사용해주세요.'
  }, { status: 405 });
} 