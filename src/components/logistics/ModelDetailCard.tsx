'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CarModel } from '@/types/logistics';
import { 
  Car, 
  Palette, 
  Calendar, 
  Package, 
  CheckCircle, 
  Clock, 
  User,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelDetailCardProps {
  model: CarModel;
  index: number;
}

export const ModelDetailCard: React.FC<ModelDetailCardProps> = ({ model, index }) => {
  const getStatusBadgeVariant = (count: number, type: 'transit' | 'assigned' | 'unassigned') => {
    if (count === 0) return 'secondary';
    
    switch (type) {
      case 'transit': return 'default';
      case 'assigned': return 'default';
      case 'unassigned': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusColor = (count: number, type: 'transit' | 'assigned' | 'unassigned') => {
    if (count === 0) return 'text-gray-400';
    
    switch (type) {
      case 'transit': return 'text-orange-600';
      case 'assigned': return 'text-amber-600';
      case 'unassigned': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '미정';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="w-full">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={`model-${index}`} className="border-none">
          <AccordionTrigger className="hover:no-underline p-6 pb-4">
            <div className="flex items-center justify-between w-full mr-4">
              {/* 기본 정보 */}
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Car className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">{model.model}</h3>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Palette className="h-4 w-4 mr-1" />
                      {model.color}
                    </span>
                    <span>{model.trim}</span>
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {model.year}년
                    </span>
                  </div>
                </div>
              </div>

              {/* 상태 요약 */}
              <div className="flex items-center space-x-2">
                <div className="text-right mr-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {model.total_count}
                  </div>
                  <div className="text-xs text-gray-500">총 차량</div>
                </div>
                
                <div className="flex space-x-1">
                  <Badge 
                    variant={getStatusBadgeVariant(model.in_transit, 'transit')}
                    className="text-xs"
                  >
                    운송 {model.in_transit}
                  </Badge>
                  <Badge 
                    variant={getStatusBadgeVariant(model.pending_assigned, 'assigned')}
                    className="text-xs"
                  >
                    배정 {model.pending_assigned}
                  </Badge>
                  <Badge 
                    variant={getStatusBadgeVariant(model.pending_unassigned, 'unassigned')}
                    className="text-xs"
                  >
                    대기 {model.pending_unassigned}
                  </Badge>
                </div>
              </div>
            </div>
          </AccordionTrigger>
          
          <AccordionContent className="px-6 pb-6">
            <div className="space-y-6">
              {/* 상세 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg">
                  <Package className={cn("h-8 w-8", getStatusColor(model.in_transit, 'transit'))} />
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {model.in_transit}
                    </div>
                    <div className="text-sm text-orange-700">운송중</div>
                    <div className="text-xs text-orange-600">VPC입고 및 운송중</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-amber-50 rounded-lg">
                  <CheckCircle className={cn("h-8 w-8", getStatusColor(model.pending_assigned, 'assigned'))} />
                  <div>
                    <div className="text-2xl font-bold text-amber-600">
                      {model.pending_assigned}
                    </div>
                    <div className="text-sm text-amber-700">배정 완료</div>
                    <div className="text-xs text-amber-600">커미션번호 배정됨</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                  <Clock className={cn("h-8 w-8", getStatusColor(model.pending_unassigned, 'unassigned'))} />
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {model.pending_unassigned}
                    </div>
                    <div className="text-sm text-green-700">배정 대기</div>
                    <div className="text-xs text-green-600">배정 대기 중</div>
                  </div>
                </div>
              </div>

              {/* 추가 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 차량 정보 */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    차량 정보
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">모델명:</span>
                      <span className="font-medium">{model.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">외장색상:</span>
                      <span className="font-medium">{model.color}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">내장/트림:</span>
                      <span className="font-medium">{model.trim}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">연식:</span>
                      <span className="font-medium">{model.year}년</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">인도예정일:</span>
                      <span className="font-medium">{formatDate(model.delivery_date)}</span>
                    </div>
                  </div>
                </div>

                {/* 영업사원 정보 */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    담당 영업사원 ({model.salesmen.length}명)
                  </h4>
                  <div className="space-y-2">
                    {model.salesmen.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {model.salesmen.map((salesman, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {salesman}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        배정된 영업사원이 없습니다.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 상태 분석 */}
              {model.total_count > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">상태 분석</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">배정률:</span>
                      <span className="font-medium">
                        {model.pending_assigned + model.pending_unassigned > 0 
                          ? Math.round((model.pending_assigned / (model.pending_assigned + model.pending_unassigned)) * 100)
                          : 0
                        }%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">가용률:</span>
                      <span className="font-medium">
                        {Math.round(((model.in_transit + model.pending_assigned) / (model.in_transit + model.pending_assigned + model.pending_unassigned)) * 100)}%
                      </span>
                    </div>

                    {model.pending_unassigned > model.pending_assigned && (
                      <div className="flex items-center space-x-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                        <Clock className="h-3 w-3" />
                        <span>배정 대기 차량이 많습니다. 우선 배정을 고려해보세요.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}; 