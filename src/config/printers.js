/**
 * Configuração das impressoras compatíveis com o sistema
 */

const printers = [
  {
    id: 'tanca-tp-650',
    name: 'Tanca TP-650',
    model: 'TP-650',
    brand: 'Tanca',
    isDefault: true,
    type: 'thermal',
    interfaces: ['USB', 'Serial', 'Ethernet'],
    paperWidth: 80, // mm
    dpi: 203,
    speed: 250, // mm/s
    driver: 'drivers/tanca/driver_tanca_tp650.exe',
    description: 'Impressora térmica de alta velocidade, com guilhotina automática e sistema Easy Load',
    commands: {
      cut: '\x1D\x56\x41\x03', // Comando de corte
      openDrawer: '\x1B\x70\x00\x19\x19', // Comando para abrir gaveta
      align: {
        left: '\x1B\x61\x00',
        center: '\x1B\x61\x01',
        right: '\x1B\x61\x02'
      },
      font: {
        normal: '\x1B\x21\x00',
        bold: '\x1B\x21\x08',
        doubleHeight: '\x1B\x21\x10',
        doubleWidth: '\x1B\x21\x20',
        underline: '\x1B\x21\x80'
      }
    }
  },
  {
    id: 'hp-deskjet-2700',
    name: 'HP DeskJet 2700',
    model: 'DeskJet 2700',
    brand: 'HP',
    isDefault: false,
    type: 'inkjet',
    interfaces: ['USB', 'WiFi'],
    paperWidth: 210, // mm (A4)
    dpi: 1200,
    speed: 7.5, // ppm
    driver: 'https://support.hp.com/drivers/deskjet-2700',
    description: 'Impressora jato de tinta com suporte a impressão sem fio'
  }
];

export default printers;

/**
 * Obter a impressora padrão do sistema
 * @returns {Object} Objeto com a configuração da impressora padrão
 */
export const getDefaultPrinter = () => {
  return printers.find(printer => printer.isDefault === true) || printers[0];
};

/**
 * Obter uma impressora pelo ID
 * @param {string} id - ID da impressora
 * @returns {Object|null} Objeto com a configuração da impressora ou null se não encontrada
 */
export const getPrinterById = (id) => {
  return printers.find(printer => printer.id === id) || null;
}; 