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

      const response = await fetch('/api/analyze-logistics', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
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
      
      setAnalysisProgress({
        step: 'error',
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Truck className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">물류서비스 조회 (차량대기 분석)</h1>
          </div>
          <p className="text-lg text-gray-600">
            물류 및 판매 데이터를 업로드하여 차량 대기 현황을 실시간으로 분석합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 파일 업로드 섹션 */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              파일 업로드
            </h2>

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
            <div className="flex space-x-4">
              <Button
                onClick={handleStartAnalysis}
                disabled={!canStartAnalysis}
                className="flex-1 py-3 text-base font-medium"
                size="lg"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                분석 시작
              </Button>

              {(isAnalyzing || analysisProgress.step === 'error') && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="lg"
                  className="py-3"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  다시 시작
                </Button>
              )}
            </div>
          </div>

          {/* 분석 진행 상황 섹션 */}
          <div>
            <AnalysisProgress progress={analysisProgress} />
          </div>
        </div>
      </div>
    </div>
  );
} 