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
      return <AlertCircle className="h-8 w-8 text-red-500" />;
    }
    if (uploaded && file) {
      return <CheckCircle className="h-8 w-8 text-green-500" />;
    }
    if (file) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    }
    return <Upload className="h-8 w-8 text-gray-400" />;
  };

  const getStatusText = () => {
    if (error) return error;
    if (uploaded && file) return '업로드 완료';
    if (file) return `${file.name}`;
    return '';
  };

  return (
    <Card className={cn(
      'transition-all duration-300 hover:shadow-lg border-2',
      isDragOver && !disabled && 'ring-2 ring-blue-500 ring-offset-2 border-blue-300',
      disabled && 'opacity-50 cursor-not-allowed',
      error && 'border-red-300 bg-red-50',
      uploaded && file && 'border-green-300 bg-green-50',
      !error && !file && 'border-gray-200 hover:border-gray-300'
    )}>
      <CardContent className="p-8">
        <div className="space-y-6">
          {/* 제목 및 설명 */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>

          {/* 파일 업로드 영역 */}
          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300',
              isDragOver && !disabled 
                ? 'border-blue-400 bg-blue-50 scale-105' 
                : 'border-gray-300',
              disabled && 'cursor-not-allowed',
              error && 'border-red-300 bg-red-50',
              uploaded && file && 'border-green-300 bg-green-50',
              !error && !file && 'hover:border-gray-400 hover:bg-gray-50'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-6">
              {/* 아이콘 */}
              <div className="flex justify-center">
                {getStatusIcon()}
              </div>

              {/* 상태 텍스트 */}
              {getStatusText() && (
                <div>
                  <p className={cn(
                    'text-base font-medium',
                    error ? 'text-red-600' : 
                    uploaded && file ? 'text-green-600' :
                    file ? 'text-blue-600' : 'text-gray-600'
                  )}>
                    {getStatusText()}
                  </p>
                </div>
              )}

              {/* 파일 정보 */}
              {file && (
                <div className="flex items-center justify-center space-x-3 text-sm text-gray-600 bg-white rounded-lg p-3 border">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{file.name}</span>
                  <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(2)}MB)</span>
                  {!disabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="h-6 w-6 p-0 hover:bg-red-100 ml-2"
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
                      'inline-flex items-center px-8 py-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
                      disabled && 'opacity-50 cursor-not-allowed hover:from-blue-600 hover:to-blue-700 transform-none'
                    )}
                  >
                    <Upload className="h-5 w-5 mr-3" />
                    파일 선택
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 