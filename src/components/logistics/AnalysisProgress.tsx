'use client';

import React from 'react';
import { Loader2, CheckCircle, AlertCircle, FileText, Database, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AnalysisProgress as AnalysisProgressType } from '@/types/logistics';
import { cn } from '@/lib/utils';

interface AnalysisProgressProps {
  progress: AnalysisProgressType;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ progress }) => {
  const getStepIcon = (step: string, isActive: boolean, isCompleted: boolean, hasError: boolean) => {
    if (hasError && isActive) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    
    if (isCompleted) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    
    if (isActive) {
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    }

    switch (step) {
      case 'validating':
        return <FileText className="h-5 w-5 text-gray-400" />;
      case 'uploading':
        return <Database className="h-5 w-5 text-gray-400" />;
      case 'analyzing':
        return <BarChart3 className="h-5 w-5 text-gray-400" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-gray-400" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-300" />;
    }
  };

  const steps = [
    { key: 'validating', label: '파일 검증 중', description: '업로드된 파일의 형식과 내용을 확인합니다.' },
    { key: 'uploading', label: '파일 업로드 중', description: '서버로 파일을 전송합니다.' },
    { key: 'analyzing', label: '데이터 분석 중', description: '물류와 판매 데이터를 분석합니다.' },
    { key: 'processing', label: '결과 처리 중', description: '분석 결과를 정리하고 계산합니다.' }
  ];

  const getCurrentStepIndex = () => {
    switch (progress.step) {
      case 'validating': return 0;
      case 'uploading': return 1;
      case 'analyzing': return 2;
      case 'processing': return 3;
      case 'completed': return 4;
      case 'error': return steps.findIndex(step => step.key === 'analyzing'); // 에러 발생 시점 표시
      default: return -1;
    }
  };

  const currentStepIndex = getCurrentStepIndex();
  const hasError = progress.step === 'error';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>분석 진행 상황</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 전체 진행률 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">전체 진행률</span>
            <span className="text-sm font-medium text-gray-900">{progress.progress}%</span>
          </div>
          <Progress 
            value={progress.progress} 
            className={cn(
              "h-2",
              hasError && "bg-red-100"
            )}
          />
        </div>

        {/* 현재 상태 메시지 */}
        <div className={cn(
          "p-4 rounded-lg flex items-center space-x-3",
          hasError ? "bg-red-50" : "bg-blue-50"
        )}>
          {hasError ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : (
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          )}
          <div>
            <p className={cn(
              "font-medium",
              hasError ? "text-red-800" : "text-blue-800"
            )}>
              {progress.message}
            </p>
            {hasError && (
              <p className="text-sm text-red-600 mt-1">
                오류가 발생했습니다. 파일을 확인하고 다시 시도해주세요.
              </p>
            )}
          </div>
        </div>

        {/* 단계별 진행 상황 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">단계별 진행 상황</h4>
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isActive = currentStepIndex === index;
              const isCompleted = currentStepIndex > index;
              const stepHasError = hasError && isActive;

              return (
                <div
                  key={step.key}
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-lg transition-colors",
                    isActive && !stepHasError && "bg-blue-50",
                    isCompleted && "bg-green-50",
                    stepHasError && "bg-red-50"
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getStepIcon(step.key, isActive, isCompleted, stepHasError)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium",
                      isActive && !stepHasError && "text-blue-800",
                      isCompleted && "text-green-800",
                      stepHasError && "text-red-800",
                      !isActive && !isCompleted && !stepHasError && "text-gray-600"
                    )}>
                      {step.label}
                    </p>
                    <p className={cn(
                      "text-xs mt-1",
                      isActive && !stepHasError && "text-blue-600",
                      isCompleted && "text-green-600",
                      stepHasError && "text-red-600",
                      !isActive && !isCompleted && !stepHasError && "text-gray-500"
                    )}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 완료 메시지 */}
        {progress.step === 'completed' && (
          <div className="bg-green-50 p-4 rounded-lg flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium text-green-800">분석이 완료되었습니다!</p>
              <p className="text-sm text-green-600 mt-1">
                결과 페이지로 이동하여 분석 결과를 확인하세요.
              </p>
            </div>
          </div>
        )}

        {/* 예상 완료 시간 (진행 중일 때만) */}
        {progress.step !== 'idle' && progress.step !== 'completed' && progress.step !== 'error' && (
          <div className="text-xs text-gray-500 text-center">
            <p>예상 완료 시간: {progress.progress < 50 ? '2-3분' : '1분 이내'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 