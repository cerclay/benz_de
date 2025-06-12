'use client';

import React from 'react';
import { Loader2, CheckCircle, AlertCircle, FileText, Database, BarChart3, Zap } from 'lucide-react';
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
      return <AlertCircle className="h-6 w-6 text-red-500" />;
    }
    
    if (isCompleted) {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    }
    
    if (isActive) {
      return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
    }

    switch (step) {
      case 'validating':
        return <FileText className="h-6 w-6 text-gray-400" />;
      case 'uploading':
        return <Database className="h-6 w-6 text-gray-400" />;
      case 'analyzing':
        return <BarChart3 className="h-6 w-6 text-gray-400" />;
      case 'processing':
        return <Zap className="h-6 w-6 text-gray-400" />;
      default:
        return <div className="h-6 w-6 rounded-full bg-gray-300" />;
    }
  };

  const steps = [
    { key: 'validating', label: '파일 검증', description: '파일 형식 및 내용 확인' },
    { key: 'uploading', label: '파일 업로드', description: '서버로 파일 전송' },
    { key: 'analyzing', label: '데이터 분석', description: '물류 및 판매 데이터 분석' },
    { key: 'processing', label: '결과 처리', description: '분석 결과 정리 및 계산' }
  ];

  const getCurrentStepIndex = () => {
    switch (progress.step) {
      case 'validating': return 0;
      case 'uploading': return 1;
      case 'analyzing': return 2;
      case 'processing': return 3;
      case 'completed': return 4;
      case 'error': return steps.findIndex(step => step.key === 'analyzing');
      default: return -1;
    }
  };

  const currentStepIndex = getCurrentStepIndex();
  const hasError = progress.step === 'error';

  return (
    <Card className="w-full shadow-lg border-0 bg-white">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center space-x-3 text-2xl">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <span className="text-gray-900">분석 진행 상황</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* 전체 진행률 */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-700">전체 진행률</span>
            <span className="text-2xl font-bold text-gray-900">{progress.progress}%</span>
          </div>
          <div className="relative">
            <Progress 
              value={progress.progress} 
              className={cn(
                "h-3 bg-gray-100",
                hasError && "bg-red-100"
              )}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500" 
                 style={{ width: `${progress.progress}%` }} />
          </div>
        </div>

        {/* 현재 상태 메시지 */}
        <div className={cn(
          "p-6 rounded-2xl flex items-start space-x-4 border-l-4",
          hasError 
            ? "bg-red-50 border-red-500" 
            : progress.step === 'completed'
            ? "bg-green-50 border-green-500"
            : "bg-blue-50 border-blue-500"
        )}>
          <div className="flex-shrink-0 mt-1">
            {hasError ? (
              <AlertCircle className="h-7 w-7 text-red-500" />
            ) : progress.step === 'completed' ? (
              <CheckCircle className="h-7 w-7 text-green-500" />
            ) : (
              <Loader2 className="h-7 w-7 text-blue-500 animate-spin" />
            )}
          </div>
          <div className="flex-1">
            <p className={cn(
              "text-lg font-semibold mb-1",
              hasError ? "text-red-800" : 
              progress.step === 'completed' ? "text-green-800" : "text-blue-800"
            )}>
              {progress.message}
            </p>
            {hasError && (
              <p className="text-red-600">
                오류가 발생했습니다. 파일을 확인하고 다시 시도해주세요.
              </p>
            )}
            {progress.step === 'completed' && (
              <p className="text-green-600">
                결과 페이지로 이동하여 분석 결과를 확인하세요.
              </p>
            )}
          </div>
        </div>

        {/* 단계별 진행 상황 */}
        {progress.step !== 'idle' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-700">단계별 진행 상황</h4>
            <div className="space-y-4">
              {steps.map((step, index) => {
                const isActive = currentStepIndex === index;
                const isCompleted = currentStepIndex > index;
                const stepHasError = hasError && isActive;

                return (
                  <div
                    key={step.key}
                    className={cn(
                      "flex items-center space-x-4 p-4 rounded-xl transition-all duration-300",
                      isActive && !stepHasError && "bg-blue-50 border border-blue-200",
                      isCompleted && "bg-green-50 border border-green-200",
                      stepHasError && "bg-red-50 border border-red-200",
                      !isActive && !isCompleted && !stepHasError && "bg-gray-50 border border-gray-200"
                    )}
                  >
                    <div className="flex-shrink-0">
                      {getStepIcon(step.key, isActive, isCompleted, stepHasError)}
                    </div>
                    <div className="flex-1">
                      <p className={cn(
                        "font-semibold",
                        isActive && !stepHasError && "text-blue-800",
                        isCompleted && "text-green-800",
                        stepHasError && "text-red-800",
                        !isActive && !isCompleted && !stepHasError && "text-gray-600"
                      )}>
                        {step.label}
                      </p>
                      <p className={cn(
                        "text-sm mt-1",
                        isActive && !stepHasError && "text-blue-600",
                        isCompleted && "text-green-600",
                        stepHasError && "text-red-600",
                        !isActive && !isCompleted && !stepHasError && "text-gray-500"
                      )}>
                        {step.description}
                      </p>
                    </div>
                    {isCompleted && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 예상 완료 시간 */}
        {progress.step !== 'idle' && progress.step !== 'completed' && progress.step !== 'error' && (
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-gray-600">
              <span className="font-medium">예상 완료 시간:</span> {progress.progress < 50 ? '2-3분' : '1분 이내'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 