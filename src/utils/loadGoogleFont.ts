// Conjunto para manter o registro de fontes já carregadas
const loadedFonts = new Set<string>();

// Função utilitária para carregar uma fonte do Google Fonts
export function loadGoogleFont(fontFamily: string) {
  if (!fontFamily) return;
  
  // Remove aspas e pega apenas o nome base
  const cleanFont = fontFamily.replace(/['"]/g, '').split(',')[0].trim();
  
  // Verifica se a fonte já foi carregada anteriormente
  if (loadedFonts.has(cleanFont)) {
    return;
  }
  
  const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(cleanFont)}:wght@400;500;700&display=swap`;

  // Busca por um elemento link de fontes existente ou cria um novo
  let linkElement = document.getElementById('google-fonts') as HTMLLinkElement;
  
  if (!linkElement) {
    // Se não existir, cria um novo elemento
    linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.id = 'google-fonts';
    linkElement.setAttribute('data-loaded-fonts', cleanFont);
    linkElement.href = fontUrl;
    document.head.appendChild(linkElement);
  } else {
    // Se já existir, adiciona a nova fonte à URL existente se não estiver presente
    const currentFontsAttr = linkElement.getAttribute('data-loaded-fonts') || '';
    const currentFonts = currentFontsAttr.split(',');
    
    if (!currentFonts.includes(cleanFont)) {
      // Atualiza o atributo com a nova fonte
      const updatedFonts = [...currentFonts, cleanFont].filter(Boolean).join(',');
      linkElement.setAttribute('data-loaded-fonts', updatedFonts);
      
      // Reconstrói a URL com várias famílias
      const families = updatedFonts.split(',').map(font => `family=${encodeURIComponent(font.trim())}:wght@400;500;700`).join('&');
      linkElement.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    }
  }
  
  // Marca a fonte como carregada em nossa aplicação
  loadedFonts.add(cleanFont);
} 