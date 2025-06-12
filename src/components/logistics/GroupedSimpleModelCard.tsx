'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Truck, 
  CheckCircle,
  Clock,
  Calendar,
  User,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { CarModel } from '@/types/logistics';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface GroupedModelData {
  modelName: string;
  variants: CarModel[];
  totalCount: number;
  inTransit: number;
  pendingAssigned: number;
  pendingUnassigned: number;
  earliestDeliveryDate?: string;
  allSalesmen: string[];
}

interface GroupedSimpleModelCardProps {
  groupData: GroupedModelData;
  index: number;
}

export function GroupedSimpleModelCard({ groupData, index }: GroupedSimpleModelCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasNegativeTotal = groupData.totalCount < 0;

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 ${hasNegativeTotal ? 'border-red-200 bg-red-50' : ''}`}>
      <CardHeader className="pb-4">
        {/* 모델명과 총 대수 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Car className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">{groupData.modelName}</h3>
              <p className="text-sm text-gray-500">
                {groupData.variants.length}개 변형 모델
              </p>
            </div>
          </div>
          <Badge 
            variant={hasNegativeTotal ? "destructive" : "secondary"} 
            className="text-xl px-4 py-2 font-bold"
          >
            총 {groupData.totalCount}대
          </Badge>
        </div>

        {/* 모델 전체 요약 - 컴팩트 버전 */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {/* 운송중 */}
          {groupData.inTransit > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Truck className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-800">운송중</span>
              </div>
              <p className="text-xl font-bold text-blue-900 mb-1">{groupData.inTransit}대</p>
              {groupData.earliestDeliveryDate && (
                <div className="flex items-center space-x-1 text-xs text-blue-700">
                  <Calendar className="h-3 w-3" />
                  <span className="truncate">
                    {groupData.earliestDeliveryDate.length > 20 
                      ? `${groupData.earliestDeliveryDate.substring(0, 20)}...` 
                      : groupData.earliestDeliveryDate}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 배정완료 */}
          {groupData.pendingAssigned > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-800">배정완료</span>
              </div>
              <p className="text-xl font-bold text-amber-900">{groupData.pendingAssigned}대</p>
            </div>
          )}

          {/* 배정대기 */}
          {groupData.pendingUnassigned > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-800">배정대기</span>
              </div>
              <p className="text-xl font-bold text-green-900 mb-1">{groupData.pendingUnassigned}대</p>
              {groupData.allSalesmen && groupData.allSalesmen.length > 0 && (
                <div className="flex items-center space-x-1 text-xs text-green-700">
                  <User className="h-3 w-3" />
                  <span>담당: {groupData.allSalesmen.slice(0, 2).join(', ')}</span>
                  {groupData.allSalesmen.length > 2 && <span> 외 {groupData.allSalesmen.length - 2}명</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 음수 경고 */}
        {hasNegativeTotal && (
          <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded text-center">
            <p className="text-sm text-red-700 font-medium">
              ⚠️ 배정대기가 운송중+배정완료보다 많습니다
            </p>
          </div>
        )}
      </CardHeader>

      {/* 상세 변형 모델 목록 */}
      <CardContent>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="text-sm font-medium text-gray-700">
              상세 변형 모델 보기 ({groupData.variants.length}개)
            </span>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4">
            {/* 테이블형 상세 변형 모델 보기 */}
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연식</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">외장색상</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">내장/트림</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">도착예정일</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">운송중</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">배정완료</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">배정대기</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">총계</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">담당영업사원</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groupData.variants.map((variant, idx) => (
                      <tr key={`${variant.model}-${variant.color}-${variant.trim}-${variant.year}-${idx}`} 
                          className={`hover:bg-gray-50 ${variant.total_count < 0 ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {variant.year}년
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {variant.color || '색상정보없음'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {variant.trim || '트림정보없음'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900">
                          <div className={variant.delivery_date ? "text-blue-600 font-medium" : "text-gray-400"}>
                            {variant.delivery_date ? (
                              <div className="space-y-1">
                                {variant.delivery_date.split(', ').map((date, dateIdx) => (
                                  <div key={dateIdx} className="text-xs bg-blue-100 px-2 py-1 rounded">
                                    {date}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              "미정"
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {variant.in_transit > 0 ? (
                            <Badge className="bg-blue-100 text-blue-800 font-medium">
                              {variant.in_transit}대
                            </Badge>
                          ) : (
                            <span className="text-gray-300">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {variant.pending_assigned > 0 ? (
                            <Badge className="bg-amber-100 text-amber-800 font-medium">
                              {variant.pending_assigned}대
                            </Badge>
                          ) : (
                            <span className="text-gray-300">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {variant.pending_unassigned > 0 ? (
                            <Badge className="bg-green-100 text-green-800 font-medium">
                              {variant.pending_unassigned}대
                            </Badge>
                          ) : (
                            <span className="text-gray-300">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <Badge 
                            variant={variant.total_count < 0 ? "destructive" : "outline"}
                            className="font-medium"
                          >
                            {variant.total_count}대
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {variant.salesmen && variant.salesmen.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {variant.salesmen.slice(0, 2).map((salesman, sIdx) => (
                                <span key={sIdx} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                  {salesman}
                                </span>
                              ))}
                              {variant.salesmen.length > 2 && (
                                <span className="text-xs text-green-600 px-2 py-1">
                                  +{variant.salesmen.length - 2}명
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">없음</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
} 