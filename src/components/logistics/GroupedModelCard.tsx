'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Car, 
  Users, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Truck,
  Package
} from 'lucide-react';
import { CarModel } from '@/types/logistics';

interface ColorGroup {
  color: string;
  items: CarModel[];
  totalCount: number;
  inTransit: number;
  pendingAssigned: number;
  pendingUnassigned: number;
}

interface GroupedModelData {
  modelName: string;
  totalCount: number;
  inTransit: number;
  pendingAssigned: number;
  pendingUnassigned: number;
  colorGroups: ColorGroup[];
}

interface GroupedModelCardProps {
  modelGroup: GroupedModelData;
  index: number;
}

export function GroupedModelCard({ modelGroup, index }: GroupedModelCardProps) {
  const { modelName, totalCount, inTransit, pendingAssigned, pendingUnassigned, colorGroups } = modelGroup;

  // 상태별 색상 정의
  const getStatusColor = (status: 'in_transit' | 'assigned' | 'unassigned') => {
    switch (status) {
      case 'in_transit': return 'text-blue-600 bg-blue-50';
      case 'assigned': return 'text-amber-600 bg-amber-50';
      case 'unassigned': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: 'in_transit' | 'assigned' | 'unassigned') => {
    switch (status) {
      case 'in_transit': return <Truck className="h-4 w-4" />;
      case 'assigned': return <CheckCircle className="h-4 w-4" />;
      case 'unassigned': return <Clock className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Car className="h-5 w-5 mr-2 text-blue-600" />
            {modelName}
          </CardTitle>
          <Badge 
            variant={totalCount < 0 ? "destructive" : "secondary"} 
            className="text-sm"
          >
            총 {totalCount}대
          </Badge>
        </div>
        
        {/* 모델 총계 요약 */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          {inTransit > 0 && (
            <div className={`flex flex-col space-y-1 p-2 rounded-lg ${getStatusColor('in_transit')}`}>
              <div className="flex items-center space-x-2">
                {getStatusIcon('in_transit')}
                <div>
                  <p className="text-xs font-medium">운송중</p>
                  <p className="text-sm font-bold">{inTransit}대</p>
                </div>
              </div>
              {/* 전체 모델의 가장 빠른 도착예정일 */}
              {(() => {
                const allDates = colorGroups
                  .flatMap(cg => cg.items)
                  .filter(item => item.in_transit > 0 && item.delivery_date)
                  .map(item => item.delivery_date)
                  .sort();
                return allDates.length > 0 ? (
                  <p className="text-xs text-blue-600">
                    최빠른: {allDates[0]}
                  </p>
                ) : null;
              })()}
            </div>
          )}
          
          {pendingAssigned > 0 && (
            <div className={`flex items-center space-x-2 p-2 rounded-lg ${getStatusColor('assigned')}`}>
              {getStatusIcon('assigned')}
              <div>
                <p className="text-xs font-medium">배정완료</p>
                <p className="text-sm font-bold">{pendingAssigned}대</p>
              </div>
            </div>
          )}
          
          {pendingUnassigned > 0 && (
            <div className={`flex flex-col space-y-1 p-2 rounded-lg ${getStatusColor('unassigned')}`}>
              <div className="flex items-center space-x-2">
                {getStatusIcon('unassigned')}
                <div>
                  <p className="text-xs font-medium">배정대기</p>
                  <p className="text-sm font-bold">{pendingUnassigned}대</p>
                </div>
              </div>
              {/* 전체 모델의 담당 영업사원 목록 */}
              {(() => {
                const allSalesmen = new Set();
                colorGroups
                  .flatMap(cg => cg.items)
                  .filter(item => item.pending_unassigned > 0 && item.salesmen)
                  .forEach(item => {
                    item.salesmen.forEach(salesman => allSalesmen.add(salesman));
                  });
                const salesmenList = Array.from(allSalesmen);
                return salesmenList.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {salesmenList.slice(0, 2).map((salesman, idx) => (
                      <span key={idx} className="inline-block bg-green-200 text-green-800 text-xs px-1 py-0.5 rounded">
                        {salesman}
                      </span>
                    ))}
                    {salesmenList.length > 2 && (
                      <span className="text-xs text-green-600">+{salesmenList.length - 2}명</span>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="details">
            <AccordionTrigger className="text-sm font-medium">
              색상별 상세 현황 ({colorGroups.length}개 색상)
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {colorGroups.map((colorGroup, colorIndex) => (
                  <div key={`${colorGroup.color}-${colorIndex}`} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-gray-300 mr-2"
                          style={{ backgroundColor: colorGroup.color === '색상 정보 없음' ? '#gray' : undefined }}
                        />
                        {colorGroup.color}
                      </h4>
                      <Badge 
                        variant={colorGroup.totalCount < 0 ? "destructive" : "outline"}
                      >
                        {colorGroup.totalCount}대
                      </Badge>
                    </div>

                    {/* 색상별 상태 요약 */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {colorGroup.inTransit > 0 && (
                        <div className="text-center p-2 bg-blue-100 rounded">
                          <p className="text-xs text-blue-700">운송중</p>
                          <p className="font-bold text-blue-900">{colorGroup.inTransit}</p>
                          {/* 가장 빠른 도착예정일 표시 */}
                          {(() => {
                            const earliestDate = colorGroup.items
                              .filter(item => item.in_transit > 0 && item.delivery_date)
                              .map(item => item.delivery_date)
                              .sort()[0];
                            return earliestDate ? (
                              <p className="text-xs text-blue-600 mt-1">
                                최빠른: {earliestDate}
                              </p>
                            ) : null;
                          })()}
                        </div>
                      )}
                      {colorGroup.pendingAssigned > 0 && (
                        <div className="text-center p-2 bg-amber-100 rounded">
                          <p className="text-xs text-amber-700">배정완료</p>
                          <p className="font-bold text-amber-900">{colorGroup.pendingAssigned}</p>
                        </div>
                      )}
                      {colorGroup.pendingUnassigned > 0 && (
                        <div className="text-center p-2 bg-green-100 rounded">
                          <p className="text-xs text-green-700">배정대기</p>
                          <p className="font-bold text-green-900">{colorGroup.pendingUnassigned}</p>
                          {/* 담당 영업사원 목록 표시 */}
                          {(() => {
                            const salesmenSet = new Set();
                            colorGroup.items
                              .filter(item => item.pending_unassigned > 0 && item.salesmen)
                              .forEach(item => {
                                item.salesmen.forEach(salesman => salesmenSet.add(salesman));
                              });
                            const salesmenList = Array.from(salesmenSet);
                            return salesmenList.length > 0 ? (
                              <div className="mt-1">
                                <p className="text-xs text-green-600 font-medium">👤 담당자:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {salesmenList.slice(0, 3).map((salesman, idx) => (
                                    <span key={idx} className="inline-block bg-green-200 text-green-800 text-xs px-1 py-0.5 rounded">
                                      {salesman}
                                    </span>
                                  ))}
                                  {salesmenList.length > 3 && (
                                    <span className="text-xs text-green-600">+{salesmenList.length - 3}명</span>
                                  )}
                                </div>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>

                    {/* 트림별 상세 정보 */}
                    <div className="space-y-2">
                      {colorGroup.items.map((item, itemIndex) => (
                        <div key={`${item.model}-${item.color}-${item.trim}-${itemIndex}`} 
                             className="bg-white p-3 rounded border">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.trim || '트림 정보 없음'}</p>
                              <p className="text-xs text-gray-500">연식: {item.year}</p>
                              {/* 운송중 차량의 도착예정일 */}
                              {item.in_transit > 0 && item.delivery_date && (
                                <p className="text-xs text-blue-600 font-medium">📅 도착예정: {item.delivery_date}</p>
                              )}
                              {/* 배정대기 차량의 영업사원 (더 눈에 띄게) */}
                              {item.pending_unassigned > 0 && item.salesmen && item.salesmen.length > 0 && (
                                <div className="mt-1">
                                  <p className="text-xs text-green-700 font-medium mb-1">👤 담당 영업사원:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {item.salesmen.map((salesman, idx) => (
                                      <span key={idx} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                        {salesman}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col space-y-1">
                              <div className="flex space-x-2">
                                {item.in_transit > 0 && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                                    운송중 {item.in_transit}
                                  </Badge>
                                )}
                                {item.pending_assigned > 0 && (
                                  <Badge className="bg-amber-100 text-amber-800 text-xs">
                                    배정완료 {item.pending_assigned}
                                  </Badge>
                                )}
                                {item.pending_unassigned > 0 && (
                                  <Badge className="bg-green-100 text-green-800 text-xs">
                                    배정대기 {item.pending_unassigned}
                                  </Badge>
                                )}
                              </div>
                              
                              {/* 운송중 차량의 도착예정일 강조 표시 */}
                              {item.in_transit > 0 && item.delivery_date && (
                                <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded font-medium">
                                  <Truck className="h-3 w-3 mr-1" />
                                  📅 {item.delivery_date}
                                </div>
                              )}
                              
                              {/* 배정대기 차량의 영업사원 수 표시 */}
                              {item.pending_unassigned > 0 && item.salesmen && item.salesmen.length > 0 && (
                                <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-medium">
                                  <Users className="h-3 w-3 mr-1" />
                                  👤 {item.salesmen.length}명 담당
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
} 