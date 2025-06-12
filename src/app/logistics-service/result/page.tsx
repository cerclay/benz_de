'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ResultDashboard } from '@/components/logistics/ResultDashboard';
import { GroupedSimpleModelCard } from '@/components/logistics/GroupedSimpleModelCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Download, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { AnalysisResult, CarModel, FilterOptions } from '@/types/logistics';
import { filterModels, sortModels } from '@/lib/logistics-analyzer';
import { exportToExcel, exportFilteredData, exportToCSV } from '@/lib/excel-exporter';
import { useToast } from '@/hooks/use-toast';

export default function ResultPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // 하이드레이션 안정화를 위한 마운트 상태
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [filteredModels, setFilteredModels] = useState<CarModel[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'in_transit' | 'pending_assigned' | 'pending_unassigned'>('all');
  
  // 필터 및 정렬 상태
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    model: 'all',
    color: 'all',
    trim: 'all',
    status: 'all',
    sortBy: 'model',
    sortOrder: 'asc'
  });

  // 마운트 상태 설정
  useEffect(() => {
    setMounted(true);
  }, []);

  // 데이터 로드
  useEffect(() => {
    if (!mounted) return; // 마운트 완료 후에만 실행
    
    const storedData = sessionStorage.getItem('analysisResult');
    if (storedData) {
      try {
        const parsedData: AnalysisResult = JSON.parse(storedData);
        setData(parsedData);
        setFilteredModels(parsedData.models);
      } catch (error) {
        console.error('데이터 파싱 오류:', error);
        toast({
          title: "오류",
          description: "분석 결과를 불러올 수 없습니다.",
          variant: "destructive"
        });
        router.push('/logistics-service');
      }
    } else {
      toast({
        title: "데이터 없음",
        description: "분석 결과가 없습니다. 새로 분석을 시작해주세요.",
        variant: "destructive"
      });
      router.push('/logistics-service');
    }
  }, [mounted, router, toast]);

  // 모델별 그룹화된 데이터 생성
  const groupedModelData = useMemo(() => {
    if (!data) return [];
    
    let models = data.models;
    
    // 탭 필터 적용
    switch (activeTab) {
      case 'in_transit':
        models = models.filter(model => model.in_transit > 0);
        break;
      case 'pending_assigned':
        models = models.filter(model => model.pending_assigned > 0);
        break;
      case 'pending_unassigned':
        models = models.filter(model => model.pending_unassigned > 0);
        break;
    }
    
    // 추가 필터 적용
    const filtered = filterModels(models, {
      searchQuery: filters.searchQuery,
      model: filters.model === 'all' ? '' : filters.model,
      color: filters.color === 'all' ? '' : filters.color,
      trim: filters.trim === 'all' ? '' : filters.trim
    });
    
    // 모델명별로 그룹화
    const modelGroups = new Map<string, CarModel[]>();
    
    filtered.forEach(model => {
      const key = model.model;
      if (!modelGroups.has(key)) {
        modelGroups.set(key, []);
      }
      modelGroups.get(key)!.push(model);
    });
    
    // 그룹화된 데이터를 배열로 변환
    const groupedData = Array.from(modelGroups.entries()).map(([modelName, variants]) => {
      // 모델 그룹의 총계 계산
      const totalCount = variants.reduce((sum, v) => sum + v.total_count, 0);
      const inTransit = variants.reduce((sum, v) => sum + v.in_transit, 0);
      const pendingAssigned = variants.reduce((sum, v) => sum + v.pending_assigned, 0);
      const pendingUnassigned = variants.reduce((sum, v) => sum + v.pending_unassigned, 0);
      
      // 가장 빠른 도착예정일 찾기
      const deliveryDates = variants
        .filter(v => v.in_transit > 0 && v.delivery_date)
        .map(v => v.delivery_date)
        .filter(date => date)
        .sort();
      const earliestDeliveryDate = deliveryDates[0];
      
      // 모든 영업사원 수집
      const allSalesmen = Array.from(new Set(
        variants
          .filter(v => v.pending_unassigned > 0 && v.salesmen)
          .flatMap(v => v.salesmen)
          .filter(salesman => salesman && salesman.trim() !== '')
      ));
      
      // 변형 모델들을 정렬 (연식 > 색상 > 트림 순)
      const sortedVariants = variants.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year; // 최신 연식 먼저
        if (a.color !== b.color) return a.color.localeCompare(b.color);
        return a.trim.localeCompare(b.trim);
      });
      
      return {
        modelName,
        variants: sortedVariants,
        totalCount,
        inTransit,
        pendingAssigned,
        pendingUnassigned,
        earliestDeliveryDate,
        allSalesmen
      };
    });
    
    // 정렬 적용
    if (filters.sortBy === 'model') {
      groupedData.sort((a, b) => {
        const compare = a.modelName.localeCompare(b.modelName);
        return filters.sortOrder === 'asc' ? compare : -compare;
      });
    } else if (filters.sortBy === 'total_count') {
      groupedData.sort((a, b) => {
        const compare = a.totalCount - b.totalCount;
        return filters.sortOrder === 'asc' ? compare : -compare;
      });
    }
    
    return groupedData;
  }, [data, activeTab, filters]);

  // 고유 값 추출 (필터 옵션용)
  const uniqueValues = useMemo(() => {
    if (!data) return { models: [], colors: [], trims: [] };
    
    return {
      models: Array.from(new Set(data.models.map(m => m.model)))
        .filter(value => value && value.trim() !== '')
        .sort(),
      colors: Array.from(new Set(data.models.map(m => m.color)))
        .filter(value => value && value.trim() !== '')
        .sort(),
      trims: Array.from(new Set(data.models.map(m => m.trim)))
        .filter(value => value && value.trim() !== '')
        .sort()
    };
  }, [data]);

  // 탭별 카운트 (모델 그룹 기준)
  const tabCounts = useMemo(() => {
    if (!data) return { all: 0, in_transit: 0, pending_assigned: 0, pending_unassigned: 0 };
    
    // 고유 모델명 개수로 계산
    const uniqueModels = new Set(data.models.map(m => m.model));
    const allModels = Array.from(uniqueModels);
    
    return {
      all: allModels.length,
      in_transit: allModels.filter(modelName => 
        data.models.some(m => m.model === modelName && m.in_transit > 0)
      ).length,
      pending_assigned: allModels.filter(modelName => 
        data.models.some(m => m.model === modelName && m.pending_assigned > 0)
      ).length,
      pending_unassigned: allModels.filter(modelName => 
        data.models.some(m => m.model === modelName && m.pending_unassigned > 0)
      ).length
    };
  }, [data]);

  // 검색 입력 핸들러
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, searchQuery: value }));
  };

  // 필터 변경 핸들러
  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 정렬 토글
  const toggleSort = (sortBy: 'model' | 'total_count' | 'delivery_date') => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      model: 'all',
      color: 'all',
      trim: 'all',
      status: 'all',
      sortBy: 'model',
      sortOrder: 'asc'
    });
  };

  // Excel 내보내기
  const handleExportExcel = () => {
    if (!data) return;
    
    const result = exportToExcel(data);
    if (result.success) {
      toast({
        title: "내보내기 완료",
        description: `${result.filename} 파일이 다운로드되었습니다.`
      });
    } else {
      toast({
        title: "내보내기 실패",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  // 필터된 데이터 내보내기
  const handleExportFiltered = () => {
    const result = exportFilteredData(filteredModelData, activeTab);
    if (result.success) {
      toast({
        title: "내보내기 완료",
        description: `${result.filename} 파일이 다운로드되었습니다. (${result.recordsCount}개 레코드)`
      });
    } else {
      toast({
        title: "내보내기 실패",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  // CSV 내보내기
  const handleExportCSV = () => {
    const result = exportToCSV(filteredModelData);
    if (result.success) {
      toast({
        title: "내보내기 완료",
        description: `${result.filename} 파일이 다운로드되었습니다.`
      });
    } else {
      toast({
        title: "내보내기 실패",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">페이지를 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/logistics-service')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              새 분석
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">분석 결과</h1>
              <p className="text-gray-600 mt-1">
                {new Date().toLocaleString('ko-KR')} 기준
              </p>
            </div>
          </div>
          
          {/* 내보내기 버튼 */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <FileText className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" onClick={handleExportFiltered}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              현재 뷰
            </Button>
            <Button onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              전체 내보내기
            </Button>
          </div>
        </div>

        {/* 대시보드 */}
        <div className="mb-8">
          <ResultDashboard data={data} />
        </div>

        {/* 필터 및 검색 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                필터 및 검색
              </span>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                초기화
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 검색 */}
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="search">통합 검색</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="모델명, 색상, 트림, 연식으로 검색..."
                    value={filters.searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* 필터 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="model-filter">모델명</Label>
                <Select value={filters.model} onValueChange={(value) => handleFilterChange('model', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {uniqueValues.models.map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="color-filter">색상</Label>
                <Select value={filters.color} onValueChange={(value) => handleFilterChange('color', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {uniqueValues.colors.map(color => (
                      <SelectItem key={color} value={color}>{color}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="trim-filter">트림</Label>
                <Select value={filters.trim} onValueChange={(value) => handleFilterChange('trim', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {uniqueValues.trims.map(trim => (
                      <SelectItem key={trim} value={trim}>{trim}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sort">정렬</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={filters.sortBy === 'model' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleSort('model')}
                    className="flex-1"
                  >
                    모델명
                    {filters.sortBy === 'model' && (
                      filters.sortOrder === 'asc' ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                  <Button
                    variant={filters.sortBy === 'total_count' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleSort('total_count')}
                    className="flex-1"
                  >
                    수량
                    {filters.sortBy === 'total_count' && (
                      filters.sortOrder === 'asc' ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 모델 목록 탭 */}
        <Card>
          <CardHeader>
            <CardTitle>모델별 상세 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="relative">
                  전체
                  <Badge variant="secondary" className="ml-2">
                    {tabCounts.all}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="in_transit" className="relative">
                  운송중
                  <Badge variant="secondary" className="ml-2">
                    {tabCounts.in_transit}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="pending_assigned" className="relative">
                  배정완료
                  <Badge variant="secondary" className="ml-2">
                    {tabCounts.pending_assigned}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="pending_unassigned" className="relative">
                  배정대기
                  <Badge variant="secondary" className="ml-2">
                    {tabCounts.pending_unassigned}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                {groupedModelData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {groupedModelData.length}개 모델 그룹 표시
                      </span>
                      <span className="text-xs text-gray-500">
                        총 {groupedModelData.reduce((sum, group) => sum + group.totalCount, 0)}대
                      </span>
                    </div>
                    
                    <div className="grid gap-6">
                      {groupedModelData.map((groupData, index) => (
                        <GroupedSimpleModelCard 
                          key={`${groupData.modelName}-${index}`}
                          groupData={groupData} 
                          index={index} 
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">해당하는 모델이 없습니다.</p>
                    <p className="text-gray-400 text-sm mt-2">
                      필터 조건을 변경하거나 초기화해보세요.
                    </p>
                  </div>
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 