'use client';

import React, { useCallback, useState } from 'react';
import { Upload, CheckCircle, AlertCircle, FileText, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { validateExcelFile } from '@/lib/excel-parser';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  title: string;
  description: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  onError: (error: string | null) => void;
  error: string | null;
  uploaded: boolean;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  title,
  description,
  file,
  onFileSelect,
  onError,
  error,
  uploaded,
  disabled = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileValidation = useCallback((selectedFile: File) => {
    const validation = validateExcelFile(selectedFile);
    
    if (!validation.valid) {
      onError(validation.error || '파일 검증에 실패했습니다.');
      onFileSelect(null);
      return false;
    }
    
    onError(null);
    onFileSelect(selectedFile);
    return true;
  }, [onFileSelect, onError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileValidation(files[0]);
    }
  }, [disabled, handleFileValidation]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileValidation(files[0]);
    }
    // input 초기화
    e.target.value = '';
  }, [handleFileValidation]);

  const handleRemoveFile = useCallback(() => {
    onFileSelect(null);
    onError(null);
  }, [onFileSelect, onError]);

  const getStatusIcon = () => {
    if (error) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    if (uploaded && file) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (file) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    }
    return <Upload className="h-5 w-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (error) return error;
    if (uploaded && file) return '업로드 완료';
    if (file) return `선택된 파일: ${file.name}`;
    return 'Excel 파일을 선택하거나 드래그해주세요';
  };

  return (
    <Card className={cn(
      'transition-all duration-200',
      isDragOver && !disabled && 'ring-2 ring-blue-500 ring-offset-2',
      disabled && 'opacity-50 cursor-not-allowed'
    )}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* 제목 및 설명 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>

          {/* 파일 업로드 영역 */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              isDragOver && !disabled 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400',
              disabled && 'cursor-not-allowed',
              error && 'border-red-300 bg-red-50',
              uploaded && file && 'border-green-300 bg-green-50'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              {/* 아이콘 */}
              <div className="flex justify-center">
                {getStatusIcon()}
              </div>

              {/* 상태 텍스트 */}
              <div>
                <p className={cn(
                  'text-sm font-medium',
                  error ? 'text-red-600' : 
                  uploaded && file ? 'text-green-600' :
                  file ? 'text-blue-600' : 'text-gray-600'
                )}>
                  {getStatusText()}
                </p>
                
                {!file && !error && (
                  <p className="text-xs text-gray-500 mt-1">
                    지원 형식: .xlsx, .xls, .xlsb, .xlsm (최대 10MB)
                  </p>
                )}
              </div>

              {/* 파일 정보 */}
              {file && (
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <span>{file.name}</span>
                  <span>({(file.size / 1024 / 1024).toFixed(2)}MB)</span>
                  {!disabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="h-6 w-6 p-0 hover:bg-red-100"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              )}

              {/* 파일 선택 버튼 */}
              {!file && (
                <div>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.xlsb,.xlsm"
                    onChange={handleFileInput}
                    className="hidden"
                    id={`file-input-${title.replace(/\s+/g, '-').toLowerCase()}`}
                    disabled={disabled}
                  />
                  <label
                    htmlFor={`file-input-${title.replace(/\s+/g, '-').toLowerCase()}`}
                    className={cn(
                      'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors',
                      disabled && 'opacity-50 cursor-not-allowed hover:bg-blue-600'
                    )}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    파일 선택
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* 성공 메시지 */}
          {uploaded && file && !error && (
            <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-3 rounded-md">
              <CheckCircle className="h-4 w-4" />
              <span>파일이 성공적으로 업로드되었습니다.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 