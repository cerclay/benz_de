'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Truck, 
  CheckCircle,
  Clock,
  Calendar,
  User
} from 'lucide-react';
import { CarModel } from '@/types/logistics';

interface SimpleModelCardProps {
  model: CarModel;
  index: number;
}

export function SimpleModelCard({ model, index }: SimpleModelCardProps) {
  const hasNegativeTotal = model.total_count < 0;

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 ${hasNegativeTotal ? 'border-red-200 bg-red-50' : ''}`}>
      <CardContent className="p-6">
        {/* 헤더 - 모델명과 총 대수 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Car className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">{model.model}</h3>
              <p className="text-sm text-gray-500">
                {model.year}년 • {model.color || '색상정보없음'} • {model.trim || '트림정보없음'}
              </p>
            </div>
          </div>
          <Badge 
            variant={hasNegativeTotal ? "destructive" : "secondary"} 
            className="text-lg px-3 py-1 font-bold"
          >
            총 {model.total_count}대
          </Badge>
        </div>

        {/* 상태별 정보 - 가로 배치 */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* 운송중 */}
          {model.in_transit > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Truck className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">운송중</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mb-1">{model.in_transit}대</p>
              {model.delivery_date && (
                <div className="flex items-center space-x-1 text-xs text-blue-700">
                  <Calendar className="h-3 w-3" />
                  <span>도착: {model.delivery_date}</span>
                </div>
              )}
            </div>
          )}

          {/* 배정완료 */}
          {model.pending_assigned > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">배정완료</span>
              </div>
              <p className="text-2xl font-bold text-amber-900">{model.pending_assigned}대</p>
            </div>
          )}

          {/* 배정대기 */}
          {model.pending_unassigned > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">배정대기</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mb-1">{model.pending_unassigned}대</p>
              {model.salesmen && model.salesmen.length > 0 && (
                <div className="flex items-center space-x-1 text-xs text-green-700">
                  <User className="h-3 w-3" />
                  <span>{model.salesmen.join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 빈 상태 표시 */}
        {model.in_transit === 0 && model.pending_assigned === 0 && model.pending_unassigned === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">현재 대기 중인 차량이 없습니다</p>
          </div>
        )}

        {/* 음수 경고 */}
        {hasNegativeTotal && (
          <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-center">
            <p className="text-sm text-red-700 font-medium">
              ⚠️ 배정대기가 운송중+배정완료보다 많습니다
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 