'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileUploader } from '@/components/logistics/FileUploader';
import { AnalysisProgress } from '@/components/logistics/AnalysisProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, BarChart3, RefreshCw } from 'lucide-react';
import { FileUploadState, AnalysisProgress as AnalysisProgressType, AnalysisResponse } from '@/types/logistics';
import { useToast } from '@/hooks/use-toast';

export default function LogisticsServicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [fileState, setFileState] = useState<FileUploadState>({
    logistics: null,
    sales: null,
    logisticsUploaded: false,
    salesUploaded: false,
    logisticsError: null,
    salesError: null
  });

  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgressType>({
    step: 'idle',
    message: '분석을 시작하려면 파일을 업로드하고 분석 시작 버튼을 클릭하세요.',
    progress: 0
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 물류 파일 선택 핸들러
  const handleLogisticsFileSelect = useCallback((file: File | null) => {
    setFileState(prev => ({
      ...prev,
      logistics: file,
      logisticsUploaded: !!file
    }));
  }, []);

  // 판매 파일 선택 핸들러
  const handleSalesFileSelect = useCallback((file: File | null) => {
    setFileState(prev => ({
      ...prev,
      sales: file,
      salesUploaded: !!file
    }));
  }, []);

  // 물류 파일 에러 핸들러
  const handleLogisticsError = useCallback((error: string | null) => {
    setFileState(prev => ({
      ...prev,
      logisticsError: error
    }));
  }, []);

  // 판매 파일 에러 핸들러
  const handleSalesError = useCallback((error: string | null) => {
    setFileState(prev => ({
      ...prev,
      salesError: error
    }));
  }, []);

  // 분석 시작
  const handleStartAnalysis = useCallback(async () => {
    if (!fileState.logistics || !fileState.sales) {
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // 1단계: 검증
      setAnalysisProgress({
        step: 'validating',
        message: '파일 검증 중...',
        progress: 10
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // 2단계: 업로드
      setAnalysisProgress({
        step: 'uploading',
        message: '서버로 파일 업로드 중...',
        progress: 30
      });

      // FormData 생성
      const formData = new FormData();
      formData.append('logistics', fileState.logistics);
      formData.append('sales', fileState.sales);

      // 3단계: 분석
      setAnalysisProgress({
        step: 'analyzing',
        message: '데이터 분석 중...',
        progress: 60
      });

      // 타임아웃 설정 (55초)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000);

      const response = await fetch('/api/analyze-logistics', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 504) {
          throw new Error('처리 시간이 초과되었습니다. 파일 크기를 줄이거나 나누어서 업로드해주세요.');
        } else if (response.status === 413) {
          throw new Error('파일이 너무 큽니다. 10MB 이하의 파일을 업로드해주세요.');
        } else {
          throw new Error(`서버 오류 (${response.status}): 잠시 후 다시 시도해주세요.`);
        }
      }

      const result: AnalysisResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || '분석 중 오류가 발생했습니다.');
      }

      // 4단계: 처리
      setAnalysisProgress({
        step: 'processing',
        message: '결과 처리 중...',
        progress: 90
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // 완료
      setAnalysisProgress({
        step: 'completed',
        message: '분석이 완료되었습니다.',
        progress: 100
      });

      // 결과를 sessionStorage에 저장
      sessionStorage.setItem('analysisResult', JSON.stringify(result.data));

      // 잠시 후 결과 페이지로 이동
      setTimeout(() => {
        router.push('/logistics-service/result');
      }, 2000);

    } catch (error) {
      console.error('분석 오류:', error);
      
      let errorMessage = '알 수 없는 오류가 발생했습니다.';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = '요청이 취소되었습니다. 파일이 너무 크거나 처리 시간이 오래 걸립니다.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setAnalysisProgress({
        step: 'error',
        message: errorMessage,
        progress: 0
      });

      setIsAnalyzing(false);
    }
  }, [fileState.logistics, fileState.sales, router]);

  // 다시 시작
  const handleReset = useCallback(() => {
    setFileState({
      logistics: null,
      sales: null,
      logisticsUploaded: false,
      salesUploaded: false,
      logisticsError: null,
      salesError: null
    });
    
    setAnalysisProgress({
      step: 'idle',
      message: '분석을 시작하려면 파일을 업로드하고 분석 시작 버튼을 클릭하세요.',
      progress: 0
    });
    
    setIsAnalyzing(false);
  }, []);

  const canStartAnalysis = fileState.logistics && fileState.sales && 
                          !fileState.logisticsError && !fileState.salesError && 
                          !isAnalyzing;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 text-lg">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* 헤더 섹션 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="p-3 bg-blue-100 rounded-2xl">
                <Truck className="h-10 w-10 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">물류서비스 조회</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              물류 및 판매 데이터를 업로드하여 차량 대기 현황을 실시간으로 분석합니다
            </p>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 파일 업로드 섹션 */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">파일 업로드</h2>
              </div>
              <p className="text-gray-600">Excel 파일을 업로드하여 분석을 시작하세요</p>
            </div>

            {/* 물류 파일 업로드 */}
            <FileUploader
              title="독일 물류 파일"
              description="독일에서 한국으로 배송되는 파일 업로드"
              file={fileState.logistics}
              onFileSelect={handleLogisticsFileSelect}
              onError={handleLogisticsError}
              error={fileState.logisticsError}
              uploaded={fileState.logisticsUploaded}
              disabled={isAnalyzing}
            />

            {/* 판매 파일 업로드 */}
            <FileUploader
              title="판매 파일"
              description="한국에서 판매중인 파일을 업로드"
              file={fileState.sales}
              onFileSelect={handleSalesFileSelect}
              onError={handleSalesError}
              error={fileState.salesError}
              uploaded={fileState.salesUploaded}
              disabled={isAnalyzing}
            />

            {/* 분석 버튼 */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={handleStartAnalysis}
                disabled={!canStartAnalysis}
                className="flex-1 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                size="lg"
              >
                <BarChart3 className="h-6 w-6 mr-3" />
                분석 시작
              </Button>

              {(isAnalyzing || analysisProgress.step === 'error') && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="lg"
                  className="py-4 text-lg font-semibold border-2 hover:bg-gray-50 transition-all duration-300"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  다시 시작
                </Button>
              )}
            </div>

            {/* 파일 형식 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">지원 파일 형식</h3>
              <div className="flex flex-wrap gap-2">
                {['.xlsx', '.xls', '.xlsb', '.xlsm'].map((format) => (
                  <span key={format} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {format}
                  </span>
                ))}
              </div>
              <p className="text-blue-700 text-sm mt-3">최대 파일 크기: 10MB</p>
            </div>
          </div>

          {/* 분석 진행 상황 섹션 */}
          <div className="lg:pl-8">
            <AnalysisProgress progress={analysisProgress} />
          </div>
        </div>
      </div>
    </div>
  );
} 