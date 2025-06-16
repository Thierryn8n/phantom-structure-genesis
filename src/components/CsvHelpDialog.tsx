import React from 'react';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { FileText, Download, X, Info, Check } from 'lucide-react';
import { cn } from "@/lib/utils";
import { generateSampleCsv } from '@/utils/csvImport';

// Componentes base do Dialog
const CsvDialog = DialogPrimitive.Root;
const CsvDialogTrigger = DialogPrimitive.Trigger;
const CsvDialogPortal = DialogPrimitive.Portal;
const CsvDialogClose = DialogPrimitive.Close;

const CsvDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));

const CsvDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <CsvDialogPortal>
    <CsvDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 rounded-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-2 bg-gray-100 opacity-70 hover:opacity-100 hover:bg-gray-200 transition-all">
        <X className="h-4 w-4" />
        <span className="sr-only">Fechar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </CsvDialogPortal>
));

const CsvDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);

const CsvDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-gray-900", className)}
    {...props}
  />
));

const CsvDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
));

const CsvDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-2",
      className
    )}
    {...props}
  />
);

interface CsvHelpDialogProps {
  trigger?: React.ReactNode;
}

const CsvHelpDialog: React.FC<CsvHelpDialogProps> = ({ trigger }) => {
  const handleDownloadExample = () => {
    const csvContent = generateSampleCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'exemplo_produtos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <CsvDialog>
      <CsvDialogTrigger asChild>
        {trigger || (
          <button className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
            <FileText size={16} />
            <span>Ajuda com CSV</span>
          </button>
        )}
      </CsvDialogTrigger>
      <CsvDialogContent className="max-h-[85vh] overflow-y-auto">
        <CsvDialogHeader>
          <CsvDialogTitle className="flex items-center">
            <span className="bg-blue-500 text-white p-2 rounded-lg mr-3">
              <FileText size={20} />
            </span>
            Ajuda para Importação de CSV
          </CsvDialogTitle>
          <CsvDialogDescription>
            Aprenda como preparar seu arquivo CSV para importação de produtos
          </CsvDialogDescription>
        </CsvDialogHeader>

        <div className="mt-4 space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 flex items-center">
              <Info size={18} className="mr-2" />
              Formato esperado do CSV
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              O arquivo CSV deve conter pelo menos as colunas: NCM, Nome (ou Descrição) e Preço.
              As colunas podem estar em qualquer ordem, e o separador pode ser vírgula (,) ou ponto-e-vírgula (;).
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Colunas reconhecidas:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium">NCM</p>
                <p className="text-gray-500 text-xs">Códigos alternativos: codigo_ncm</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium">Nome/Descrição</p>
                <p className="text-gray-500 text-xs">Códigos alternativos: descricao, nome, produto, desc</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium">Unidade</p>
                <p className="text-gray-500 text-xs">Códigos alternativos: unidade, un, unit, medida</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium">Quantidade</p>
                <p className="text-gray-500 text-xs">Códigos alternativos: quantidade, qtd, qty</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium">Preço</p>
                <p className="text-gray-500 text-xs">Códigos alternativos: preco, price, valor, unitario</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium">Total</p>
                <p className="text-gray-500 text-xs">Códigos alternativos: total, subtotal, valor_total</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Exemplo de CSV:</h3>
            <div className="bg-gray-900 text-gray-200 p-3 rounded-lg overflow-x-auto text-sm font-mono">
              <pre>NCM;nome;Unidade;Quantidade;preço(R$);Total(R$)
73241000; PIA INOX ACO 430 1,20 X 0,53 LISA;UN;9;135;1.215,00
73241000; PIA INOX ESCORREDOR;UN;4;159,99;639,96
90178090; TRENA 19 X 5 MTS. EMBORRACHADA C/IMA;UN;24;10;240</pre>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg space-y-2 mt-4">
            <h3 className="font-medium text-green-800 flex items-center">
              <Check size={18} className="mr-2" />
              Dicas importantes
            </h3>
            <ul className="text-sm text-green-700 space-y-1 list-disc pl-5">
              <li>Para números decimais, use ponto (.) ou vírgula (,)</li>
              <li>Produtos com mesmo NCM e nome terão suas quantidades somadas</li>
              <li>O código do produto será gerado automaticamente</li>
              <li>Campos vazios receberão valores padrão quando possível</li>
            </ul>
          </div>
        </div>

        <CsvDialogFooter className="mt-6">
          <button
            onClick={handleDownloadExample}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
          >
            <Download size={18} className="mr-2" />
            Baixar Exemplo CSV
          </button>
          <CsvDialogClose asChild>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Fechar
            </button>
          </CsvDialogClose>
        </CsvDialogFooter>
      </CsvDialogContent>
    </CsvDialog>
  );
};

export default CsvHelpDialog; 