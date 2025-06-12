'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnalysisResult } from '@/types/logistics';
import { 
  Truck, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Car
} from 'lucide-react';

interface ResultDashboardProps {
  data: AnalysisResult;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  bgColor, 
  textColor, 
  description 
}) => (
  <Card className="relative overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-600">
        {title}
      </CardTitle>
      <div className={`p-2 rounded-lg ${bgColor}`}>
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className={`text-3xl font-bold ${textColor}`}>
        {value.toLocaleString()}
      </div>
      {description && (
        <p className="text-xs text-gray-500 mt-1">
          {description}
        </p>
      )}
    </CardContent>
  </Card>
);

export const ResultDashboard: React.FC<ResultDashboardProps> = ({ data }) => {
  const { summary } = data;

  const stats = [
    {
      title: '총 모델 수',
      value: summary.totalModels,
      icon: <Car className="h-5 w-5 text-blue-600" />,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      description: '분석된 고유 모델 수'
    },
    {
      title: '총 차량 수',
      value: summary.totalVehicles,
      icon: <Truck className="h-5 w-5 text-green-600" />,
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      description: '전체 차량 재고'
    },
    {
      title: '운송중',
      value: summary.inTransit,
      icon: <Package className="h-5 w-5 text-orange-600" />,
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
      description: 'VPC입고 및 운송중 차량'
    },
    {
      title: '배정 완료',
      value: summary.pendingAssigned,
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      description: '커미션번호가 배정된 차량'
    },
    {
      title: '배정 대기',
      value: summary.pendingUnassigned,
      icon: <Clock className="h-5 w-5 text-yellow-600" />,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
      description: '배정 대기 중인 차량'
    },
    {
      title: '미매치 모델',
      value: summary.unmatchedModels,
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
      description: '판매 데이터가 없는 모델'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">분석 결과 대시보드</h2>
          <p className="text-gray-600 mt-1">차량 대기 현황 요약</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          총 {summary.totalModels}개 모델 분석 완료
        </Badge>
      </div>

      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </div>
  );
}; 