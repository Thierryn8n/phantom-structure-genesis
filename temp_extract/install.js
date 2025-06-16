const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Iniciando instalação do Fiscal Flow Printer...');

// Verifica se Node.js e npm estão instalados
exec('node -v', (error) => {
  if (error) {
    console.error('Erro: Node.js não foi encontrado. Por favor, instale o Node.js antes de continuar.');
    process.exit(1);
  }
  
  console.log('Node.js encontrado, continuando instalação...');
  
  // Instala as dependências
  console.log('Instalando dependências...');
  exec('npm install', (error) => {
    if (error) {
      console.error('Erro ao instalar dependências:', error);
      process.exit(1);
    }
    
    console.log('Dependências instaladas com sucesso.');
    
    // Configura inicialização automática (se necessário)
    const configPath = path.join(process.cwd(), 'config.json');
    
    try {
      const configExists = fs.existsSync(configPath);
      const config = configExists 
        ? JSON.parse(fs.readFileSync(configPath, 'utf8')) 
        : { autoStart: true };
      
      if (config.autoStart) {
        console.log('Configurando inicialização automática...');
        
        const startupDir = path.join(
          process.env.APPDATA, 
          'Microsoft', 
          'Windows', 
          'Start Menu', 
          'Programs', 
          'Startup'
        );
        
        const shortcutContent = `
@echo off
start "" "${path.resolve(process.cwd(), 'node_modules/.bin/electron')}" "${path.resolve(process.cwd())}"
        `.trim();
        
        const shortcutPath = path.join(startupDir, 'FiscalFlowPrinter.bat');
        
        try {
          fs.writeFileSync(shortcutPath, shortcutContent);
          console.log('Inicialização automática configurada com sucesso.');
        } catch (err) {
          console.error('Erro ao configurar inicialização automática:', err);
        }
      }
    } catch (err) {
      console.error('Erro ao ler configurações:', err);
    }
    
    console.log('\nInstalação concluída com sucesso!');
    console.log('Para iniciar o aplicativo, execute: npm start');
  });
}); 