const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Iniciando processo de criação do instalador...');

// Verifica se o package.json existe
if (!fs.existsSync(path.join(__dirname, 'package.json'))) {
  console.error('Erro: package.json não encontrado. Execute este script na pasta raiz do projeto.');
  process.exit(1);
}

// Verifica se assets/icon.ico existe, se não, criar um ícone padrão
const iconPath = path.join(__dirname, 'assets', 'icon.ico');
if (!fs.existsSync(iconPath)) {
  console.log('Aviso: Ícone não encontrado. Será usado um ícone padrão.');
  
  // Aqui você poderia adicionar código para criar um ícone padrão
  // Por simplicidade, vamos apenas alertar o usuário
  console.log('IMPORTANTE: Adicione um arquivo icon.ico na pasta assets antes de criar o instalador.');
}

// Instala dependências se necessário
console.log('Verificando e instalando dependências...');
exec('npm install', (error) => {
  if (error) {
    console.error('Erro ao instalar dependências:', error);
    process.exit(1);
  }
  
  // Executa electron-builder para criar o instalador
  console.log('Criando instalador...');
  exec('npm run build', (error) => {
    if (error) {
      console.error('Erro ao criar instalador:', error);
      process.exit(1);
    }
    
    console.log('Instalador criado com sucesso!');
    console.log('O arquivo do instalador está disponível na pasta "dist".');
  });
}); 