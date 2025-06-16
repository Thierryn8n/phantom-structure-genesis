// Index de serviços - parte do sistema com tema visual de grade (grid lines)
export * from './notesService';
export * from './thumbnailService';
export * from './printService';
export * from './customersService';
export * from './productsService';

// Re-exportar para facilitar o uso em outros módulos
import { NotesService } from './notesService';
import { ThumbnailService } from './thumbnailService';
import { PrintService } from './printService';
import { CustomersService } from './customersService';
import { ProductsService } from './productsService';

export default {
  NotesService,
  ThumbnailService,
  PrintService,
  CustomersService,
  ProductsService
}; 