'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, BarChart3, FileText, Download } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-6">
            <Truck className="h-12 w-12 text-blue-600 mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">Mercedes-Benz</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            물류 관리 시스템
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            물류 및 판매 데이터를 업로드하여 차량 대기 현황을 실시간으로 분석하고 
            운송중, 배정대기, 미배정 상태별로 차량 재고를 관리할 수 있는 웹 기반 분석 시스템입니다.
          </p>
        </div>

        {/* 기능 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Excel 파일 업로드</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                물류 및 판매 데이터를 Excel 파일 형태로 간편하게 업로드할 수 있습니다.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <BarChart3 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>실시간 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                업로드된 데이터를 자동으로 분석하여 차량 대기 현황을 실시간으로 파악합니다.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Download className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>리포트 생성</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                분석 결과를 Excel 파일로 다운로드하여 상세한 리포트를 생성할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 시작 버튼 */}
        <div className="text-center">
          <Link href="/logistics-service">
            <Button size="lg" className="px-8 py-4 text-lg">
              <Truck className="h-5 w-5 mr-2" />
              물류서비스 조회 시작하기
            </Button>
          </Link>
        </div>

        {/* 주요 기능 안내 */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-center">주요 기능</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">데이터 처리</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• 독일 물류 파일 (VPC입고, 운송중 상태)</li>
                  <li>• 판매 파일 (배정 정보 포함)</li>
                  <li>• 자동 데이터 매칭 및 검증</li>
                  <li>• 대용량 파일 지원 (최대 50MB)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">분석 결과</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• 운송중, 배정완료, 배정대기 현황</li>
                  <li>• 모델별 상세 분석</li>
                  <li>• 영업사원별 배정 현황</li>
                  <li>• 통계 및 KPI 대시보드</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


