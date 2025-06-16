import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image, Loader2, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { BucketType, uploadFile } from '@/services/storageService';

interface FileUploaderProps {
  bucketName: BucketType;
  onUploadComplete: (url: string) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  className?: string;
  defaultPreview?: string;
  label?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  bucketName,
  onUploadComplete,
  accept = {
    'image/*': ['.png', '.jpeg', '.jpg', '.gif', '.webp', '.svg'],
  },
  maxSize = 1048576, // 1MB
  className,
  defaultPreview,
  label = 'Arraste e solte uma imagem ou clique para selecionar'
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(defaultPreview || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Efeito para iniciar o upload automaticamente quando um arquivo é selecionado
  useEffect(() => {
    if (file && !isUploading && !uploadSuccess) {
      handleUpload();
    }
  }, [file]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    setUploadSuccess(false);
    
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      
      // Cria uma URL para preview da imagem
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setError(`Arquivo muito grande. Tamanho máximo: ${maxSize / 1024 / 1024}MB`);
      } else if (rejection.errors[0].code === 'file-invalid-type') {
        setError('Tipo de arquivo não suportado');
      } else {
        setError('Erro ao selecionar arquivo');
      }
    }
  });

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    setUploadSuccess(false);
    
    // Adiciona log sobre o bucket para o qual estamos fazendo upload
    console.log(`Iniciando upload para bucket: ${bucketName}`, {
      tipoArquivo: file.type,
      tamanhoArquivo: `${(file.size / 1024).toFixed(2)} KB`,
      nome: file.name
    });
    
    try {
      const result = await uploadFile(file, bucketName, true);
      
      if (result.success && result.url) {
        onUploadComplete(result.url);
        setIsUploading(false);
        setUploadSuccess(true);
        console.log(`Upload bem-sucedido para ${bucketName}: ${result.url}`);
      } else {
        // Verifica se o erro é relacionado ao bucket já existir
        const errorMessage = result.error?.message || result.error?.error_description || 
                            JSON.stringify(result.error) || 'Erro ao fazer upload do arquivo';
                            
        // Se o erro contiver "already exists", provavelmente é sobre o bucket
        if (typeof errorMessage === 'string' && errorMessage.includes('already exists')) {
          console.log('Bucket já existe, isso não é um problema real.');
          // Tentamos fazer o upload novamente, ignorando o erro do bucket
          try {
            const retryResult = await uploadFile(file, bucketName, true); // true para ignorar erro de bucket existente
            
            if (retryResult.success && retryResult.url) {
              onUploadComplete(retryResult.url);
              setIsUploading(false);
              setUploadSuccess(true);
              console.log(`Upload bem-sucedido na segunda tentativa: ${retryResult.url}`);
              return;
            }
          } catch (retryError) {
            console.error('Erro na segunda tentativa:', retryError);
          }
        }
        
        console.error('Detalhes do erro:', result.error);
        setError(`Falha no upload: ${errorMessage}`);
        setIsUploading(false);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro desconhecido';
      console.error('Exceção no upload:', err);
      setError(`Erro no upload: ${errorMessage}`);
      setIsUploading(false);
    }
  };

  const handleRemovePreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setFile(null);
    setUploadSuccess(false);
  };

  return (
    <div className={cn("w-full", className)}>
      {preview ? (
        <div className="relative rounded-lg border border-gray-200 p-1 overflow-hidden">
          <div className="relative w-full h-48 bg-gray-50 rounded-md overflow-hidden">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            <button
              onClick={handleRemovePreview}
              className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white rounded-full text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            {uploadSuccess && (
              <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                ✓ Salvo
              </div>
            )}
          </div>
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="bg-white p-3 rounded-lg flex flex-col items-center shadow-lg">
                <Loader2 className="h-8 w-8 animate-spin text-fiscal-green-500" />
                <span className="text-sm mt-2">Enviando...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="mt-2 text-sm text-red-500 bg-red-50 p-2 rounded-md">
              {error}
              <Button
                onClick={handleUpload}
                variant="destructive"
                size="sm"
                className="mt-2 w-full"
              >
                Tentar novamente
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors",
            isDragActive
              ? "border-fiscal-green-500 bg-fiscal-green-50"
              : "border-gray-300 bg-gray-50 hover:bg-gray-100",
            error && "border-red-300 bg-red-50",
            className
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <Image className={cn(
              "w-12 h-12",
              isDragActive ? "text-fiscal-green-500" : "text-gray-400"
            )} />
            <div className="text-sm text-gray-600">
              {label}
            </div>
            {error && (
              <div className="mt-2 text-sm text-red-500">{error}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { FileUploader }; 